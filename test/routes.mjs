import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import test from 'node:test';
import worker, { buildCheckoutBody, scorecard, sessionUnlocked } from '../src/worker.js';
import { signDownloadToken, verifyDownloadToken } from '../src/security.js';
import { SKUS, skuList } from '../src/catalog.js';

const origin = 'https://bloom-shelf.example.workers.dev';
const newSecret = () => randomBytes(32).toString('hex');
const newSessionId = () => `cs_test_${randomBytes(12).toString('hex')}`;
const archiveA = new Uint8Array([0x50, 0x4b, 3, 4, 0, 1]);
const archiveB = new Uint8Array([0x50, 0x4b, 3, 4, 0, 2]);
const oneJob = SKUS['one-job-price-check'];
const gbp = SKUS['gbp-visibility-kit'];

class MemoryKV {
  constructor(receipts = []) {
    this.values = new Map(receipts.map((receipt) => [receipt.id, JSON.stringify(receipt)]));
  }
  async put(key, value) { this.values.set(key, value); }
  async get(key, options) {
    const value = this.values.get(key) ?? null;
    const type = typeof options === 'string' ? options : options?.type;
    return type === 'json' && value !== null ? JSON.parse(value) : value;
  }
  async list(options = {}) {
    const names = [...this.values.keys()];
    const start = Number(options.cursor ?? 0);
    const end = Math.min(start + 50, names.length);
    return { keys: names.slice(start, end).map((name) => ({ name })), list_complete: end === names.length, cursor: end === names.length ? '' : String(end) };
  }
}

function fixture(t) {
  const assetRequests = [];
  const env = {
    PUBLIC_BASE_URL: origin,
    STRIPE_MODE: 'test',
    STRIPE_SECRET_KEY: `sk_test_${newSecret()}`,
    STRIPE_WEBHOOK_SECRET: `whsec_${newSecret()}`,
    DOWNLOAD_SIGNING_SECRET: newSecret(),
    ADMIN_KEY: newSecret(),
    RECEIPTS: new MemoryKV(),
    ASSETS: {
      async fetch(input) {
        const request = input instanceof Request ? input : new Request(input);
        assetRequests.push(request);
        const path = new URL(request.url).pathname;
        if (path.startsWith('/assets/') && path.endsWith('.zip')) {
          const body = path.includes('gbp') || path.includes('creator') ? archiveB : archiveA;
          return new Response(request.method === 'HEAD' ? null : body, { headers: { 'content-type': 'application/zip' } });
        }
        if (path.endsWith('what-you-get.txt') || path.endsWith('rubric-sample.txt')) {
          return new Response('sample preview', { headers: { 'content-type': 'text/plain' } });
        }
        return new Response(null, { status: 404 });
      },
    },
  };
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Unexpected external fetch: tests prohibit network access');
  });
  return { env, assetRequests };
}

async function request(env, path, init) {
  const response = await worker.fetch(new Request(new URL(path, origin), init), env);
  assert.ok(response instanceof Response);
  assert.match(response.headers.get('cache-control') ?? '', /(?:^|[,\s])no-store(?:$|[,\s])/i, `${path} must not be cached`);
  return response;
}

function paidSession(overrides = {}) {
  return {
    id: newSessionId(),
    created: 1_750_000_000,
    amount_total: oneJob.price_cents,
    currency: 'usd',
    customer_details: { email: 'buyer@example.test' },
    payment_status: 'paid',
    status: 'complete',
    livemode: false,
    metadata: { project_id: oneJob.project_id, sku: oneJob.slug },
    ...overrides,
  };
}

function mockStripe(t, session, status = 200) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    calls.push({ input, init });
    return Response.json(session, { status });
  });
  return calls;
}

