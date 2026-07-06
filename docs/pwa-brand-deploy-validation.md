# PWA brand assets — deploy validation

Use this checklist after deploying brand-asset, install-gate, or service-worker changes to https://lexienn.rtbea.com.au.

## Automated pre-deploy

```bash
npm run process:brand
npm run generate:icons
npm run lint
npm run typecheck
npm test -- lib/brand/ lib/pwa/
npm run build
npm run verify:lexienn
```

## Post-deploy production verification

**Required on every PWA or service-worker deploy:**

```bash
npm run verify:production-pwa
# optional custom URL:
npm run verify:production-pwa -- https://lexienn.rtbea.com.au
```

---

## Incident & hotfix — 6 July 2026 (`61b92b2`)

### Summary

After deploy `ea0ebac` (install-step grid layout), iPhone Safari showed a white Next.js error screen:

> Application error: a client-side exception has occurred while loading lexienn.rtbea.com.au.

The install gate did not render. Hotfix `61b92b2` resolved the production blocker.

### Root cause

1. **Stale service-worker-cached HTML shell** — `public/sw.js` (cache `lexienn-shell-v3-brand2`) used a **cache-first** strategy for navigation shell routes (`/`, `/translator`, `/offline`).
2. **Old HTML referenced removed Next.js chunks** — after `ea0ebac` deployed new `/_next/static/chunks`, returning visitors received cached HTML pointing at chunk files that no longer existed on the server.
3. **Safari client-side exception before install gate render** — the chunk load failure threw during hydration, so `MobileInstallGate` never mounted. Automated production asset checks still passed because they did not simulate a stale SW HTML cache.

### Permanent fix (`61b92b2`)

| Area | Change |
| --- | --- |
| **Service worker** | Bumped to `lexienn-shell-v4-installfix`. **Does not intercept navigation** requests. **Does not intercept** `/_next/*` or `/api/*`. Caches brand images and static icons only. **Old caches deleted on activate.** |
| **MobileInstallGate** | Platform detection (`isIOS`, `isAndroid`, `getIOSInstallGuideMode`) moved into `useEffect` via `resolveInstallGateUiState()`. Initial render shows a stable shell with “Preparing install instructions…” until `clientReady`. |
| **Error handling** | `app/global-error.tsx` — branded Lexienn fallback with refresh button. `/api/client-error` + `ClientErrorReporter` for production-safe client error logging (message, stack, route, user agent, display mode, SW controller state — no user content). |

### Prevention — PWA caching policy

> **Do not cache navigation HTML cache-first** unless the strategy is explicitly versioned, chunk-safe, and validated on a device with a pre-existing service worker.

Before merging any service-worker change:

1. Confirm `fetch` handler does **not** cache-first serve `/`, `/translator`, `/offline`, or other App Router HTML.
2. Confirm `/_next/*` is never intercepted (Next.js chunk hashes change every deploy).
3. Bump `CACHE_NAME` in `public/sw.js` when cache contents or strategy changes.
4. Run **`npm run verify:production-pwa`** after every production deploy.
5. On-device: test **Safari private tab** (no prior cache) and **returning visit** (existing SW) before sign-off.

Current active cache: **`lexienn-shell-v4-installfix`**

---

## Production QA log — 6 July 2026 (install-gate hotfix `61b92b2`)

| Field | Value |
| --- | --- |
| **Date tested** | 6 July 2026 (UTC+8) |
| **Deploy** | `main` @ `61b92b2` — Safari install-gate crash hotfix |
| **Production URL** | https://lexienn.rtbea.com.au |
| **Prior blocker** | White “Application error” screen on iPhone Safari after `ea0ebac` |
| **Automated result** | **PASS** (lint, typecheck, 125 PWA/brand/MVP tests, build, `verify:production-pwa`) |

### Automated production checks

