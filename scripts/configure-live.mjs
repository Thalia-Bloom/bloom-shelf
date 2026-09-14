// Secret values stay in memory or anonymous pipes. Nothing is printed or written.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const cliEnv = {
  ...process.env,
  npm_config_cache: path.join(root, '.cache/npm'),
  npm_config_fetch_retries: '0',
  npm_config_update_notifier: 'false',
  WRANGLER_SEND_METRICS: 'false',
  WRANGLER_LOG: 'error',
  WRANGLER_WRITE_LOGS: 'false',
  WRANGLER_LOG_PATH: path.join(root, '.wrangler/logs'),
};
delete cliEnv.DEBUG;
delete cliEnv.NODE_DEBUG;

async function putSecret(name, input) {
  const child = spawn('npx', ['--yes', 'wrangler@4', 'secret', 'put', name], {
    cwd: root, env: cliEnv, stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdout.resume();
  child.stderr.resume();
  const finished = new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error(`Could not start Wrangler for ${name}`)));
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Wrangler secret put ${name} failed (exit ${code}); secret output suppressed`)));
  });
  try { await Promise.all([pipeline(input, child.stdin), finished]); }
  catch (error) { child.kill(); throw error; }
  console.log(`Configured ${name} (value withheld).`);
}

async function main() {
  const url = new URL(process.argv[2]);
  if (url.protocol !== 'https:' || !/^bloom-shelf\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('Supply the observed bloom-shelf workers.dev origin');
  }
  const base = url.origin;
  const config = await readFile(path.join(root, 'wrangler.toml'), 'utf8');
  if (!/^STRIPE_MODE\s*=\s*"live"$/m.test(config) || !config.includes(`PUBLIC_BASE_URL = "${base}"`)) {
    throw new Error('Set PUBLIC_BASE_URL and STRIPE_MODE=live in wrangler.toml, then deploy first');
  }

  let stripeKey;
  const keychain = spawn('security', ['find-generic-password', '-s', 'com.bloom.pattern-stitch.stripe.live', '-w'], { stdio: ['ignore', 'pipe', 'pipe'] });
  keychain.stderr.resume();
  const keychainFinished = new Promise((resolve, reject) => {
    keychain.once('error', () => reject(new Error('Keychain command unavailable')));
    keychain.once('exit', code => code === 0 ? resolve() : reject(new Error(`Keychain LIVE item read failed (exit ${code}); output suppressed`)));
  });
  const chunks = [];
  const liveKeyOnly = new Transform({
    transform(chunk, encoding, callback) { chunks.push(chunk); callback(); },
    flush(callback) {
      stripeKey = Buffer.concat(chunks).toString('utf8').trim();
      if (!/^sk_live_[A-Za-z0-9]+$/.test(stripeKey)) return callback(new Error('Refusing a key that is not a Stripe LIVE secret'));
      this.push(stripeKey);
      callback();
    },
  });
  await Promise.all([keychainFinished, pipeline(keychain.stdout, liveKeyOnly), putSecret('STRIPE_SECRET_KEY', liveKeyOnly)]);
  const webhookResponse = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
    method: 'POST',
    headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `bloom-shelf-live-webhook-${url.hostname}` },
    body: new URLSearchParams({ url: `${base}/webhook`, 'enabled_events[0]': 'checkout.session.completed', description: 'Bloom Shelf LIVE checkout delivery' }),
    signal: AbortSignal.timeout(15000),
  });
  stripeKey = undefined;
  if (!webhookResponse.ok) throw new Error(`Stripe LIVE webhook creation failed (HTTP ${webhookResponse.status}); response body withheld`);
  const endpoint = await webhookResponse.json();
  if (endpoint.livemode !== true || !/^whsec_[A-Za-z0-9]+$/.test(endpoint.secret)) throw new Error('Refusing unexpected webhook mode or secret format');
  await mkdir(path.join(root, 'evidence'), { recursive: true });
  await writeFile(path.join(root, 'evidence/live-webhook.json'), JSON.stringify({ id: endpoint.id, url: endpoint.url, livemode: endpoint.livemode, enabled_events: endpoint.enabled_events }, null, 2) + '\n');
  await putSecret('STRIPE_WEBHOOK_SECRET', Readable.from([endpoint.secret]));
  delete endpoint.secret;
  console.log(`Created LIVE webhook ${endpoint.id}.`);
}

main().catch(error => {
  const safe = /^(Supply |Set PUBLIC_BASE_URL |Could not start Wrangler |Wrangler secret put |Keychain |Refusing |Stripe LIVE webhook creation failed)/.test(error.message);
  console.error(safe ? error.message : 'LIVE setup failed. No secret details were logged.');
  process.exitCode = 1;
});
