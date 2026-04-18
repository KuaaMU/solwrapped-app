// Volcengine 即梦 4.0 (jimeng_t2i_v40) image generation.
// Async flow: submit task → poll GetResult until status=done → download PNG.
//
// Free-tier note: 即梦 4.0 caps concurrent submits per account. We serialize
// submits through a tiny in-process semaphore (CARD_VOLC_CONCURRENCY, default 1)
// and retry once on HTTP 429.

import { signRequest } from './volcengine-sign';

const HOST = 'visual.volcengineapi.com';
const REGION = 'cn-north-1';
const SERVICE = 'cv';
const VERSION = '2022-08-31';
const REQ_KEY = 'jimeng_t2i_v40';

const GEN_WIDTH = 2560;
const GEN_HEIGHT = 1440;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;
const RATE_LIMIT_BACKOFF_MS = 6000;

export interface VolcImageRequest {
  prompt: string;
  address: string;
}

function getCreds(): { ak: string; sk: string } | null {
  const ak = process.env.VOLC_ACCESS_KEY_ID?.trim();
  const sk = process.env.VOLC_SECRET_ACCESS_KEY?.trim();
  if (!ak || !sk) return null;
  return { ak, sk };
}

// ---- in-process concurrency gate ----
function getMaxConcurrent(): number {
  const raw = parseInt(process.env.CARD_VOLC_CONCURRENCY ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

let active = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  const max = getMaxConcurrent();
  if (active < max) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  active += 1;
}

function releaseSlot(): void {
  active -= 1;
  const next = waiters.shift();
  if (next) next();
}

interface CallResult {
  data: unknown | null;
  rateLimited: boolean;
}

async function callVolc(action: string, body: Record<string, unknown>): Promise<CallResult> {
  const creds = getCreds();
  if (!creds) return { data: null, rateLimited: false };

  const payload = JSON.stringify(body);
  const { url, headers } = signRequest({
    accessKeyId: creds.ak,
    secretAccessKey: creds.sk,
    region: REGION,
    service: SERVICE,
    method: 'POST',
    host: HOST,
    path: '/',
    query: { Action: action, Version: VERSION },
    body: payload,
  });

  const res = await fetch(url, { method: 'POST', headers, body: payload });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[volcengine] ${action} http ${res.status}:`, text);
    // 429 surfaces either at the HTTP layer or as code 50430 in the JSON body.
    const rateLimited = res.status === 429 || text.includes('50430');
    return { data: null, rateLimited };
  }
  const json = await res.json();
  if (json.code !== 10000) {
    console.error(`[volcengine] ${action} code ${json.code}:`, json.message);
    return { data: null, rateLimited: json.code === 50430 };
  }
  return { data: json.data, rateLimited: false };
}

interface SubmitResult { task_id: string }
interface QueryResult {
  status: 'in_queue' | 'generating' | 'done' | 'not_found' | 'expired';
  image_urls?: string[] | null;
  binary_data_base64?: string[] | null;
}

async function submitTask(req: VolcImageRequest): Promise<string | null> {
  let attempt = 0;
  while (attempt < 2) {
    const { data, rateLimited } = await callVolc('CVSync2AsyncSubmitTask', {
      req_key: REQ_KEY,
      prompt: req.prompt,
      width: GEN_WIDTH,
      height: GEN_HEIGHT,
      scale: 0.5,
      force_single: true,
    });
    if (data) return (data as SubmitResult).task_id ?? null;
    if (!rateLimited) return null;
    attempt += 1;
    if (attempt < 2) {
      console.warn(`[volcengine] submit rate-limited, retrying in ${RATE_LIMIT_BACKOFF_MS}ms`);
      await new Promise((r) => setTimeout(r, RATE_LIMIT_BACKOFF_MS));
    }
  }
  return null;
}

async function pollResult(taskId: string): Promise<string | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  const reqJson = JSON.stringify({
    return_url: true,
    logo_info: { add_logo: false },
  });

  while (Date.now() < deadline) {
    const { data } = await callVolc('CVSync2AsyncGetResult', {
      req_key: REQ_KEY,
      task_id: taskId,
      req_json: reqJson,
    });

    if (!data) return null;
    const result = data as QueryResult;
    if (result.status === 'done') {
      return result.image_urls?.[0] ?? null;
    }
    if (result.status === 'not_found' || result.status === 'expired') {
      console.error(`[volcengine] task ${taskId} ${result.status}`);
      return null;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  console.error(`[volcengine] task ${taskId} timed out`);
  return null;
}

/**
 * Generate an image via 即梦 4.0. Returns raw JPEG/PNG bytes or null on any failure.
 * Serializes against the in-process slot to respect the free-tier concurrency cap.
 */
export async function generateVolcImage(req: VolcImageRequest): Promise<Buffer | null> {
  await acquireSlot();
  try {
    const taskId = await submitTask(req);
    if (!taskId) return null;

    const imageUrl = await pollResult(taskId);
    if (!imageUrl) return null;

    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.error('[volcengine] image fetch failed:', res.status);
      return null;
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (err) {
    console.error('[volcengine] generation failed:', err);
    return null;
  } finally {
    releaseSlot();
  }
}

export function hasVolcCredentials(): boolean {
  return getCreds() !== null;
}