function downloadURL(html) {
  const href = html.match(/href\s*=\s*["']([^"']*\/download(?:\?|\/)[^"']*)["']/i)?.[1];
  return href ? new URL(href.replaceAll('&amp;', '&'), origin) : null;
}

test('index lists every sku and price', async (t) => {
  const { env } = fixture(t);
  const response = await request(env, '/');
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const sku of skuList()) {
    assert.match(html, new RegExp(sku.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(`\\$${(sku.price_cents / 100).toFixed(0)}`));
  }
});

test('product page and unknown slug', async (t) => {
  const { env } = fixture(t);
  const ok = await request(env, '/p/one-job-price-check');
  assert.equal(ok.status, 200);
  const html = await ok.text();
  assert.match(html, /Buy for \$7/);
  assert.match(html, /support@thaliabloom.com/);
  assert.match(html, /not for you/i);
  const missing = await request(env, '/p/not-a-product');
  assert.equal(missing.status, 404);
});

test('checkout body encodes sku price, project, and session placeholder', () => {
  const env = { PUBLIC_BASE_URL: origin, STRIPE_MODE: 'test' };
  const body = buildCheckoutBody(env, oneJob);
  assert.equal(body.get('line_items[0][price_data][unit_amount]'), '700');
  assert.equal(body.get('metadata[project_id]'), oneJob.project_id);
  assert.equal(body.get('metadata[sku]'), oneJob.slug);
  assert.equal(body.get('success_url'), `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`);
  assert.match(body.toString(), /%7BCHECKOUT_SESSION_ID%7D/);
  const gbpBody = buildCheckoutBody(env, gbp);
  assert.equal(gbpBody.get('line_items[0][price_data][unit_amount]'), '1900');
  assert.equal(gbpBody.get('metadata[sku]'), gbp.slug);
  const sewing = SKUS['sewing-test-square-pack'];
  assert.equal(buildCheckoutBody(env, sewing).get('line_items[0][price_data][unit_amount]'), '300');
});

test('checkout creates a hosted session and rejects foreign origins', async (t) => {
  const { env } = fixture(t);
  const hostedURL = 'https://checkout.stripe.com/c/pay/cs_test_fixture';
  const calls = mockStripe(t, { id: newSessionId(), livemode: false, url: hostedURL });
  const response = await request(env, '/p/one-job-price-check/checkout', { method: 'POST' });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), hostedURL);
  const posted = new URLSearchParams(await new Request(calls[0].input, calls[0].init).text());
  assert.equal(posted.get('metadata[sku]'), oneJob.slug);
  const foreign = await request(env, '/p/one-job-price-check/checkout', { method: 'POST', headers: { Origin: 'https://evil.example' } });
  assert.equal(foreign.status, 403);
});

test('thanks grants a signed download for the paid sku only', async (t) => {
  const { env, assetRequests } = fixture(t);
  const session = paidSession();
  mockStripe(t, session);
  const response = await request(env, `/thanks?session_id=${session.id}`);
  assert.equal(response.status, 200);
  const url = downloadURL(await response.text());
  assert.ok(url);
  const payload = await verifyDownloadToken(url.searchParams.get('token'), env.DOWNLOAD_SIGNING_SECRET);
  assert.equal(payload.sessionId, session.id);
  assert.equal(payload.sku, oneJob.slug);
  const download = await request(env, url.pathname + url.search);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-disposition'), 'attachment; filename="Handyman-One-Job-Price-Check.zip"');
  assert.equal(assetRequests.at(-1).url, `${origin}/assets/one-job-price-check.zip`);
});

test('thanks denies mismatched sku metadata and unpaid sessions', async (t) => {
  const { env } = fixture(t);
  const id = newSessionId();
  mockStripe(t, paidSession({ id, metadata: { project_id: oneJob.project_id, sku: gbp.slug } }));
  const mismatch = await request(env, `/thanks?session_id=${id}`);
  assert.equal(downloadURL(await mismatch.text()), null);
  mockStripe(t, paidSession({ id, payment_status: 'unpaid' }));
  const unpaid = await request(env, `/thanks?session_id=${id}`);
  assert.equal(downloadURL(await unpaid.text()), null);
});

