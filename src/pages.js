import { SELLER, SUPPORT, SKUS, skuList, priceLabel } from './catalog.js';
import { media } from './media.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const styles = `
:root{color-scheme:light dark;--bg:#f5f4ef;--ink:#192722;--muted:#58665e;--line:#d5ddd5;--card:#fffefa;--green:#175b3f;--wash:#e8eee6}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
a{color:inherit;text-underline-offset:4px}a:hover{color:var(--green)}
a:focus-visible,button:focus-visible{outline:3px solid #bf8b21;outline-offset:5px}
button{font:inherit}header,main,footer{max-width:1080px;margin:auto;padding:0 28px}
header{height:92px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.wordmark{text-decoration:none;font-weight:750;font-size:20px;letter-spacing:-.4px}
.mark{display:inline-grid;place-items:center;background:var(--green);color:#fff;width:30px;height:30px;border-radius:9px;margin-right:10px}
.nav-meta{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:650;color:var(--muted)}
.test-banner{background:var(--wash);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9px 20px;text-align:center;font-size:13px;color:var(--muted)}
.hero{padding:48px 0 36px}.eyebrow{color:var(--green);letter-spacing:.12em;text-transform:uppercase;font-size:12px;font-weight:700;margin:0 0 14px}
h1,h2,h3,p{margin-top:0}h1{font-size:clamp(40px,6vw,64px);font-weight:620;line-height:1.05;letter-spacing:-.045em;margin-bottom:16px}
.one-liner{font-size:22px;line-height:1.35;margin-bottom:16px;max-width:640px}
.description{color:var(--muted);max-width:640px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:12px 0 48px}
.card{display:block;text-decoration:none;padding:24px;border:1px solid var(--line);background:var(--card);border-radius:16px}
.card h2{font-size:22px;letter-spacing:-.4px;margin:0 0 8px}.card p{color:var(--muted);font-size:15px;margin:0 0 12px}
.price{font-weight:700;color:var(--ink)}
.product{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:start;padding:40px 0 56px}
.button{display:inline-block;border:0;border-radius:10px;background:var(--green);color:#fff;text-decoration:none;font-weight:650;padding:14px 26px;cursor:pointer}
.button:hover{color:#fff;filter:brightness(1.12)}
.purchase-note{font-size:13px;color:var(--muted);margin:12px 0 0;max-width:420px}
.cover{margin:0;background:#101912;padding:18px;border-radius:20px;border:1px solid #314238}
.cover img{display:block;width:100%;height:auto;border-radius:12px}
.placeholder{display:grid;place-items:center;aspect-ratio:16/9;color:#c7d2ca;background:#222c27;border-radius:12px;padding:24px;text-align:center}
.section{border-top:1px solid var(--line);padding:36px 0}h2{font-size:28px;letter-spacing:-.8px;margin-bottom:14px}
ul{color:var(--muted);padding-left:20px}li{margin-bottom:8px}
.closing{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:28px 0 48px}
.content{max-width:760px;padding:56px 0 80px;min-height:60vh}.content h1{font-size:42px}.muted{color:var(--muted);font-size:14px;margin-top:20px}
footer{padding:24px 28px 36px;font-size:12px;color:var(--muted)}.footer-inner{border-top:1px solid var(--line);padding-top:20px}
.skip{position:absolute;top:-80px;left:12px;padding:10px;background:var(--card)}.skip:focus{top:12px}
@media(prefers-color-scheme:dark){:root{--bg:#121a16;--ink:#edf3e9;--muted:#abb8ae;--line:#334239;--card:#19251e;--green:#96cda7;--wash:#1a2920}.button,.mark{background:#b8dfab;color:#13281b}.button:hover{color:#13281b}.cover{background:#0c130f;border-color:#2c3c31}}
@media(max-width:800px){header,main,footer{padding-left:20px;padding-right:20px}.grid,.product{grid-template-columns:1fr}.closing{flex-direction:column;align-items:flex-start}h1{font-size:40px}}
`;

function shell(title, description, body, env, extraHead = '') {
  const preview = env.STRIPE_MODE !== 'live';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="color-scheme" content="light dark"><style>${styles}</style>${extraHead}</head><body><a class="skip" href="#main">Skip to content</a><header><a class="wordmark" href="/"><span class="mark" aria-hidden="true">↗</span>Bloom Shelf</a><span class="nav-meta">One-time downloads</span></header>${preview ? '<div class="test-banner">Stripe TEST mode · No real charges</div>' : ''}${body}<footer><div class="footer-inner">${escape(SELLER)} · <a href="mailto:${SUPPORT}">${SUPPORT}</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></div></footer></body></html>`;
}

function buyForm(sku) {
  return `<form action="/p/${escape(sku.slug)}/checkout" method="post"><button class="button" type="submit">Buy for ${priceLabel(sku.price_cents)}</button></form>`;
}

function jsonLd(sku, env) {
  const base = env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: sku.name,
    description: sku.tagline,
    url: `${base}/p/${sku.slug}`,
    brand: { '@type': 'Organization', name: SELLER },
    offers: {
      '@type': 'Offer',
      price: (sku.price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${base}/p/${sku.slug}`,
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function indexPage(env) {
  const cards = skuList().map(sku => `<a class="card" href="/p/${escape(sku.slug)}"><h2>${escape(sku.name)}</h2><p>${escape(sku.tagline)}</p><p class="price">${priceLabel(sku.price_cents)} USD · one time</p></a>`).join('');
  return shell(
    'Bloom Shelf — CodexBar already showing Codex?',
    'A $3 chooser: if CodexBar already shows Codex, skip HUD. If you run several CLIs on a Mac, HUD is sold separately. Stripe checkout. Email support.',
    `<main id="main"><section class="hero"><p class="eyebrow">Bloom Web Services</p><h1>CodexBar already showing Codex?</h1><p class="one-liner">Skip HUD. This $3 page is a chooser, not the app. If you also run Claude, Gemini, Grok, or Ollama on the same Mac, HUD is the other product.</p><p class="description"><a href="/p/codexbar-vs-hud">CodexBar vs Multi-Provider Chooser</a> · <a href="/p/two-pool-usage-card">5-hour vs weekly card</a> · ${SUPPORT} · 14-day refund.</p></section><section class="grid">${cards}</section></main>`,
    env,
  );
}

export function productPage(sku, env) {
  const cover = media.covers?.[sku.slug]
    ? `<figure class="cover"><img src="${escape(media.covers[sku.slug])}" alt=""></figure>`
    : `<figure class="cover"><div class="placeholder">${escape(sku.name)}</div></figure>`;
  const list = (items) => items.map(item => `<li>${escape(item)}</li>`).join('');
  const body = `<main id="main"><section class="product"><div><p class="eyebrow">Digital download</p><h1>${escape(sku.name)}</h1><p class="one-liner">${escape(sku.tagline)}</p><p class="description">${escape(sku.description)}</p><p class="price">${priceLabel(sku.price_cents)} <span style="font-weight:500;color:var(--muted)">USD · one time</span></p>${buyForm(sku)}<p class="purchase-note">14-day refund via ${SUPPORT}. Stripe hosts checkout. You get a download link after payment. Preview: <a href="/preview/${escape(sku.slug)}/">sample</a>.</p></div>${cover}</section>
<section class="section"><h2>What you receive</h2><ul>${list(sku.contains)}</ul></section>
<section class="section"><h2>How it works</h2><ul>${list(sku.steps)}</ul></section>
<section class="section"><h2>This is for you if</h2><ul>${list(sku.for_who)}</ul></section>
<section class="section"><h2>This is not for you if</h2><ul>${list(sku.not_for)}</ul></section>
<section class="section"><h2>Limits</h2><p class="description">${escape(sku.limits)}</p></section>
<div class="closing"><div><h3>${escape(sku.tagline)}</h3><p class="description" style="margin:0">Pay once. Download the files. Email if something is wrong.</p></div>${buyForm(sku)}</div></main>`;
  return shell(`${sku.name} · ${priceLabel(sku.price_cents)}`, sku.tagline, body, env, jsonLd(sku, env));
}

export function contentPage(title, body, env) {
  return shell(title, title, `<main id="main" class="content"><h1>${escape(title)}</h1>${body}<p class="muted"><a href="/">Back to Bloom Shelf</a></p></main>`, env);
}

export { SKUS };
