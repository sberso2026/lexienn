# PWA brand assets — deploy validation

Use this checklist after deploying brand-asset or icon changes to https://lexienn.rtbea.com.au.

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

```bash
npm run verify:production-pwa
# optional custom URL:
npm run verify:production-pwa -- https://lexienn.rtbea.com.au
```

## Asset expectations

| Asset | Purpose | Background |
| --- | --- | --- |
| `lexienn-logo-transparent.png` | Install gate, launch screen, header | True RGBA transparent |
| `lexienn-logo-icon.png` | Small header mark | True RGBA transparent |
| `apple-touch-icon.png` | iOS Home Screen | Lexienn navy `#163a63` |
| `favicon.png` | Browser tab | Lexienn navy `#163a63` |
| `icons/icon-*.png` | PWA manifest | Lexienn navy `#163a63` |
| `icons/maskable-icon-*.png` | Android adaptive icon | Lexienn navy with safe padding |

Cache busting: UI brand images use `?v=<BRAND_ASSET_VERSION>` from `lib/brand/brandAssetVersion.ts` (currently **2**). Bump version and `public/sw.js` `CACHE_NAME` when replacing brand PNGs (currently **lexienn-shell-v3-brand2**).

---

## Production QA log — 6 July 2026

| Field | Value |
| --- | --- |
| **Date tested** | 6 July 2026 (UTC+8) |
| **Deploy** | `main` @ `58b4d81` pushed to GitHub → Vercel production |
| **Production URL** | https://lexienn.rtbea.com.au |
| **Automated result** | **PASS** (`npm run verify:production-pwa`) |

### Devices / browsers tested

| Target | Method | Result | Notes |
| --- | --- | --- | --- |
| Production service worker | `GET /sw.js` | **PASS** | `CACHE_NAME = lexienn-shell-v3-brand2` live |
| Transparent brand PNG | Pixel analysis on production | **PASS** | RGBA, ~76% transparent, 0 checkerboard opaque pixels |
| Versioned brand URL `?v=2` | `GET /brand/lexienn-logo-transparent.png?v=2` | **PASS** | Same clean RGBA asset |
| Favicon | Pixel analysis | **PASS** | Lexienn navy background, no checkerboard pattern |
| Apple touch icon | Pixel analysis | **PASS** | Lexienn navy background, no checkerboard pattern |
| HTML metadata | `GET /translator` | **PASS** | `apple-touch-icon.png?v=2` in document head |
| iPhone Safari install gate UI | Automated bundle + unit tests | **PASS** (code) | Wording + share SVG in `MobileInstallGate.tsx`; **on-device visual confirm recommended** |
| iPhone Safari private tab | Manual | **Pending** | Agent cannot run Safari on device — open private tab and confirm logo on dark blue |
| iPhone installed PWA | Manual | **Pending** | Add to Home Screen → confirm gate bypassed, no Safari bar, navy icon |
| Stale cache migration | Automated SW bump + versioned URLs | **PASS** (infra) | Old `v2` cache invalidated on activate; brand images use `?v=2`. **On a device that saw checkerboard: open once online, then recheck** |
| iOS Chrome / in-app browser | Unit tests (`getIOSInstallGuideMode`) | **PASS** (code) | Shows “Open in Safari first”, not Safari steps |
| Android Chrome install | Unit tests + unchanged flow | **PASS** (code) | `beforeinstallprompt` + menu fallback unchanged |
| Desktop | Unit tests (`shouldShowMobileInstallGate`) | **PASS** (code) | Desktop not gated; header uses versioned transparent/icon assets |

### Cache behavior observed

- **Before deploy:** production served `lexienn-shell-v2` and unversioned brand PNGs (checkerboard baked in).
- **After deploy:** production serves `lexienn-shell-v3-brand2`; transparent PNG has true alpha; UI requests `?v=2`.
- **Expected client behavior:** on next visit, service worker `activate` deletes non-`v3-brand2` caches; versioned image URLs bypass stale cache entries for brand assets.

### Overall

| Area | Status |
| --- | --- |
| Automated production asset QA | **PASS** |
| On-device mobile install flow QA | **Pending manual confirmation on iPhone / Android hardware** |

---

## Manual QA (on-device)

### iPhone Safari (browser mode)

- [ ] Install gate appears before normal app UI.
- [ ] Logo has **no checkerboard** on dark blue background.
- [ ] Step 1 says **square-with-up-arrow icon at the bottom center of Safari**.
- [ ] Inline share icon visible with accessible label.
- [ ] "Can't see the icon?" help box is visible.

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

- [ ] Hard refresh or new private tab shows updated logo (not old checkerboard).
- [ ] Service worker shows `lexienn-shell-v3-brand2` in DevTools → Application.

## Troubleshooting stale logo

1. Bump `BRAND_ASSET_VERSION` in `lib/brand/brandAssetVersion.ts`.
2. Bump `CACHE_NAME` in `public/sw.js` to match.
3. Run `npm run generate:icons`.
4. Redeploy and run `npm run verify:production-pwa`.
5. Open once online so the service worker can update.
