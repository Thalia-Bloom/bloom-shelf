# Bloom Shelf

One-time digital downloads from Bloom Web Services LLC. A stranger pays on Stripe and receives a ZIP. No subscription.

Live worker (after deploy): `https://bloom-shelf.pattern-service.workers.dev/`

Support: support@thaliabloom.com · 14-day refund by email.

## SKUs

| Offering | Price | Page |
| --- | ---: | --- |
| Handyman One-Job Price Check | $7 | [/p/one-job-price-check](https://bloom-shelf.pattern-service.workers.dev/p/one-job-price-check) |
| Handyman Scope + Change Sheet | $7 | [/p/scope-change-sheet](https://bloom-shelf.pattern-service.workers.dev/p/scope-change-sheet) |
| Google Business Profile DIY Visibility Kit | $19 | [/p/gbp-visibility-kit](https://bloom-shelf.pattern-service.workers.dev/p/gbp-visibility-kit) |
| Post-Construction Cleaning Quote Kit | $9 | [/p/cleaning-quote-kit](https://bloom-shelf.pattern-service.workers.dev/p/cleaning-quote-kit) |
| Sewing Print-Scale Test Square Pack | $3 | [/p/sewing-test-square-pack](https://bloom-shelf.pattern-service.workers.dev/p/sewing-test-square-pack) |
| Creator Clip Shot-List + Caption Pack | $12 | [/p/creator-clip-pack](https://bloom-shelf.pattern-service.workers.dev/p/creator-clip-pack) |
| Furniture Pickup Go/No-Go Sheet | $7 | [/p/furniture-pickup-sheet](https://bloom-shelf.pattern-service.workers.dev/p/furniture-pickup-sheet) |
| Claude vs Codex vs Cursor Decision Worksheet | $3 | [/p/coding-tool-decision-sheet](https://bloom-shelf.pattern-service.workers.dev/p/coding-tool-decision-sheet) |
| Solo-Trade Estimate + Invoice Pages | $7 | [/p/trade-invoice-estimate](https://bloom-shelf.pattern-service.workers.dev/p/trade-invoice-estimate) |
| Where Your Usage Lives | $4 | [/p/usage-source-map](https://bloom-shelf.pattern-service.workers.dev/p/usage-source-map) |
| Print-at-Home vs Copy-Shop Chooser | $4 | [/p/print-vs-copyshop](https://bloom-shelf.pattern-service.workers.dev/p/print-vs-copyshop) |
| One-Job Materials-Run Checklist | $5 | [/p/materials-run-checklist](https://bloom-shelf.pattern-service.workers.dev/p/materials-run-checklist) |
| Creator Brand-Voice Card | $9 | [/p/creator-voice-card](https://bloom-shelf.pattern-service.workers.dev/p/creator-voice-card) |
| Marketplace One-Item Photo Shot List | $7 | [/p/marketplace-photo-list](https://bloom-shelf.pattern-service.workers.dev/p/marketplace-photo-list) |
| Punch-List vs Deep-Clean Scope Card | $5 | [/p/punch-vs-deep-clean](https://bloom-shelf.pattern-service.workers.dev/p/punch-vs-deep-clean) |
| First Commercial Job Access Script | $5 | [/p/first-job-access-script](https://bloom-shelf.pattern-service.workers.dev/p/first-job-access-script) |
| 5-Hour vs Weekly Two-Pool Card | $4 | [/p/two-pool-usage-card](https://bloom-shelf.pattern-service.workers.dev/p/two-pool-usage-card) |

Paid ZIP files are not in this repository. Checkout delivers them after Stripe payment. Public samples live under `products/<slug>/preview/`.

## Local checks

```sh
node --test test/*.mjs
node scripts/prepare-assets.mjs
```

Direct `/assets/*.zip` requests are rejected. Downloads require a paid Stripe session token.

## Honest line

These are worksheets and operating records. They are not legal advice, ranking promises, or guaranteed income.
