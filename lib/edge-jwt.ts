export interface EdgeJWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  exp?: number;
  nbf?: number;
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function safeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

/** Edge-runtime compatible verification for the HS256 token issued by lib/jwt.ts. */
export async function verifyEdgeToken(
  token: string,
  secret: string,
): Promise<EdgeJWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader)));
    if (header?.alg !== 'HS256' || header?.typ !== 'JWT') return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
      ),
    );
    if (!safeEqual(signature, decodeBase64Url(encodedSignature))) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as EdgeJWTPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp !== undefined && payload.exp <= now) return null;
    if (payload.nbf !== undefined && payload.nbf > now) return null;
    if (!Number.isInteger(payload.userId) || !payload.username || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}
