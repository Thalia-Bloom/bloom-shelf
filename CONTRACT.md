# Product contract (for factory builders)

Each SKU lives in `products/<slug>/` and must ship these files:

| File | Required | Notes |
| --- | --- | --- |
| `product.json` | yes | See schema below |
| `buyer.zip` | yes | The paid archive. Non-zero. No secrets, no local paths, no real customer names |
| `LANDING.md` | yes | Honest: what it is, what it is not, who it is for, price, support@thaliabloom.com, 14-day refund |
| `preview/` | yes | At least one public sample (plain text or PDF). Not the paid file |
| `cover.png` | if available | 1280×720 or similar. No fake ratings |

## product.json

```json
{
  "slug": "one-job-price-check",
  "name": "Handyman One-Job Price Check",
  "tagline": "One finished job. One clearer next price.",
  "price_cents": 700,
  "project_id": "shelf-one-job-v1",
  "zip_filename": "Handyman-One-Job-Price-Check.zip",
  "bytes": 0,
  "sha256": "",
  "contains": ["xlsx", "pdf"],
  "for_who": ["solo handyman with one finished job"],
  "not_for": ["multi-crew estimating software buyers"]
}
```

`bytes` and `sha256` are of `buyer.zip`. Fill them with `shasum -a 256 buyer.zip` and `wc -c`.

## Copy rules

- Bloom Web Services LLC. Support: support@thaliabloom.com. Price one-time USD. 14-day refund by email.
- No testimonials, ratings, guaranteed income, guaranteed rankings, or invented case studies.
- Fictional worked examples only. Do not use real audited businesses from gbp-desk.
- Do not mention Usage HUD, Pattern Stitch, Stripe keys, wrangler, Tailscale, or internal paths on the landing page.
