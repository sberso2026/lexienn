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

Cache busting: UI brand images use `?v=<BRAND_ASSET_VERSION>` from `lib/brand/brandAssetVersion.ts`. Bump version and `public/sw.js` `CACHE_NAME` when replacing brand PNGs.

## Manual QA

### iPhone Safari (browser mode)

- [ ] Install gate appears before normal app UI.
- [ ] Logo has **no checkerboard** on dark blue background.
- [ ] Step 1 says **square-with-up-arrow icon at the bottom center of Safari**.
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

### Cache verification

- [ ] Hard refresh or new private tab shows updated logo (not old checkerboard).
- [ ] After deploy, service worker updates to `lexienn-shell-v3-brand2` or newer.

## Troubleshooting stale logo

1. Bump `BRAND_ASSET_VERSION` in `lib/brand/brandAssetVersion.ts`.
2. Bump `CACHE_NAME` in `public/sw.js` to match.
3. Run `npm run generate:icons`.
4. Redeploy and open once online so the service worker can update.
