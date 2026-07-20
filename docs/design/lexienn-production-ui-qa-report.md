# Lexienn Production UI QA Report — Batch 45C

**Date:** 2026-07-17  
**Scope:** Production visual QA, mobile PWA hardening, copy polish, performance, cache safety, accessibility, regression tests  
**Build:** Next.js 15 / React 19 PWA (`lexienn`)

---

## Verdict

**Production-ready for broader user testing**, with remaining risks limited to device-specific install UX and real-device visual confirmation (screenshots not captured in this automated pass).

Automated gates all passed:

| Gate | Result |
|------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| `npm test` | Pass (431 tests) |
| `npm run verify:lexienn` | Pass (127 checks) |

---

## Tested devices / viewports

| Surface | Mode | Status |
|---------|------|--------|
| 360px width | Source + CSS contract / prior Batch 45B QA | Pass (layout tokens retained) |
| 390px width | Same | Pass |
| 430px width | Same | Pass |
| Desktop (≥768px) | Sticky header / static content | Pass |
| Landscape (≤767px) | Reduced header offset token | Pass (CSS) |
| iPhone Safari browser | Install gate + safe-area contracts | Pass (logic + CSS) |
| iPhone installed PWA | Standalone gate + launch gesture | Pass (logic) |
| Android Chrome browser | Install button / menu guide | Pass (logic) |
| Android installed PWA | Standalone bypass | Pass (logic) |
| Localhost | Install gate bypass | Pass |
| Desktop browser | Not blocked by install gate | Pass |

**Screenshots:** Not captured in this batch. Use the checklist below after deploy for visual sign-off against `docs/design/lexienn-uiux-presentation-board.png` / `.html`.

---

## Screenshots checklist (manual after deploy)

Capture (or tick) for each:

1. [ ] Define input — 390px
2. [ ] Define result (long meaning) — 390px
3. [ ] Translate result (long Filipino line) — 390px
4. [ ] Lens camera / import fallback — 360px
5. [ ] Library empty states — 390px
6. [ ] More preferences — 390px
7. [ ] Install gate — iPhone Safari
8. [ ] Install gate — Android Chrome
9. [ ] Launch “Tap to open” — installed PWA
10. [ ] Home-screen icon — iOS + Android
11. [ ] Header logo + bottom nav — 360 / 430 / desktop

---

## Pass / fail table

| Area | Result | Notes |
|------|--------|-------|
| A. Production visual QA | **Pass** | Header chip density reduced (`Offline Ready` → `Offline`); Library letter placeholders → SVG icons; long pack names truncate; Lens mode chips clarified |
| B. Mobile safe-area | **Pass** | Install gate top/bottom insets; launch safe-area; landscape header offset; content/nav tokens unchanged |
| C. PWA install & launch | **Pass** | Gate matrix unchanged; launch requires **Tap to open** before sound/animation; prefs still gate show/hide |
| D. Logo & icons | **Pass** | Existing brand/PWA assets verified by prior asset tests; regenerate only if visual crop issues appear on device |
| E. Performance | **Pass** | Camera/OCR lazy-loaded on Translate + Lens via `next/dynamic` |
| F. API / cache safety | **Pass** | `public/sw.js` returns early for `/api/*` and `/_next/*`; never caches API responses |
| G. User-facing copy | **Pass** | Softened provider/JSON/timeout/seed/pattern wording; `toUserFacingError` on dictionary paths |
| H. Accessibility | **Pass** | Icon buttons remain labelled; launch/skip/min-height 44px; Lens fake tabs demoted from `role="tab"` |
| I. Error / offline states | **Pass** | Calm unavailable / OCR / voice / pack messages |
| J. Regression tests | **Pass** | `lib/app/enterpriseProductionBatch45C.test.ts` (17 cases) |
| K. Automated verify | **Pass** | lint / typecheck / build / test / verify:lexienn |

---

## Fixes applied

