/**
 * Shared transport for the Slimora AI proxy (Cloudflare Worker).
 *
 * The provider keys used to be read from EXPO_PUBLIC_* env vars and sent
 * straight to Groq/OpenRouter from the device. Anything prefixed EXPO_PUBLIC_
 * is inlined into the JS bundle at build time, so those keys shipped inside
 * every APK in plain text. They now live only as Worker secrets.
 *
 * The proxy URL itself is not sensitive — the Worker verifies a Firebase ID
 * token on every request, so knowing the address gets you nothing.
 */
import { auth } from '../lib/firebase';

const BASE_URL = (process.env.EXPO_PUBLIC_AI_PROXY_URL || '').replace(/\/$/, '');

export type ProxyErrorCode =
  | 'not_configured'
  | 'unauthenticated'
  | 'quota_exceeded'
  | 'invalid_argument'
  | 'unavailable'
  | 'network'
  | 'unknown';

export class ProxyError extends Error {
  readonly code: ProxyErrorCode;

  constructor(code: ProxyErrorCode, message: string) {
    super(message);
    this.name = 'ProxyError';
    this.code = code;
  }
}

function codeForStatus(status: number): ProxyErrorCode {
  switch (status) {
    case 400:
      return 'invalid_argument';
    case 401:
      return 'unauthenticated';
    case 429:
      return 'quota_exceeded';
    case 503:
      return 'unavailable';
    default:
      return 'unknown';
  }
}

export async function callProxy<T>(path: '/chat' | '/vision', body: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new ProxyError('not_configured', 'EXPO_PUBLIC_AI_PROXY_URL is not set.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new ProxyError('unauthenticated', 'Not signed in.');
  }

  // Returns a cached token until it is close to expiry, then refreshes.
  const token = await user.getIdToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ProxyError('network', String(e));
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const err = (await response.json()) as { message?: string };
      if (err?.message) message = err.message;
    } catch {
      // Non-JSON error body — keep the status line.
    }
    throw new ProxyError(codeForStatus(response.status), message);
  }

  return (await response.json()) as T;
}
