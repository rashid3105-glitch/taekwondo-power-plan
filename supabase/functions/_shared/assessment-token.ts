// Signerede tokens til klubanalysen.
// - "profile": kortlivet (30 min), engangsbrug, binder profil-opdateringen til
//   den række, kalderen netop har oprettet.
// - "unsub":   langlivet, bruges i afmeld-linket i rapportmailen.

const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return b64url(new Uint8Array(sig))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export type TokenPurpose = 'profile' | 'unsub'

/** exp = unix-sekunder, 0 = uden udløb */
export async function signToken(
  secret: string,
  purpose: TokenPurpose,
  id: string,
  ttlSeconds: number,
): Promise<string> {
  const exp = ttlSeconds > 0 ? Math.floor(Date.now() / 1000) + ttlSeconds : 0
  const payload = `${purpose}.${id}.${exp}`
  const sig = await hmac(secret, payload)
  return `${payload}.${sig}`
}

export async function verifyToken(
  secret: string,
  purpose: TokenPurpose,
  token: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: 'invalid' | 'expired' }> {
  const parts = (token || '').split('.')
  if (parts.length !== 4) return { ok: false, reason: 'invalid' }
  const [p, id, expStr, sig] = parts
  if (p !== purpose) return { ok: false, reason: 'invalid' }
  const expected = await hmac(secret, `${p}.${id}.${expStr}`)
  if (!timingSafeEqual(sig, expected)) return { ok: false, reason: 'invalid' }
  const exp = Number(expStr)
  if (!Number.isFinite(exp)) return { ok: false, reason: 'invalid' }
  if (exp > 0 && exp < Math.floor(Date.now() / 1000)) return { ok: false, reason: 'expired' }
  return { ok: true, id }
}
