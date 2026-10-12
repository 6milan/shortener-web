import assert from 'node:assert/strict';

// minimal browser shims
const store = new Map<string, string>();
(globalThis as any).window = { dispatchEvent() { return true; } };
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
(globalThis as any).Event = class { constructor(public type: string) {} };

const calls: { url: string; auth?: string; key?: string }[] = [];
let refreshCount = 0; let createAttempts = 0;
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

(globalThis as any).fetch = async (url: URL | string, init: any = {}) => {
  const u = String(url); const h = init.headers ?? {};
  calls.push({ url: u, auth: h.Authorization, key: h['Idempotency-Key'] });
  if (u.endsWith('/api/auth/token/refresh/')) { refreshCount++; await new Promise((r) => setTimeout(r, 30)); return json(200, { access: 'NEW', refresh: 'R2' }); }
  if (u.endsWith('/api/urls/summary/')) return h.Authorization === 'Bearer NEW' ? json(200, { total_links: 1 }) : json(401, { detail: 'expired' });
  if (u.endsWith('/api/urls/') && init.method === 'POST') {
    createAttempts++;
    if (createAttempts === 1) throw new TypeError('network down');
    if (createAttempts === 2) return json(503, { detail: 'busy' });
    return json(201, { short_code: 'abc123' }, { 'Idempotent-Replayed': 'true' });
  }
  return json(404, {});
};

(async () => {
  const { api, tokens, ApiError } = await import('../lib/api');
  tokens.set('OLD', 'R1');

  // 1. three parallel requests hit 401: exactly ONE refresh, all succeed with the new token
  const res = await Promise.all([api.summary(), api.summary(), api.summary()]);
  assert.equal(refreshCount, 1, 'refresh must be single-flight');
  assert.equal(res.length, 3);
  assert.equal(tokens.access, 'NEW'); assert.equal(tokens.refresh, 'R2');
  console.log('ok  single-flight refresh (3 parallel 401s -> 1 refresh), refresh token rotated');

  // 2. createLink retries on network error and 503 with the SAME idempotency key
  const out = await api.createLink({ original_url: 'https://example.com' }, 'key-123456789');
  const keys = calls.filter((c) => c.url.endsWith('/api/urls/')).map((c) => c.key);
  assert.deepEqual(keys, ['key-123456789', 'key-123456789', 'key-123456789']);
  assert.equal(out.replayed, true); assert.equal(out.link.short_code, 'abc123');
  console.log('ok  createLink: network error + 503 retried 3x with the same Idempotency-Key, replay flag read');

  // 3. validation errors are not retried and expose field errors
  (globalThis as any).fetch = async () => json(400, { original_url: ['Enter a valid URL.'] });
  await assert.rejects(api.createLink({ original_url: 'x' }, 'key-abcdefgh1'), (e: any) =>
    e instanceof ApiError && e.fieldErrors.original_url === 'Enter a valid URL.');
  console.log('ok  400 -> ApiError.fieldErrors, no retry');

  // 4. 429 message uses Retry-After
  (globalThis as any).fetch = async () => json(429, { detail: 'Request was throttled.' }, { 'Retry-After': '42' });
  await assert.rejects(api.me(), (e: any) => e.status === 429 && e.retryAfter === 42 && /42 seconds/.test(e.message));
  console.log('ok  429 -> friendly message with Retry-After seconds');

  // 5. rejected refresh token logs the user out (tokens cleared)
  (globalThis as any).fetch = async (u: any) => String(u).includes('token/refresh') ? json(401, { detail: 'blacklisted' }) : json(401, {});
  tokens.set('OLD2', 'DEADREFRESH');
  await assert.rejects(api.me(), (e: any) => e.status === 401);
  assert.equal(tokens.access, null);
  console.log('ok  rejected refresh token clears the session');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
