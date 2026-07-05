# Lexienn production deployment checklist

Use this checklist before and after deploying Lexienn to Vercel with a custom domain (e.g. `lexienn.app` on VentraIP).

## Automated checks (local / CI)

Run from the repository root:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run verify:lexienn`

## Secrets and configuration

- [ ] `.env.local` is **not** committed (listed in `.gitignore`)
- [ ] `.env` is **not** committed with real keys
- [ ] API keys (`AI_API_KEY`, etc.) are set **only** in Vercel → Settings → Environment Variables
- [ ] No secret uses a `NEXT_PUBLIC_` prefix
- [ ] `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false` in Production
- [ ] Review [vercel-deployment.md](./vercel-deployment.md) env var table

## Content and UX

- [ ] No prototype wording visible to normal users (MVP, mock seed, Admin Lite, etc.)
- [ ] Developer Mode toggle hidden when `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false`

## Core routes (production URL)

Test on the Vercel deployment URL first, then the custom domain:

- [ ] **Define** — `/dictionary` — lookup and result flow
- [ ] **Translate** — `/translator` — text and camera modes
- [ ] **Offline** — `/offline` — status banner, search, tabs, phrase cards
- [ ] **Packs** — `/phrase-packs`
- [ ] **Settings** — `/settings` — profile, languages, offline storage actions
- [ ] **Camera** — Translator → Camera tab — scan, review, translate
- [ ] **Voice** — dictionary/translator speak and mic input (with permissions)

## Mobile QA (DevTools device mode)

At **360px**, **390px**, and **430px** width:

- [ ] No horizontal overflow
- [ ] Bottom nav does not cover action bars
- [ ] Offline phrase cards usable one-handed
- [ ] Settings sections do not overflow

See [mobile-qa-checklist.md](./mobile-qa-checklist.md) for detail.

## Vercel deployment

- [ ] New Vercel project created from GitHub (name: `lexienn`, preset: Next.js)
- [ ] Production deploy succeeds (green build)
- [ ] Deployment URL loads (e.g. `https://lexienn.vercel.app`)
- [ ] API status routes respond without leaking keys:
  - `/api/ai/status`
  - `/api/voice/status`
  - `/api/speech/status`

## Custom domain (VentraIP)

- [ ] Domain added in **Vercel first** (Settings → Domains)
- [ ] Root domain added (e.g. `lexienn.app`)
- [ ] `www` added (e.g. `www.lexienn.app`)
- [ ] DNS records created in VentraIP per [ventraip-dns.md](./ventraip-dns.md)
- [ ] Vercel domain status: **Valid**
- [ ] `https://lexienn.app` loads over HTTPS
- [ ] `www` redirects correctly (if configured in Vercel Domains)

## Offline-first (post-deploy smoke)

- [ ] Download a language-pair pack while online
- [ ] Go offline (airplane mode) — pack phrases still work
- [ ] Outdated pack shows **Update available** or migration warning when applicable
- [ ] Missing search saved locally when offline

Local packs remain the source of truth; cloud is optional. See [offline-first-architecture.md](./offline-first-architecture.md).

## Documentation

- [ ] [vercel-deployment.md](./vercel-deployment.md) reviewed
- [ ] [ventraip-dns.md](./ventraip-dns.md) reviewed
- [ ] [offline-sqlite-schema.md](./offline-sqlite-schema.md) still documents required tables

## Sign-off

| Item | Date | Notes |
| --- | --- | --- |
| Local verify passed | | |
| Vercel Production deploy | | |
| Custom domain live | | |