| Check | Result | Notes |
| --- | --- | --- |
| Service worker cache name | **PASS** | `CACHE_NAME = lexienn-shell-v4-installfix` live |
| SW does not cache HTML shell | **PASS** | No `/`, `/translator`, `/offline` in `STATIC_ASSETS` |
| SW skips `/_next/*` and `/api/*` | **PASS** | Unit tests in `lib/pwa/mobileInstallGate.test.ts` |
| Versioned apple-touch-icon in HTML | **PASS** | `apple-touch-icon.png?v=2` in `/translator` head |
| Transparent brand PNG | **PASS** | RGBA, no checkerboard opaque pixels |
| Favicon / apple-touch-icon navy | **PASS** | Lexienn navy `#163a63` background |
| Hydration-safe install gate | **PASS** (code) | `resolveInstallGateUiState`, `clientReady`, `useEffect` guards |
| Global error fallback | **PASS** (code) | `app/global-error.tsx` branded panel + reload |

### Manual hardware QA — iPhone Safari (post-hotfix sign-off)

Validated against hotfix acceptance criteria after `61b92b2` production deploy.

| Check | Result | Notes |
| --- | --- | --- |
| iPhone Safari install gate loads | **PASS** | No raw white “Application error” screen; gate renders on dark blue background |
| Step 1 layout correct | **PASS** | `1.`, share icon, and instruction text on one aligned row (custom `install-steps` grid) |
| Logo clean | **PASS** | No checkerboard on install gate dark background |
| “Can’t see the icon?” help box | **PASS** | Visible below step list |
| Steps 2–4 alignment | **PASS** | Content aligns with Step 1 text column |
| Safe-area padding | **PASS** | Bottom padding clears Safari toolbar |
| iPhone Safari private tab | **PASS** | Loads without client-side exception (no prior SW cache) |
| Installed PWA bypasses gate | **PASS** | Home Screen launch skips install gate |
| iOS in-app browser | **PASS** | Shows “Open in Safari first” instead of Safari install steps |
| Desktop not gated | **PASS** | Normal app UI; header logo without checkerboard |
| Stale SW migration | **PASS** | `activate` deletes `lexienn-shell-v3-brand2`; one refresh may be needed on devices that held the old SW |

### Final acceptance checklist

- [x] iPhone Safari install gate loads
- [x] Step 1 layout correct (number, icon, text aligned)
- [x] Logo clean (no checkerboard)
- [x] Installed PWA bypasses gate
- [x] Desktop not gated
- [x] No raw white application error screen

### Overall

| Area | Status |
| --- | --- |
| Production blocker (Safari crash) | **RESOLVED** |
| Automated production QA | **PASS** |
| Manual iPhone / PWA QA | **PASS** (post-hotfix sign-off, 6 July 2026) |

---

## Production QA log — 6 July 2026 (install step layout `ea0ebac`)

| Field | Value |
| --- | --- |
| **Date tested** | 6 July 2026 (UTC+8) |
| **Deploy** | Safari step grid layout fix + `sr-only` step labels |
| **Change** | Custom `install-steps` grid replaces native `<ol list-decimal>` markers |
| **Status** | Layout fix retained in `61b92b2`; production crash was SW-related, not step markup |

---

## Production QA log — 6 July 2026 (brand assets `58b4d81`)

| Field | Value |
| --- | --- |
| **Date tested** | 6 July 2026 (UTC+8) |
| **Deploy** | `main` @ `58b4d81` pushed to GitHub → Vercel production |
| **Production URL** | https://lexienn.rtbea.com.au |
| **Automated result** | **PASS** (`npm run verify:production-pwa`) |

### Devices / browsers tested (brand deploy)

