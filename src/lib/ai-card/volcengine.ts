// Volcengine 即梦 4.0 (jimeng_t2i_v40) image generation.
// Async flow: submit task → poll GetResult until status=done → download PNG.

import { signRequest } from './volcengine-sign';

const HOST = 'visual.volcengineapi.com';
const REGION = 'cn-north-1';
const SERVICE = 'cv';
const VERSION = '2022-08-31';
const REQ_KEY = 'jimeng_t2i_v40';

// Target output dimensions — spec recommends 2K 16:9 = 2560x1440. Well within
// the [1024*1024, 4096*4096] area constraint, crops cleanly to 1200x630.
const GEN_WIDTH = 2560;
const GEN_HEIGHT = 1440;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;

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

async function callVolc(action: string, body: Record<string, unknown>): Promise<unknown | null> {
  const creds = getCreds();
  if (!creds) return null;

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
    console.error(`[volcengine] ${action} http ${res.status}:`, await res.text());
    return null;
  }
  const json = await res.json();
  if (json.code !== 10000) {
    console.error(`[volcengine] ${action} code ${json.code}:`, json.message);
    return null;
  }
  return json.data;
}

interface SubmitResult { task_id: string }
interface QueryResult {
  status: 'in_queue' | 'generating' | 'done' | 'not_found' | 'expired';
  image_urls?: string[] | null;
  binary_data_base64?: string[] | null;
}

async function submitTask(req: VolcImageRequest): Promise<string | null> {
  const data = (await callVolc('CVSync2AsyncSubmitTask', {
    req_key: REQ_KEY,
    prompt: req.prompt,
    width: GEN_WIDTH,
    height: GEN_HEIGHT,
    scale: 0.5,
    force_single: true,
  })) as SubmitResult | null;
  return data?.task_id ?? null;
}

async function pollResult(taskId: string): Promise<string | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  const reqJson = JSON.stringify({
    return_url: true,
    logo_info: { add_logo: false },
  });

  while (Date.now() < deadline) {
    const data = (await callVolc('CVSync2AsyncGetResult', {
      req_key: REQ_KEY,
      task_id: taskId,
      req_json: reqJson,
    })) as QueryResult | null;

    if (!data) return null;
    if (data.status === 'done') {
      const url = data.image_urls?.[0];
      return url ?? null;
    }
    if (data.status === 'not_found' || data.status === 'expired') {
      console.error(`[volcengine] task ${taskId} ${data.status}`);
      return null;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  console.error(`[volcengine] task ${taskId} timed out`);
  return null;
}

/**
 * Generate an image via 即梦 4.0. Returns raw JPEG/PNG bytes or null on any failure.
 */
export async function generateVolcImage(req: VolcImageRequest): Promise<Buffer | null> {
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
  }
}

export function hasVolcCredentials(): boolean {
  return getCreds() !== null;
}