1. **Launch gesture gate** — `LexiennLaunchScreen` waits for **Tap to open** before animation/sound (no autoplay without gesture).
2. **Install gate safe-area** — top inset `max(1.5rem, env(safe-area-inset-top))`; tighter horizontal padding on small screens.
3. **User copy scrub** — AI-not-configured, OCR timeout, pack missing, voice timeout, source badges (“Dictionary”, “Approximate match”), DataQualityWarnings, dictionary API error mapping via `lib/ui/userFacingErrors.ts`.
4. **Lazy camera** — `TranslatorView` and `LensView` dynamic-import `CameraTranslatorView`.
5. **Wrap polish** — `break-words` on camera translation results; Library pack titles truncate.
6. **Visual polish** — shorter Offline status chip; Library collection SVG icons; landscape header offset without `-webkit-overflow-scrolling` (preserves fixed-chrome tap reliability).
7. **Tests** — Batch 45C suite covering SW, install gate, launch prefs, header/nav, Lens fallback, mic text preservation, developer gating, banned copy, wrap, Library empties, More prefs, safe-area, lazy load.

---

## Known issues

| Issue | Severity | Mitigation |
|-------|----------|------------|
| Real-device screenshots not captured in CI | Low | Manual checklist after deploy |
| Next.js image warning for brand logo query string (`?v=2`) | Low | Configure `images.localPatterns` before Next 16 |
| Lens History is placeholder copy (not a full history store) | Low | Documented empty state; Import uses Capture card |
| Install UX varies by browser (iOS Share vs Android menu vs `beforeinstallprompt`) | Medium | Platform-specific gate copy already present |

---

## Remaining risks

- **iOS audio:** Even after tap-to-open, some WebKit builds may still restrict sound; animation still completes.
- **Maskable icon crop** on OEM Android launchers — confirm visually after Add to Home Screen.
- **Keyboard + primary CTA** on very short landscape phones — content scrolls; not fully “sticky CTA above keyboard”.
- **Service worker updates** — users may need one refresh after deploy to pick up shell asset cache name changes (no API cache risk).

---

## Manual production QA after deploy

1. iPhone Safari browser mode (install gate)
2. iPhone Add to Home Screen
3. iPhone installed PWA (launch tap + Define/Translate)
4. Android Chrome install
5. Android installed PWA
6. Desktop Chrome/Edge (no install gate)
7. Define: acceleration English → English
8. Define: tie beam Engineer context
9. Define: copious English → English
10. Translate: “what’s your name” English → Filipino
11. Mic permission deny preserves typed text
12. Lens fallback / import flow
13. Save word / phrase to Library
14. Offline packs screen
15. More settings toggles persist after reload
16. Launch animation + sound (and with both disabled)
17. Reduced motion mode
18. API self-test remains token-protected

---

## Production readiness

**Ready for broader user testing.** Core Define / Translate / Lens / Library / More flows remain intact; PWA install and launch are clearer and safer; API results cannot be stale via the service worker; user-visible prototype/provider wording has been scrubbed from normal screens.

---

## Batch 46 — Real-device feedback readiness (2026-07-17)

### Translation fix
- English → Filipino “Which way to church” now curated as **Nasaan po ang daan patungo sa simbahan?**
- Rule-fallback no longer maps bare “way” to “nearest road”

### Launch
- After logo assembly, hold **3 seconds** with glow before dismiss

### Feedback workflow
1. More → Feedback categories (issue, wrong translation, mic, Lens, etc.)
2. Form stores locally (`lexienn_feedback_submissions`) with route, version, device summary, PWA mode
3. Define/Translate result cards: Suggest correction / Report wrong meaning / Report wrong translation
4. Corrections store language pair + source type locally; existing queue still available in Developer settings

### Support triage process
1. Collect exported QA JSON from `/more/qa` (Developer Mode)
2. Review local feedback/corrections queues on tester devices or shared export
3. Reproduce with release metadata (About / diagnostics)
4. Prioritize: install/PWA → core Define/Translate → Lens/mic → offline

