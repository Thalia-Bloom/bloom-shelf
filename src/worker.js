import { signDownloadToken, verifyDownloadToken, verifyStripeSignature, secretsEqual } from './security.js';
import { indexPage, productPage, contentPage } from './pages.js';
import { VERSION, SUPPORT, SELLER, SKUS, skuList, getSku, priceLabel } from './catalog.js';

const WEEK = 7 * 24 * 60 * 60;
const INDEXNOW_KEY = '2ccb2f2372faa996c79e07fd38870be0';

function liveMode(env) { return env.STRIPE_MODE === 'live'; }
function sessionIdOK(id, env) {
  return typeof id === 'string' && new RegExp(`^cs_${liveMode(env) ? 'live' : 'test'}_[A-Za-z0-9]+$`).test(id);
}
function publicBase(env) {
  const url = new URL(env.PUBLIC_BASE_URL);
  if (url.protocol !== 'https:' || url.hostname.endsWith('.invalid') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid public URL');
  return url.origin;
}
function stripeKey(env) {
  const suffix = liveMode(env) ? 'live_' : 'test_';
  const key = env.STRIPE_SECRET_KEY;
  if (typeof key !== 'string' || !(key.startsWith('sk_' + suffix) || key.startsWith('rk_' + suffix))) throw new Error('Payment configuration unavailable');
  return key;
}
function originOK(origin, url, env) {
  if (!origin) return true;
  return origin === url.origin || origin === publicBase(env);
}
function doorConfigured(env) {
  return Boolean(env?.DOOR_URL) && Boolean(env?.DOOR_KEY);
}
export function sessionUnlocked(session) {
  if (session?.payment_status === 'paid') return true;
  return session?.payment_status === 'no_payment_required' && session.status === 'complete' && session.amount_total === 0;
}

function response(body, status = 200, type = 'text/html; charset=utf-8') {
  return new Response(body, { status, headers: { 'Content-Type': type } });
}
function json(body, status = 200) { return response(JSON.stringify(body), status, 'application/json; charset=utf-8'); }
function page(title, body, env, status = 200) { return response(contentPage(title, body, env), status); }

async function stripeFetch(path, env, body) {
  const result = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${stripeKey(env)}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    ...(body ? { body: body.toString() } : {}),
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error('Payment provider unavailable');
  return result.json();
}

export function buildCheckoutBody(env, sku, source = 'direct') {
  if (!sku || Number(sku.price_cents) < 100) throw new Error('Invalid price configuration');
  const base = publicBase(env);
  const acquisition = source === 'github' ? 'github' : 'direct';
  return new URLSearchParams({
    mode: 'payment',
    'payment_method_types[0]': 'card',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(sku.price_cents),
    'line_items[0][price_data][product_data][name]': `${sku.name}, one-time download`,
    allow_promotion_codes: 'true',
    'metadata[project_id]': sku.project_id,
    'metadata[sku]': sku.slug,
    'metadata[acquisition_source]': acquisition,
    success_url: `${base}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/p/${sku.slug}`,
  });
}

function knownProjectIds() {
  return new Set(skuList().map(sku => sku.project_id));
}

function skuFromSession(session) {
  const slug = session?.metadata?.sku;
  const sku = getSku(slug);
  if (!sku) return null;
  if (session?.metadata?.project_id !== sku.project_id) return null;
  return sku;
}

export function scorecard(receipts, observedAt = new Date().toISOString()) {
  const ids = knownProjectIds();
  const eligible = receipts.filter(receipt => ids.has(receipt.project_id) && receipt.payment_status === 'paid' &&
    receipt.currency?.toLowerCase() === 'usd' && Number.isSafeInteger(receipt.amount_total) && receipt.amount_total >= 0);
  const confirmed = eligible.filter(receipt => receipt.livemode === true);
  const test = eligible.filter(receipt => receipt.livemode === false);
  const sum = values => values.reduce((total, receipt) => total + receipt.amount_total, 0);
  const bySku = {};
  for (const sku of skuList()) {
    const paid = confirmed.filter(receipt => receipt.project_id === sku.project_id);
    bySku[sku.slug] = { receipts: paid.length, gross_revenue_minor_units: sum(paid) };
  }
  return {
    schema: 'internal.stripe-gross-scorecard.v1', synthetic: false, observed_at: observedAt,
    source: { provider: 'stripe', catalog: 'bloom-shelf' },
    financial: { confirmed_project_payment_receipts: confirmed.length, gross_revenue_minor_units: sum(confirmed), currency: 'USD' },
    test: { payment_receipts: test.length, gross_revenue_minor_units: sum(test), currency: 'USD' },
    by_sku: bySku,
  };
}

async function readReceiptsFromStripe(env) {
  const receipts = [];
  const ids = knownProjectIds();
  let startingAfter;
  for (let page = 0; page < 10; page++) {
    const query = new URLSearchParams({ limit: '100', ...(startingAfter ? { starting_after: startingAfter } : {}) });
    const result = await stripeFetch(`checkout/sessions?${query}`, env);
    const sessions = Array.isArray(result?.data) ? result.data : [];
    for (const session of sessions) {
      if (!ids.has(session?.metadata?.project_id) || !sessionIdOK(session.id, env)) continue;
      receipts.push({
        created: session.created, amount_total: session.amount_total, currency: session.currency,
        customer_email: session.customer_details?.email ?? session.customer_email ?? null,
        payment_status: session.payment_status, livemode: session.livemode,
        project_id: session.metadata.project_id, sku: session.metadata.sku ?? null, session_id: session.id,
      });
    }
    if (!result?.has_more || sessions.length === 0) break;
    startingAfter = sessions[sessions.length - 1].id;
  }
  return receipts;
}

export async function readReceipts(env) {
  if (!env.RECEIPTS) return readReceiptsFromStripe(env);
  const kv = env.RECEIPTS;
  const receipts = [];
  let cursor;
  do {
    const result = await kv.list({ limit: 1000, ...(cursor ? { cursor } : {}) });
    for (let offset = 0; offset < result.keys.length; offset += 20) {
      const batch = await Promise.all(result.keys.slice(offset, offset + 20).map(async ({ name }) => {
        const record = await kv.get(name, { type: 'json' });
        return record ? { ...record, session_id: name } : null;
      }));
      receipts.push(...batch.filter(Boolean));
    }
    if (result.list_complete) break;
    if (!result.cursor || result.cursor === cursor) throw new Error('Incomplete receipt listing');
    cursor = result.cursor;
  } while (cursor);
  return receipts;
}

async function webhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Webhook configuration unavailable' }, 503);
  if (Number(request.headers.get('Content-Length')) > 1_000_000) return json({ error: 'Payload too large' }, 413);
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return json({ error: 'Payload too large' }, 413);
  if (!await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET)) return json({ error: 'Invalid signature' }, 400);
  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const session = event?.data?.object;
  const sku = skuFromSession(session);
  if (event?.type !== 'checkout.session.completed' || !sku ||
      session.livemode !== liveMode(env) || !sessionIdOK(session.id, env) ||
      (typeof event.livemode === 'boolean' && event.livemode !== liveMode(env))) return json({ received: true });
  const receipt = {
    created: session.created ?? event.created,
    amount_total: session.amount_total,
    currency: session.currency,
    customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    payment_status: session.payment_status,
    livemode: session.livemode,
    project_id: sku.project_id,
    sku: sku.slug,
  };
  if (env.RECEIPTS) await env.RECEIPTS.put(session.id, JSON.stringify(receipt));
  return json({ received: true });
}

