const encoder = new TextEncoder();
// A Stripe Checkout session id, or a redeemed free-code subject (code_<name>).
const SESSION_ID = /^(?:cs_(?:test|live)_[A-Za-z0-9]+|code_[a-z0-9]{2,40})$/;

async function keyFor(secret, usages) {
  if (typeof secret !== 'string' || !secret) throw new Error('Missing signing configuration');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

export async function hmacHex(secret, message) {
  const signature = await crypto.subtle.sign('HMAC', await keyFor(secret, ['sign']), encoder.encode(message));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyHmac(secret, message, signature) {
  if (!secret || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/../g), byte => parseInt(byte, 16));
  // Native WebCrypto verifies the MAC without a JavaScript string comparison.
  return crypto.subtle.verify('HMAC', await keyFor(secret, ['verify']), bytes, encoder.encode(message));
}

const SKU = /^[a-z0-9-]{3,48}$/;

export async function signDownloadToken(sessionId, secret, exp, sku = 'file') {
  if (!SESSION_ID.test(sessionId) || !SKU.test(sku) || !Number.isSafeInteger(exp) || exp <= 0) throw new Error('Invalid token payload');
  const payload = `${sessionId}|${sku}|${exp}`;
  return `${payload}|${await hmacHex(secret, payload)}`;
}

export async function verifyDownloadToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string' || token.length > 512) return null;
  const parts = token.split('|');
  if (parts.length !== 4) return null;
  const [sessionId, sku, timestamp, signature] = parts;
  const exp = Number(timestamp);
  if (!SESSION_ID.test(sessionId) || !SKU.test(sku) || !/^[1-9]\d{0,15}$/.test(timestamp) || !Number.isSafeInteger(exp) || exp <= nowSeconds) return null;
  if (!await verifyHmac(secret, `${sessionId}|${sku}|${timestamp}`, signature)) return null;
  return { sessionId, sku, exp };
}

export async function verifyStripeSignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof header !== 'string' || header.length > 4096 || !secret) return false;
  const fields = header.split(',').map(field => field.trim().split('='));
  const timestamps = fields.filter(([name]) => name === 't');
  if (timestamps.length !== 1 || !/^\d{1,16}$/.test(timestamps[0][1])) return false;
  const timestamp = Number(timestamps[0][1]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
  for (const [name, signature] of fields) {
    if (name === 'v1' && await verifyHmac(secret, `${timestamps[0][1]}.${rawBody}`, signature)) return true;
  }
  return false;
}

export async function secretsEqual(actual, expected) {
  if (typeof actual !== 'string' || !expected || actual.length > 1024) return false;
  // Hash both inputs to fixed-length buffers before the constant-work comparison.
  const [a, b] = await Promise.all([actual, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}
