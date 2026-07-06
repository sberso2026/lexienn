# Lexienn PWA installability

Lexienn ships a [Web App Manifest](../app/manifest.ts), home-screen icons, a minimal service worker, and install guidance so users can add Lexienn to their phone home screen.

## What is included

| Asset | Location |
| --- | --- |
| Web manifest | `app/manifest.ts` (served at `/manifest.webmanifest`) |
| Icons (72–512, any + maskable) | `public/icons/` |
| Apple touch icon | `public/apple-touch-icon.png` |
| Favicon | `public/favicon.png` |
| Brand logo | `public/brand/lexienn-logo.png` |
| Service worker | `public/sw.js` |
| Install gate (mobile browser) | `components/pwa/MobileInstallGate.tsx` |
| Install prompt (legacy) | `components/pwa/InstallAppPrompt.tsx` (superseded by gate on mobile) |
| Mobile metadata | `app/layout.tsx` (`themeColor`, Apple web app tags) |

Regenerate icons after updating the master logo:

```bash
npm run generate:icons
```

## Service worker scope

The service worker caches only the **app shell** and static assets (icons, brand images). It does **not** cache `/api/*` responses. Offline phrase packs continue to use IndexedDB / local storage as before.

## Mobile install gate (Batch 44)

On **mobile browsers** (not standalone PWA), Lexienn shows a full-screen **Install Lexienn** gate before normal use. Users must add the app to their home screen and open it from the installed icon.

- **iPhone Safari** — guided Share → Add to Home Screen steps (iOS cannot auto-install).
- **Android Chrome** — native install button when `beforeinstallprompt` is available; menu steps as fallback.
- **Desktop** — not blocked.
- **localhost** — not blocked (development).
- **Developer bypass** — only when `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=true`.

After installing and opening from the home-screen icon, the app runs in **standalone** mode and the launch animation plays (Batch 43).

## QA checklist

### Android Chrome install

1. Deploy Lexienn over **HTTPS** (Vercel production or preview).
2. Open in **Chrome** on Android.
3. Use menu → **Install app** / **Add to Home screen**, or accept the in-app **Install Lexienn** prompt when shown.
4. Confirm name **Lexienn** and the Lexienn logo icon.
5. Launch from the home screen — expect **standalone** display (no URL bar).
6. Chrome DevTools → **Application → Manifest** (remote debugging) to verify `name`, `start_url`, `display: standalone`, and icons.

### iPhone Safari Add to Home Screen

1. Open Lexienn in **Safari** on iPhone (HTTPS).
2. Tap **Share** → **Add to Home Screen**.
3. Confirm name **Lexienn** and icon, then tap **Add**.
4. Open from the home screen — Safari runs it in a standalone web app frame.
5. The in-app install card shows manual steps when `beforeinstallprompt` is unavailable.

### Home-screen icon launch

1. After install, confirm the home-screen icon uses the Lexienn logo (not a generic browser icon).
2. Cold-start the app from the icon.

### Standalone display test

1. Open from the installed icon.
2. Verify no browser chrome (address bar / tab UI) where the platform supports standalone PWAs.
3. `lib/pwa/isStandaloneApp.ts` detects `display-mode: standalone` and iOS `navigator.standalone`.

### Offline shell test

1. Install the PWA and open once online so the service worker can cache shell assets.
2. Enable airplane mode.
3. Reload — shell and icons should load from cache; API routes remain network-dependent.
4. Downloaded offline packs should still work from IndexedDB.

### Mic permission after PWA launch

1. Install and open from home screen.
2. Go to Translator or Dictionary voice input.
3. Tap the mic — native permission prompt should appear (see Batch 42 mic flow).

### Reduced motion test

1. Enable **Reduce Motion** in OS accessibility settings.
2. Open Lexienn from the installed icon.
3. Launch screen shows a simple fade-in of the logo — no assembly animation, no sound.

### Sound blocked fallback test

1. Open in a fresh session with launch animation enabled.
2. Tap **Enter Lexienn**.
3. If MP3 files are missing or autoplay is blocked, animation still completes using synthesized fallback clicks (or silence) without errors.

### Replay launch animation test

1. Open **Settings → App Experience**.
2. Tap **Replay launch animation**.
3. Confirm the launch screen appears again after reload.

### Install prompt dismissal

1. Dismiss the install card.
2. Reload — prompt should not reappear (`localStorage` dismissal flag).

## Limitations

| Topic | Notes |
| --- | --- |
| **Browser-dependent** | Install UI and PWA support vary by browser and OS version. |
| **iOS PWA** | No Android-style `beforeinstallprompt`; users use Share → Add to Home Screen. |
| **API offline** | Dictionary / translator APIs require network unless covered by offline packs. |
| **Spotlight / AppSearch** | System search indexing needs a native app — not provided by this PWA. |
| **Push / background sync** | Not implemented. |

## Related docs

- [mobile-launch-animation.md](./mobile-launch-animation.md)
- [offline-first-architecture.md](./offline-first-architecture.md)
- [production-deployment-checklist.md](./production-deployment-checklist.md)
- [mobile-qa-checklist.md](./mobile-qa-checklist.md)