function beacon(request, env, ctx, event, sku) {
  if (!doorConfigured(env)) return;
  const task = (async () => {
    const url = new URL(request.url);
    await fetch(`${env.DOOR_URL}/hit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Door-Key': env.DOOR_KEY },
      body: JSON.stringify({
        site: 'shelf',
        event,
        path: url.pathname,
        sku: sku ?? '',
        ref: request.headers.get('Referer') ?? '',
        ua: String(request.headers.get('User-Agent') ?? '').slice(0, 200),
        ts: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(2000),
    });
  })().catch(() => {});
  try {
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(task);
  } catch {}
}

function beaconEvent(request, result) {
  let path;
  try { path = decodeURIComponent(new URL(request.url).pathname); } catch { return null; }
  const method = request.method;
  const status = result.status;
  if (method === 'GET' && (path === '/' || path.startsWith('/p/')) && status === 200) return 'view';
  if (method === 'POST' && path.endsWith('/checkout') && status === 303) return 'checkout';
  if (method === 'GET' && path === '/download' && status === 200) return 'download';
  return null;
}

function downloadPage(env, token, sku, intro) {
  return page('Your download is ready', `<p>${intro} Save this page for access to your download.</p><a class="button" href="/download?token=${encodeURIComponent(token)}">Download ${sku.name}</a><p class="muted">This link expires in 7 days. Reopen this page to get a fresh link. Treat both links as private.</p><p>File: ${sku.zip_filename}. Open it on your computer. Email <a href="mailto:${SUPPORT}">${SUPPORT}</a> if the archive will not open.</p>`, env);
}

function termsBody(env) {
  return `<p>Each Bloom Shelf purchase is a personal license to use the downloaded files on devices you own. You may keep a backup. You may not redistribute, resell, or publish the files as your own product.</p>
<p>Email <a href="mailto:${SUPPORT}">${SUPPORT}</a> within 14 days of purchase for a refund. This policy does not limit rights provided by applicable law.</p>
<p>These files are tools and worksheets. They are not legal, tax, insurance, licensing, medical, or financial advice. They do not guarantee income, rankings, leads, customer approval, or job profit.</p>
${liveMode(env) ? '' : '<p>This store is in Stripe test mode. No real payment is collected.</p>'}
<p>${SELLER} sells Bloom Shelf. Contact support for help with your order.</p>`;
}

function privacyBody() {
  return `<p>This store has no third-party analytics scripts or advertising trackers. It counts page views on our own server: the page path, the referring site, and the browser family. It does not record your IP address and sets no cookies.</p>
<p>Stripe processes your payment on its hosted checkout. We do not receive your full card number. We store your Stripe session ID, payment amount, currency, payment status, creation time, test or live status, product identifier, and email in Cloudflare Workers KV when that store is configured; otherwise we read those fields from Stripe.</p>
<p>Your email is used only for receipts and support. Stripe sends a payment receipt when receipt emails are enabled for the account; this store does not send a separate email. Keep your confirmation page to retrieve your download.</p>
<p>Cloudflare hosts this store. Cloudflare application request logging is disabled. For privacy questions, email <a href="mailto:${SUPPORT}">${SUPPORT}</a>.</p>`;
}

function llmsTxt(env) {
  const base = publicBase(env);
  const lines = [
    'Bloom Shelf — one-time digital downloads from Bloom Web Services LLC',
    `Support: ${SUPPORT}`,
    `Index: ${base}/`,
    '',
  ];
  for (const sku of skuList()) {
    lines.push(`${sku.name} — ${priceLabel(sku.price_cents)} USD one-time`);
    lines.push(sku.tagline);
    lines.push(`${base}/p/${sku.slug}`);
    lines.push('');
  }
  return lines.join('\n');
}

async function checkout(request, env, sku) {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  if (!originOK(origin, url, env)) return json({ error: 'Invalid origin' }, 403);
  let source = 'direct';
  try {
    const form = await request.formData();
    const raw = String(form.get('source') ?? '');
    if (raw === 'github') source = 'github';
  } catch {}
  const session = await stripeFetch('checkout/sessions', env, buildCheckoutBody(env, sku, source));
  if (session.livemode !== liveMode(env) || !sessionIdOK(session.id, env)) throw new Error('Unexpected checkout mode');
  const checkoutURL = new URL(session.url);
  if (checkoutURL.protocol !== 'https:' || checkoutURL.hostname !== 'checkout.stripe.com' || checkoutURL.username || checkoutURL.password) throw new Error('Invalid checkout URL');
  return new Response(null, { status: 303, headers: { Location: checkoutURL.href } });
}

async function previewIndex(env, sku, url) {
  const listing = await env.ASSETS.fetch(new Request(new URL(`/preview/${sku.slug}/what-you-get.txt`, url.origin)));
  if (listing.status === 200) {
    const text = await listing.text();
    return page(`Preview · ${sku.name}`, `<pre style="white-space:pre-wrap;font:15px/1.5 ui-monospace,monospace">${text.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))}</pre><p class="muted"><a href="/p/${sku.slug}">Product page</a></p>`, env);
  }
  const rubric = await env.ASSETS.fetch(new Request(new URL(`/preview/${sku.slug}/rubric-sample.txt`, url.origin)));
  if (rubric.status === 200) {
    const text = await rubric.text();
    return page(`Preview · ${sku.name}`, `<pre style="white-space:pre-wrap;font:15px/1.5 ui-monospace,monospace">${text.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))}</pre><p class="muted"><a href="/p/${sku.slug}">Product page</a></p>`, env);
  }
  return json({ error: 'Not found' }, 404);
}

async function route(request, env) {
  const url = new URL(request.url);
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return json({ error: 'Invalid path' }, 400); }
  if (path === '/assets' || path.startsWith('/assets/') || path.toLowerCase().endsWith('.zip')) return json({ error: 'Not found' }, 404);

  if (request.method === 'GET' && path === '/') return response(indexPage(env));
  if (request.method === 'GET' && path === '/llms.txt') return response(llmsTxt(env), 200, 'text/plain; charset=utf-8');
  if (request.method === 'GET' && path === '/terms') return page('Terms', termsBody(env), env);
  if (request.method === 'GET' && path === '/privacy') return page('Privacy', privacyBody(), env);

  const productMatch = path.match(/^\/p\/([a-z0-9-]{3,48})$/);
  if (request.method === 'GET' && productMatch) {
    const sku = getSku(productMatch[1]);
    if (!sku) return json({ error: 'Not found' }, 404);
    return response(productPage(sku, env));
  }
  const checkoutMatch = path.match(/^\/p\/([a-z0-9-]{3,48})\/checkout$/);
  if (request.method === 'POST' && checkoutMatch) {
    const sku = getSku(checkoutMatch[1]);
    if (!sku) return json({ error: 'Not found' }, 404);
    return checkout(request, env, sku);
  }
  const previewMatch = path.match(/^\/preview\/([a-z0-9-]{3,48})\/?$/);
  if (request.method === 'GET' && previewMatch) {
    const sku = getSku(previewMatch[1]);
    if (!sku) return json({ error: 'Not found' }, 404);
    return previewIndex(env, sku, url);
  }

  if (request.method === 'GET' && path === '/thanks') {
    const id = url.searchParams.get('session_id');
    if (!sessionIdOK(id, env)) return page('Payment is not complete', '<p>Return to checkout, or contact support if you have already paid.</p>', env, 400);
    const session = await stripeFetch(`checkout/sessions/${encodeURIComponent(id)}`, env);
    const sku = skuFromSession(session);
    if (session.id !== id || session.livemode !== liveMode(env) || !sessionUnlocked(session) || !sku) {
      return page('Payment is not complete', '<p>Your payment has not been confirmed for this download. Refresh after payment, or contact support.</p>', env);
    }
    const exp = Math.floor(Date.now() / 1000) + WEEK;
    const token = await signDownloadToken(id, env.DOWNLOAD_SIGNING_SECRET, exp, sku.slug);
    return downloadPage(env, token, sku, `Thanks for buying ${sku.name}.`);
  }

  if (request.method === 'GET' && path === '/download') {
    const payload = await verifyDownloadToken(url.searchParams.get('token'), env.DOWNLOAD_SIGNING_SECRET);
    if (!payload || !sessionIdOK(payload.sessionId, env)) return json({ error: 'Invalid or expired download link' }, 403);
    const sku = getSku(payload.sku);
    if (!sku) return json({ error: 'Invalid or expired download link' }, 403);
    const asset = await env.ASSETS.fetch(new Request(new URL(sku.zip_path, url.origin)));
    if (asset.status !== 200) return json({ error: 'Download temporarily unavailable' }, 503);
    const headers = new Headers(asset.headers);
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${sku.zip_filename}"`);
    return new Response(asset.body, { status: 200, headers });
  }

  if (request.method === 'POST' && path === '/webhook') return webhook(request, env);
  if (request.method === 'GET' && (path === '/admin/receipts' || path === '/admin/scorecard')) {
    if (!await secretsEqual(url.searchParams.get('key'), env.ADMIN_KEY)) return json({ error: 'Unauthorized' }, 401);
    const receipts = await readReceipts(env);
    return json(path === '/admin/scorecard' ? scorecard(receipts) : receipts);
  }
  if (request.method === 'GET' && path === '/robots.txt') {
    return response('User-agent: *\nAllow: /\nDisallow: /thanks\nDisallow: /download\nDisallow: /admin/\nSitemap: ' + publicBase(env) + '/sitemap.xml\n', 200, 'text/plain; charset=utf-8');
  }
  if (request.method === 'GET' && path === '/sitemap.xml') {
    const base = publicBase(env);
    const paths = ['/', '/terms', '/privacy', ...skuList().map(sku => `/p/${sku.slug}`)];
    return response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + paths.map(pagePath => '<url><loc>' + base + pagePath + '</loc></url>').join('') + '</urlset>', 200, 'application/xml; charset=utf-8');
  }
  if (request.method === 'GET' && path === `/${INDEXNOW_KEY}.txt`) return response(INDEXNOW_KEY, 200, 'text/plain; charset=utf-8');
  if (request.method === 'GET' && path === '/health') {
    const assets = {};
    for (const sku of skuList()) {
      const asset = await env.ASSETS.fetch(new Request(new URL(sku.zip_path, url.origin), { method: 'HEAD' }));
      assets[sku.slug] = asset.status === 200;
    }
    return json({ version: VERSION, mode: liveMode(env) ? 'live' : 'test', skus: assets });
  }
  if ((request.method === 'GET' || request.method === 'HEAD') && (path.startsWith('/covers/') || path.startsWith('/preview/'))) {
    return env.ASSETS.fetch(new Request(new URL(path, url.origin), { method: request.method }));
  }
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    let result;
    try { result = await route(request, env); }
    catch (error) {
      const admin = await secretsEqual(request.headers.get('X-Admin-Key') ?? '', env.ADMIN_KEY);
      result = json({ error: `Service temporarily unavailable. Try again or contact ${SUPPORT}.`, ...(admin ? { detail: String(error?.message ?? error).slice(0, 300) } : {}) }, 503);
    }
    try {
      const event = beaconEvent(request, result);
      if (event) {
        let sku = '';
        try {
          const match = decodeURIComponent(new URL(request.url).pathname).match(/^\/p\/([a-z0-9-]{3,48})/);
          sku = match?.[1] ?? '';
        } catch {}
        beacon(request, env, ctx, event, sku);
      }
    } catch {}
    const secured = new Response(result.body, result);
    let pathname = '';
    try { pathname = new URL(request.url).pathname; } catch {}
    const isLlmsTxt = request.method === 'GET' && pathname === '/llms.txt' && result.status === 200;
    secured.headers.set('Cache-Control', isLlmsTxt ? 'public, max-age=3600' : 'no-store');
    const landing = request.method === 'GET' && (pathname === '/' || pathname.startsWith('/p/'));
    secured.headers.set('Referrer-Policy', landing ? 'strict-origin-when-cross-origin' : 'no-referrer');
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('X-Frame-Options', 'DENY');
    secured.headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; media-src 'self'; form-action 'self' https://checkout.stripe.com; base-uri 'none'; frame-ancestors 'none'");
    secured.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return secured;
  },
};

export { SKUS, VERSION };
