# Mobile launch animation

Lexienn shows an optional **Iron Man-style** logo assembly when opening from an installed home-screen icon (or on the first browser visit). Animation and sound respect user preferences and browser autoplay rules.

## Components

| File | Role |
| --- | --- |
| `components/launch/LexiennLaunchScreen.tsx` | Full-screen overlay, tap-to-start, assembly, skip |
| `components/launch/lexiennLogoParts.tsx` | SVG logo pieces + final PNG frame |
| `components/launch/useLaunchAnimationPreference.ts` | React hook for launch prefs |
| `lib/launch/launchPreferences.ts` | `localStorage` / `sessionStorage` keys |
| `lib/launch/shouldShowLaunchScreen.ts` | When to show launch screen |
| `lib/audio/launchSounds.ts` | MP3 playback + Web Audio fallback |
| `components/settings/AppExperienceSettings.tsx` | Settings toggles |

## Flow

1. App loads inside `AppShell`.
2. `shouldShowLaunchScreen()` checks animation enabled, session seen, standalone / first-visit rules.
3. If launch should run, overlay shows **Enter Lexienn** (user gesture required for audio).
4. User taps → pieces animate in (~2.4s): blue swoosh (left), red swoosh (right), book L (bottom), page fold, star (top-right).
5. Final frame shows `public/brand/logo-complete.png` with a glow pulse.
6. Metal sounds play if enabled and allowed; otherwise silent / synthesized fallback.
7. Overlay fades out; main app is usable. Session flag prevents replay on every refresh.

## When it runs

| Condition | Launch shown? |
| --- | --- |
| Opened from installed PWA icon | Yes (once per session) |
| First browser visit ever | Yes (once, if animation enabled) |
| Animation disabled in Settings | No |
| Already seen this session | No |
| Route navigation | No |

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Tap-to-start still appears (for consistency on PWA open).
- Logo fades in simply — no piece assembly.
- No launch sounds.

## Sound assets

Place MP3 files in `public/sounds/` (see `public/sounds/README.md`). Missing files do not break the app.

## Settings (App Experience)

- **Launch animation** — on/off (`localStorage`)
- **Launch sound** — on/off (`localStorage`)
- **Replay launch animation** — clears session flag and reloads

## QA checklist

- [ ] Standalone PWA open shows launch screen once per session
- [ ] **Enter Lexienn** starts animation
- [ ] **Skip** dismisses within 3 seconds max
- [ ] Reduced motion → fade only
- [ ] Sound off in Settings → silent assembly
- [ ] Animation off in Settings → no overlay
- [ ] Replay button works from Settings
- [ ] App APIs initialize normally (launch does not block fetch)

## Duration

Target assembly: **1.8–2.8 seconds**. Hard cap with skip/safety timeout: **3 seconds**.