test('a one-job token cannot download the gbp zip', async (t) => {
  const { env } = fixture(t);
  const exp = Math.floor(Date.now() / 1000) + 60;
  const token = await signDownloadToken(newSessionId(), env.DOWNLOAD_SIGNING_SECRET, exp, oneJob.slug);
  const download = await request(env, `/download?token=${encodeURIComponent(token)}`);
  assert.equal(download.status, 200);
  const bytes = new Uint8Array(await download.arrayBuffer());
  assert.deepEqual([...bytes], [...archiveA]);
});

test('direct zip routes are closed', async (t) => {
  const { env } = fixture(t);
  for (const path of ['/assets/one-job-price-check.zip', '/assets/UsageHUD.zip', '/buyer.zip']) {
    const response = await request(env, path);
    assert.equal(response.status, 404, path);
  }
});

test('webhook stores a matching receipt and ignores other projects', async (t) => {
  const { env } = fixture(t);
  const session = paidSession();
  const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', livemode: false, data: { object: session } });
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac('sha256', env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest('hex');
  const ok = await request(env, '/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${timestamp},v1=${digest}` }, body });
  assert.equal(ok.status, 200);
  const stored = await env.RECEIPTS.get(session.id, 'json');
  assert.equal(stored.sku, oneJob.slug);
  const other = paidSession({ metadata: { project_id: 'usage-hud-v1', sku: 'usage-hud' } });
  const otherBody = JSON.stringify({ id: 'evt_2', type: 'checkout.session.completed', livemode: false, data: { object: other } });
  const otherDigest = createHmac('sha256', env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${otherBody}`).digest('hex');
  const ignored = await request(env, '/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${timestamp},v1=${otherDigest}` }, body: otherBody });
  assert.equal(ignored.status, 200);
  assert.equal(await env.RECEIPTS.get(other.id), null);
});

test('scorecard counts live paid usd per sku and ignores test and free sessions', () => {
  const card = scorecard([
    { project_id: oneJob.project_id, payment_status: 'paid', amount_total: 700, currency: 'usd', livemode: true },
    { project_id: gbp.project_id, payment_status: 'paid', amount_total: 1900, currency: 'usd', livemode: true },
    { project_id: oneJob.project_id, payment_status: 'paid', amount_total: 700, currency: 'usd', livemode: false },
    { project_id: oneJob.project_id, payment_status: 'no_payment_required', amount_total: 0, currency: 'usd', livemode: true },
  ]);
  assert.equal(card.financial.confirmed_project_payment_receipts, 2);
  assert.equal(card.financial.gross_revenue_minor_units, 2600);
  assert.equal(card.by_sku[oneJob.slug].receipts, 1);
  assert.equal(card.by_sku[gbp.slug].gross_revenue_minor_units, 1900);
  assert.equal(sessionUnlocked({ payment_status: 'no_payment_required', status: 'complete', amount_total: 0 }), true);
});

test('health, terms, and sitemap', async (t) => {
  const { env } = fixture(t);
  const health = await request(env, '/health');
  assert.equal(health.status, 200);
  const body = await health.json();
  assert.equal(body.mode, 'test');
  assert.equal(body.skus['one-job-price-check'], true);
  const terms = await request(env, '/terms');
  assert.equal(terms.status, 200);
  assert.match(await terms.text(), /14 days/);
  const sitemap = await request(env, '/sitemap.xml');
  const map = await sitemap.text();
  for (const sku of skuList()) assert.match(map, new RegExp(`/p/${sku.slug}`));
  assert.equal(body.skus['cleaning-quote-kit'], true);
  assert.equal(body.skus['sewing-test-square-pack'], true);
  assert.equal(body.skus['creator-clip-pack'], true);
});
