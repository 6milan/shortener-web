import type {
  AuthResponse, CreateLinkInput, LinkStats, ListParams, Paginated, ShortLink, Summary,
  UpdateLinkInput, User,
} from './types';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// ------------------------------------------------------------------ errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message: string,
    public retryAfter: number | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Validation errors from DRF look like {field: ["message"]}. Flatten to {field: "message"}.
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (this.data && typeof this.data === 'object' && !Array.isArray(this.data)) {
      for (const [key, value] of Object.entries(this.data as Record<string, unknown>)) {
        if (key === 'detail') continue;
        out[key] = Array.isArray(value) ? String(value[0]) : String(value);
      }
    }
    return out;
  }
}

function messageFor(status: number, data: unknown, retryAfter: number | null): string {
  if (status === 429) {
    return retryAfter
      ? `Too many requests. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`
      : 'Too many requests. Please slow down.';
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === 'string') return record.detail;
    const first = Object.values(record)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  if (status >= 500) return 'The server had a problem. Please try again.';
  return 'Something went wrong.';
}

// ------------------------------------------------------------ token storage
// Tokens live in localStorage so a refresh keeps you signed in. Trade-off: any XSS bug can read
// them. The access token is short-lived (15 min) and refresh tokens rotate, which limits damage.
const ACCESS_KEY = 'snipp.access';
const REFRESH_KEY = 'snipp.refresh';
const browser = () => typeof window !== 'undefined';

export const tokens = {
  get access() { return browser() ? localStorage.getItem(ACCESS_KEY) : null; },
  get refresh() { return browser() ? localStorage.getItem(REFRESH_KEY) : null; },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (!browser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const LOGOUT_EVENT = 'snipp:logout';
function expireSession() {
  tokens.clear();
  if (browser()) window.dispatchEvent(new Event(LOGOUT_EVENT));
}

// ------------------------------------------------------------ token refresh
// Many requests can hit 401 at once when the access token expires. Only ONE refresh may run,
// because refresh tokens rotate: a second refresh with the old token would be rejected and log the
// user out. `inflight` shares one promise inside this tab; the Web Locks API shares it across tabs.
let inflight: Promise<string | null> | null = null;

async function callRefresh(staleAccess: string | null): Promise<string | null> {
  // Another tab may already have refreshed while we waited for the lock.
  const current = tokens.access;
  if (current && current !== staleAccess) return current;

  const refresh = tokens.refresh;
  if (!refresh) { expireSession(); return null; }
  try {
    const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.status === 401 || res.status === 400) { expireSession(); return null; }
    if (!res.ok) return null; // 429 / 5xx: keep the session, let the caller fail
    const data = (await res.json()) as { access: string; refresh?: string };
    tokens.set(data.access, data.refresh ?? refresh);
    return data.access;
  } catch {
    return null; // network error: do not log the user out
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!inflight) {
    const stale = tokens.access;
    const run = (): Promise<string | null> => callRefresh(stale);
    const locks = browser() ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
    const started: Promise<string | null> = locks
      ? (locks.request("snipp-refresh", run) as unknown as Promise<string | null>)
      : run();
    inflight = started.finally(() => { inflight = null; });
  }
  return inflight;
}

// ----------------------------------------------------------------- requests
type Primitive = string | number | boolean | null | undefined;
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  params?: Record<string, Primitive>;
  signal?: AbortSignal;
}
interface RawResponse<T> { data: T; status: number; headers: Headers }

async function requestRaw<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<RawResponse<T>> {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(opts.params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const useAuth = opts.auth !== false;
  const sentToken = tokens.access;
  if (useAuth && sentToken) headers.Authorization = `Bearer ${sentToken}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, null, 'Cannot reach the server. Check your connection.');
  }

  if (res.status === 401 && useAuth && !retried) {
    const fresh = await refreshAccessToken();
    if (fresh) return requestRaw<T>(path, opts, true);
  }

  const text = res.status === 204 ? '' : await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const header = res.headers.get('Retry-After');
    const retryAfter = header && !Number.isNaN(Number(header)) ? Math.ceil(Number(header)) : null;
    throw new ApiError(res.status, data, messageFor(res.status, data, retryAfter), retryAfter);
  }
  return { data: data as T, status: res.status, headers: res.headers };
}

async function request<T>(path: string, opts?: RequestOptions): Promise<T> {
  return (await requestRaw<T>(path, opts)).data;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------- API
export const api = {
  // auth
  register: (body: { username: string; email: string; password: string; password2: string }) =>
    request<AuthResponse>('/api/auth/register/', { method: 'POST', body, auth: false }),
  login: (body: { username: string; password: string }) =>
    request<AuthResponse>('/api/auth/login/', { method: 'POST', body, auth: false }),
  google: (idToken: string) =>
    request<AuthResponse>('/api/auth/google/', { method: 'POST', body: { id_token: idToken }, auth: false }),
  logout: (refresh: string) =>
    request<void>('/api/auth/logout/', { method: 'POST', body: { refresh }, auth: false }),
  me: () => request<User>('/api/auth/me/'),
  updateMe: (body: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>>) =>
    request<User>('/api/auth/me/', { method: 'PATCH', body }),
  changePassword: (body: { old_password: string; new_password: string }) =>
    request<{ detail: string }>('/api/auth/change-password/', { method: 'POST', body }),

  // links
  listLinks: (params: ListParams, signal?: AbortSignal) =>
    request<Paginated<ShortLink>>('/api/urls/', { params: params as Record<string, Primitive>, signal }),
  updateLink: (code: string, body: UpdateLinkInput) =>
    request<ShortLink>(`/api/urls/${code}/`, { method: 'PATCH', body }),
  deleteLink: (code: string) => request<void>(`/api/urls/${code}/`, { method: 'DELETE' }),
  stats: (code: string, days: number) =>
    request<LinkStats>(`/api/urls/${code}/stats/`, { params: { days } }),
  summary: () => request<Summary>('/api/urls/summary/'),

  /**
   * Create a link safely. The SAME idempotency key is sent on every automatic retry, so even if the
   * first attempt reached the server and only the response was lost, no duplicate is created.
   * Retries: network errors and 502/503/504 (backoff), 409 (original still running), one 429.
   */
  async createLink(body: CreateLinkInput, idempotencyKey: string) {
    let rateLimited = false;
    for (let attempt = 0; ; attempt++) {
      try {
        const { data, status, headers } = await requestRaw<ShortLink>('/api/urls/', {
          method: 'POST',
          body,
          headers: { 'Idempotency-Key': idempotencyKey },
        });
        return {
          link: data,
          existing: status === 200, // same URL already shortened: the API returned that link
          replayed: headers.get('Idempotent-Replayed') === 'true',
        };
      } catch (error) {
        if (!(error instanceof ApiError) || attempt >= 3) throw error;
        const transient = error.status === 0 || [502, 503, 504, 409].includes(error.status);
        if (transient) {
          await sleep(error.retryAfter ? error.retryAfter * 1000 : 400 * 2 ** attempt);
          continue;
        }
        if (error.status === 429 && !rateLimited && (error.retryAfter ?? 99) <= 10) {
          rateLimited = true;
          await sleep((error.retryAfter ?? 1) * 1000);
          continue;
        }
        throw error;
      }
    }
  },

  qrUrl: (code: string, size = 10) => `${API_URL}/api/qr/${code}/?size=${size}`,
};
