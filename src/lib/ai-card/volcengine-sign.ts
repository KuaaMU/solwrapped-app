// Volcengine Signature V4 — HMAC-SHA256 AWS-style signing.
// Reference: https://www.volcengine.com/docs/6369/67269

import { createHash, createHmac } from 'crypto';

const ALGO = 'HMAC-SHA256';
const SIGNED_HEADERS = 'content-type;host;x-content-sha256;x-date';

export interface SignInput {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  method: string;
  host: string;
  path: string;
  query: Record<string, string>;
  body: string;
}

export interface SignedRequest {
  url: string;
  headers: Record<string, string>;
}

function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

// Volcengine uses strict URI encoding: all reserved chars except unreserved encoded.
function encodeRFC3986(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function buildCanonicalQuery(query: Record<string, string>): string {
  return Object.keys(query)
    .sort()
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(query[k])}`)
    .join('&');
}

/** Sign a Volcengine request. Returns the URL and headers to use. */
export function signRequest(input: SignInput): SignedRequest {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = now.getUTCFullYear();
  const mo = pad(now.getUTCMonth() + 1);
  const d = pad(now.getUTCDate());
  const h = pad(now.getUTCHours());
  const mi = pad(now.getUTCMinutes());
  const s = pad(now.getUTCSeconds());
  const xDate = `${y}${mo}${d}T${h}${mi}${s}Z`;
  const shortDate = xDate.slice(0, 8);

  const payloadHash = sha256Hex(input.body);
  const canonicalQuery = buildCanonicalQuery(input.query);

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${input.host}\n` +
    `x-content-sha256:${payloadHash}\n` +
    `x-date:${xDate}\n`;

  const canonicalRequest = [
    input.method,
    input.path,
    canonicalQuery,
    canonicalHeaders,
    SIGNED_HEADERS,
    payloadHash,
  ].join('\n');

  const credentialScope = `${shortDate}/${input.region}/${input.service}/request`;
  const stringToSign = [
    ALGO,
    xDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(input.secretAccessKey, shortDate);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, input.service);
  const kSigning = hmac(kService, 'request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `${ALGO} Credential=${input.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${SIGNED_HEADERS}, Signature=${signature}`;

  const url = `https://${input.host}${input.path}?${canonicalQuery}`;

  return {
    url,
    headers: {
      'Content-Type': 'application/json',
      Host: input.host,
      'X-Content-Sha256': payloadHash,
      'X-Date': xDate,
      Authorization: authorization,
    },
  };
}
