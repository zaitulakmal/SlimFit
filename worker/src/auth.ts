/**
 * Firebase ID token verification, done with WebCrypto only — no npm deps.
 *
 * This is the security boundary of the whole proxy. Without it the Worker URL
 * is an open, unauthenticated gateway to our paid provider keys, which would
 * be no better than shipping the keys in the app.
 *
 * We verify against Google's published JWKS rather than trusting any claim in
 * the token, and we check issuer/audience/expiry explicitly — a validly signed
 * token from a *different* Firebase project must not be accepted.
 */

interface JwkSet {
  keys: (JsonWebKey & { kid: string })[];
}

// The JWK endpoint (not the x509 one) — crypto.subtle.importKey speaks JWK
// natively, whereas the X.509 PEM certs would need manual DER parsing.
const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

// Google rotates these keys roughly daily and sends a Cache-Control max-age.
// Cached per isolate so we are not fetching on every request.
let keyCache: { keys: Map<string, CryptoKey>; expiresAt: number } | null = null;

function parseMaxAge(header: string | null): number {
  const m = header?.match(/max-age=(\d+)/);
  const v = m ? parseInt(m[1], 10) : NaN;
  return Number.isFinite(v) && v > 0 ? v : 3600;
}

async function getSigningKey(kid: string): Promise<CryptoKey | null> {
  const now = Date.now();

  if (!keyCache || keyCache.expiresAt <= now) {
    const res = await fetch(JWKS_URL);
    if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);

    const body = (await res.json()) as JwkSet;
    const keys = new Map<string, CryptoKey>();

    for (const jwk of body.keys ?? []) {
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['verify']
        );
        keys.set(jwk.kid, key);
      } catch {
        // Skip a malformed entry rather than failing the whole set.
      }
    }

    keyCache = {
      keys,
      expiresAt: now + parseMaxAge(res.headers.get('cache-control')) * 1000,
    };
  }

  return keyCache.keys.get(kid) ?? null;
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

/**
 * Returns the Firebase uid if the token is genuine and current, else null.
 * Never throws on a malformed token — only on infrastructure failure.
 */
export async function verifyIdToken(token: string, projectId: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = b64urlToJson(headerB64);
    payload = b64urlToJson(payloadB64);
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

  const key = await getSigningKey(header.kid);
  if (!key) return null;

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );
  if (!valid) return null;

  // Signature is good; now the claims must match *our* project specifically.
  const now = Math.floor(Date.now() / 1000);
  const { aud, iss, sub, exp, iat } = payload as {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
  };

  if (aud !== projectId) return null;
  if (iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof sub !== 'string' || sub.length === 0) return null;
  if (typeof exp !== 'number' || exp <= now) return null;
  // 5 minutes of tolerance for device clock skew.
  if (typeof iat !== 'number' || iat > now + 300) return null;

  return sub;
}