| Target | Method | Result | Notes |
| --- | --- | --- | --- |
| Production service worker | `GET /sw.js` | **SUPERSEDED** | Was `lexienn-shell-v3-brand2`; now `lexienn-shell-v4-installfix` |
| Transparent brand PNG | Pixel analysis on production | **PASS** | RGBA, ~76% transparent, 0 checkerboard opaque pixels |
| Versioned brand URL `?v=2` | `GET /brand/lexienn-logo-transparent.png?v=2` | **PASS** | Same clean RGBA asset |
| Favicon | Pixel analysis | **PASS** | Lexienn navy background, no checkerboard pattern |
| Apple touch icon | Pixel analysis | **PASS** | Lexienn navy background, no checkerboard pattern |
| HTML metadata | `GET /translator` | **PASS** | `apple-touch-icon.png?v=2` in document head |
| Android Chrome install | Unit tests + unchanged flow | **PASS** (code) | `beforeinstallprompt` + menu fallback unchanged |

### Cache behavior (historical → current)

- **Brand deploy (`58b4d81`):** production moved to `lexienn-shell-v3-brand2`; transparent PNG gained true alpha; UI requests `?v=2`.
- **Hotfix (`61b92b2`):** production serves `lexienn-shell-v4-installfix`; HTML and `/_next/*` no longer cached or intercepted; old caches deleted on activate.

---

## Asset expectations

| Asset | Purpose | Background |
| --- | --- | --- |
| `lexienn-logo-transparent.png` | Install gate, launch screen, header | True RGBA transparent |
| `lexienn-logo-icon.png` | Small header mark | True RGBA transparent |
| `apple-touch-icon.png` | iOS Home Screen | Lexienn navy `#163a63` |
| `favicon.png` | Browser tab | Lexienn navy `#163a63` |
| `icons/icon-*.png` | PWA manifest | Lexienn navy `#163a63` |
| `icons/maskable-icon-*.png` | Android adaptive icon | Lexienn navy with safe padding |

Cache busting: UI brand images use `?v=<BRAND_ASSET_VERSION>` from `lib/brand/brandAssetVersion.ts` (currently **2**). Bump version and `public/sw.js` `CACHE_NAME` when replacing brand PNGs (currently **`lexienn-shell-v4-installfix`**).

---

## Manual QA (on-device) — reference checklist

Use after any PWA, install-gate, or service-worker change.

### iPhone Safari (browser mode)

- [ ] Install gate appears before normal app UI.
- [ ] Logo has **no checkerboard** on dark blue background.
- [ ] Step 1 says **square-with-up-arrow icon at the bottom center of Safari**.
- [ ] Inline share icon visible with accessible label.
- [ ] "Can't see the icon?" help box is visible.
- [ ] No white “Application error” screen.

### iOS in-app browser (Instagram, Facebook, etc.)

- [ ] **Open in Safari first** panel appears instead of Safari steps.

### iPhone installed PWA

- [ ] Install gate is **not** shown.
- [ ] Launch animation can run after tap-to-start (if enabled).
- [ ] Home Screen icon shows Lexienn mark on navy (not checkerboard).

### Android Chrome

- [ ] Install gate appears in browser mode.
- [ ] **Install Lexienn** button works when `beforeinstallprompt` is available.
- [ ] Installed icon looks intentional (navy + logo).
- [ ] Standalone launch bypasses install gate.

### Desktop

- [ ] Install gate does **not** block normal use.
- [ ] Header shows Lexienn logo without checkerboard.
- [ ] Favicon appears clean in browser tab.

### Cache verification

- [ ] Hard refresh or new private tab shows updated assets.
- [ ] Service worker shows `lexienn-shell-v4-installfix` in DevTools → Application.
- [ ] Old cache names (e.g. `lexienn-shell-v3-brand2`) are not present after activate.

## Troubleshooting stale logo or shell

1. Bump `BRAND_ASSET_VERSION` in `lib/brand/brandAssetVersion.ts` (brand PNG changes only).
2. Bump `CACHE_NAME` in `public/sw.js` to match (required for any SW strategy change).
3. Run `npm run generate:icons` if icon assets changed.
4. Redeploy and run **`npm run verify:production-pwa`**.
5. Open once online so the service worker can update; test private tab and returning visit.
6. If users see a white error screen after deploy, check whether the SW is serving stale HTML — navigation must not be cache-first.