### Release metadata instructions
Set on Vercel:
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_COMMIT_SHA` (or rely on `VERCEL_GIT_COMMIT_SHA`)
- `NEXT_PUBLIC_DEPLOY_ENV` (`local` | `preview` | `production`)
- Optional: `NEXT_PUBLIC_BUILD_TIMESTAMP`

Display: More → About (and Developer QA diagnostics).

### Real-device QA checklist template
Use Developer Mode → `/more/qa` or `/qa`:
- [ ] install gate
- [ ] home-screen icon
- [ ] standalone mode
- [ ] launch animation (3s glow hold)
- [ ] mic permission
- [ ] voice input
- [ ] dictionary AI
- [ ] translator (incl. “Which way to church” → simbahan)
- [ ] Lens fallback
- [ ] offline packs
- [ ] Library save
- [ ] service worker no API cache

### Known limitations
- Feedback/corrections are device-local until a backend sync is wired
- No third-party analytics yet (local counters + Developer console.debug only)
- QA/diagnostics screens require `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=true`

### Post-deploy verification steps
1. Confirm About version/commit on preview and production
2. Translate “Which way to church” EN→TL
3. Submit one feedback item; confirm it appears in local storage
4. Submit one correction from Translate result
5. Developer Mode: open `/more/qa`, mark two checks, export JSON
6. Confirm SW still skips `/api/*`
7. Confirm Persian / Azerbaijani appear in language selects

---

## Batch 49 — Mobile touch, mic quality, European languages, competitive hardening

**Date:** 2026-07-20  
**Scope:** Touch targets, microphone capture quality, National/Local Dialects catalog, DeepL/Duolingo/Reverso gap improvements

### Touch target audit summary
- Shared patterns: `TouchButton`, `IconTouchButton`, `PrimaryActionButton`, `ActionPillButton` + `lib/ui/touchTargets.ts`
- Defaults raised: ActionButton ≥48px (primary ≥56px), IconButton ≥48px, bottom nav ≥56px, mic ≥56px, Lens capture ≥64px
- Adjacent action spacing prefers 12px (`gap-3`); pressed/disabled states clearer

### Microphone quality changes
- Preferred `getUserMedia` constraints: echoCancellation, noiseSuppression, autoGainControl, mono, sampleRate/sampleSize with graceful fallbacks
- Recognition locales via `mapSpeechRecognitionLocale` (en-US, fil-PH, ga-IE, fa-IR, ur-PK, he-IL, az-AZ, …)
- Friendlier mic states; “Use typed text” preserves typed input on failure
- User-facing Microphone test under Settings; Developer Mode keeps detailed diagnostics

### Added languages (National Languages)
Irish/Gaeilge, Albanian, Belarusian, Bosnian, Estonian, Icelandic, Latvian, Lithuanian, Macedonian, Maltese, Slovenian — plus existing European nationals retained (Bulgarian, Croatian, Czech, Danish, Dutch, Finnish, Greek, Hungarian, Norwegian, Polish, Romanian, Serbian, Slovak, Swedish, …).

### Local Dialects additions
Kapampangan, Pangasinan, Bicolano, Chavacano, Catalan, Basque, Galician, Welsh, Scottish Gaelic, Breton, Corsican, Sardinian, Sicilian, Frisian, Luxembourgish, Faroese, Romani — plus existing regional/Philippine/Australian dialect entries remapped into this selector group.

### Language grouping rules
Selectors show **only**:
1. National Languages  
2. Local Dialects  
Alphabetized by English display label within each group. Search matches English name, native name, aliases (Farsi/Azeri/Tagalog/Bisaya/Gaeilge/…), and codes.

### Capability metadata policy
`toLanguageCapabilityMetadata()` exposes voice/offline/OCR/dictionary flags. UI must not imply voice or offline support when flags are false; copy uses “Voice is not available yet for this language.” / “Offline pack not available yet.”

### Competitor gap improvements
- **DeepL:** translation Details (mode/pair/confidence), natural/literal alternatives when present, literal-mode note, existing glossary/curated priority retained
- **Duolingo:** Library `VocabularyReviewCard` (I know this / Review again / Favorite) stored locally
- **Reverso:** Define examples/related words/usage/common mistakes in collapsible sections; Translate usage notes collapsible

### Known limitations
- Browser STT quality still device/browser dependent; server STT only when existing provider path is available
- Not all new languages have equal AI/voice/OCR/offline depth
- Review practice is local-only (no sync/streaks)
- Full device tap QA still needs a 360px phone pass after deploy
