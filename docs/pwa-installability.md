# Lexienn PWA installability

Lexienn ships a [Web App Manifest](../app/manifest.ts) and home-screen icons so users can install it on mobile devices. The installed app appears as **Lexienn** on the home screen or app drawer.

## What is included

| Asset | Location |
| --- | --- |
| Web manifest | `app/manifest.ts` (served at `/manifest.webmanifest`) |
| Icons (192 / 512, any + maskable) | `public/icons/` |
| Mobile metadata | `app/layout.tsx` (`themeColor`, Apple web app tags) |

Icons use Lexienn navy (`#1e3a5f`) and an **L** mark. Replace files in `public/icons/` when final brand assets are ready (keep the same filenames and sizes).

## What is **not** included

- **No service worker** — Lexienn does not cache the full app shell for offline browsing.
- **No claim of full offline web app** — only **downloaded offline phrase packs** (IndexedDB / local storage) work without network.
- **No native app** — installability is browser-based; this is not an App Store or Play Store build.

### Offline-first (unchanged)

- Downloaded packs remain the **local source of truth**.
- Cloud/API is optional for generation, pack updates, OCR, voice, and sync.
- Downloaded packs work offline after download.
- Missing dictionary requests stay local until sync.

## Test installability — Android (Chrome)

1. Deploy Lexienn over **HTTPS** (e.g. Vercel preview or production URL).
2. Open the site in **Chrome** on Android.
3. Open Chrome menu → **Install app** or **Add to Home screen** (wording varies by Chrome version).
4. Confirm the prompt shows **Lexienn** and the app icon.
5. Launch from the home screen — expect **standalone** display (no browser URL bar).
6. Optional: Chrome DevTools → **Application → Manifest** (remote debugging) to verify `name`, `start_url`, `display`, and icons.

**Requirements (Chrome):** valid manifest, `start_url`, `display`, 192×192 and 512×512 icons, served over HTTPS.

## Test installability — iOS (Safari)

1. Open Lexienn in **Safari** on iPhone/iPad (HTTPS).
2. Tap **Share** → **Add to Home Screen**.
3. Confirm name **Lexienn** and icon, then tap **Add**.
4. Open from the home screen — Safari runs it in a standalone web app frame.

iOS does not use the same install prompt as Android. `appleWebApp` metadata in `app/layout.tsx` improves home-screen behaviour.

## Limitations

| Topic | Notes |
| --- | --- |
| **Browser-dependent** | Install UI and PWA feature support vary by browser and OS version. |
| **iOS PWA** | No Android-style beforeinstallprompt; users must use Share → Add to Home Screen. |
| **Offline shell** | Without a service worker, uncached routes need network on first load. Offline packs still work from IndexedDB. |
| **Spotlight / AppSearch** | Deep system search indexing (iOS Spotlight, Android AppSearch) needs a **native** app later — not provided by this PWA. |
| **Push / background sync** | Not implemented in this batch. |

## Icon replacement TODO

When final brand design is approved:

1. Export **192×192** and **512×512** PNG (any purpose).
2. Export **maskable** variants with ~20% safe-zone padding (or regenerate maskable files from the master icon).
3. Overwrite `public/icons/icon-*.png` (same paths — no manifest change required).
4. Re-run `npm run build` and retest install on Android and iOS.

## Related docs

- [offline-first-architecture.md](./offline-first-architecture.md)
- [production-deployment-checklist.md](./production-deployment-checklist.md)
- [mobile-qa-checklist.md](./mobile-qa-checklist.md)
