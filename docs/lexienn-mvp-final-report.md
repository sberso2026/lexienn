# Lexienn MVP — Final Report

**Product:** Lexienn — profession-aware, offline-capable AI dictionary and voice translator  
**Report date:** 2026-07-03  
**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod  
**Verification:** `npm run verify:lexienn`

---

## 1. MVP summary

Lexienn is a web MVP for English ↔ local language/dialect lookup, profession-aware explanations, offline phrase communication, personal dictionary storage, correction submission, and admin-lite metadata management. The app runs entirely in the browser for persistence (localStorage / sessionStorage) with a server API route for dictionary generation. **No Supabase, no native mobile app, and no paid TTS** are included. AI dictionary generation is optional via environment variables; without keys, deterministic mock data and safe fallbacks are used.

All seed translations and pronunciations are **MVP mock data** unless `validation_status` explicitly indicates otherwise — they are **not native-speaker verified**.

---

## 2. Features completed

| Feature | Status | Notes |
|---------|--------|-------|
| Dictionary lookup form | ✅ | Zod validation, dialect selector, API-backed |
| Dictionary result card | ✅ | Full structured entry, badges, TTS, save, correct |
| Profession-aware meanings | ✅ | Deterministic engine over curated mock data |
| My Dictionary | ✅ | Save, search, filter, export JSON/CSV, delete |
| Phrase packs | ✅ | Download simulation via localStorage |
| Offline remote mode | ✅ | Categories, phrase cards, response board |
| Offline sentence translation | ✅ | Phrase/template/keyword matching only |
| Correction queue | ✅ | Local storage, sync simulation |
| Admin Lite | ✅ | Languages, dialects, packs overview, low-confidence |
| API dictionary generate | ✅ | `POST /api/dictionary/generate` |
| AI prompt & guardrails | ✅ | Strict JSON schema, uncertainty rules |
| Polish & accessibility | ✅ | Loading/error states, a11y, offline banner |

---

## 3. Routes completed

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/dictionary` |
| `/dictionary` | Lookup form + sample chips |
| `/dictionary/result` | Structured result card |
| `/my-dictionary` | Saved words |
| `/offline` | Remote communication mode |
| `/phrase-packs` | Pack download simulation |
| `/corrections` | Correction queue |
| `/settings` | Placeholder shell |
| `/admin/languages` | Admin Lite |
| `POST /api/dictionary/generate` | Dictionary entry generation API |

---

## 4. Components completed

**Layout:** `AppHeader`, `AppNav`, `PageContainer`, `OfflineIndicator`  
**UI:** `FeatureCard`, `StatusBadge`, `EmptyState`, `LoadingState`, `LanguageBadge`, `ConfidenceBadge`, `ValidationStatusBadge`, `WarningCallout`, `DataQualityWarnings`  
**Dictionary:** `DictionaryLookupForm`, `DictionaryResultCard`, `DictionaryResultView`, `DictionaryPageContent`  
**My Dictionary:** `MyDictionaryView`, `SavedWordCard`  
**Offline:** `OfflineRemoteModeView`, `OfflinePhraseCard`, `LocalResponseButtons`, `OfflineSentenceTranslator`  
**Phrase packs:** `PhrasePacksView`, `PhrasePackCard`  
**Corrections:** `CorrectionForm`, `CorrectionsQueueView`, `CorrectionQueueCard`  
**Admin:** `AdminLanguagesView`, `LanguageManager`, `DialectManager`, `ConfidenceEditor`, `PhrasePacksAdminPanel`, `AdminCorrectionsPanel`, `LowConfidenceList`

---

## 5. Data models and schemas completed

Defined in `lib/schemas/` with Zod:

- `Language`, `Dialect`, `UserContextProfile`
- `DictionaryQuery`, `DictionaryEntry`, `ProfessionMeaning`, `PronunciationInfo`, `ExampleSentence`
- `OfflinePhrase`, `OfflinePhrasePack`, `OfflineTranslationResult`
- `SavedWord`, `CorrectionSubmission`, `ConfidenceStatus`
- Enums: `entryType`, `userContext`, `validationStatus`, `audioType`, `explanationLevel`, `outputMode`, `phraseCategory`, `correctionType`, `correctionStatus`, `offlineResolutionMethod`

Seed mock data in `lib/mock/` validated at load via `validateMockSeedData()`.

---

## 6. Offline-capable features

| Capability | Offline? | How |
|------------|----------|-----|
| Phrase pack content | ✅ Bundled | Packs ship in app bundle; download state in localStorage |
| Offline remote mode | ✅ | Uses downloaded pack IDs only |
| Offline sentence resolver | ✅ | Deterministic matching, no network |
| My Dictionary | ✅ | localStorage |
| Corrections queue | ✅ | localStorage |
| Admin overrides | ✅ | localStorage |
| Dictionary lookup (API) | ❌ | Requires server route / internet |
| AI generation | ❌ | Requires API key + network when configured |

**Not implemented:** full offline AI translation, service worker, or native mobile offline runtime.

---

## 7. Voice / audio features

- **Browser Web Speech API** (`speechSynthesis`) for Play audio / Play voice
- Voice selection heuristics for Tagalog, Cebuano, Hiligaynon, and related codes
- Repeat slowly mode on offline phrase cards
- Graceful fallback messages when synthesis or regional voices are unavailable
- **Limitations:** Quality depends on device voices; not native-speaker recorded audio; no paid TTS API

---

## 8. Profession-aware features

- `lib/dictionary/professionEngine/` — deterministic `getProfessionAwareMeaning()`, context examples, related terms, mistakes
- Curated data for seed entries (e.g. `load`, `stress`) across engineer, household, student, etc.
- `enrichEntryWithProfessionContext()` applied to dictionary results
- Engineering/medical contexts include caution: language explanation only, not professional advice

---

## 9. API and AI fallback behaviour

**Endpoint:** `POST /api/dictionary/generate`

| Condition | `source` field | Behaviour |
|-----------|----------------|-------------|
| No `AI_API_KEY` | `mock` | `resolveMockDictionaryResult()` |
| AI configured, valid JSON | `ai` | Parsed + Zod validated entry |
| AI configured, failure/invalid JSON | `mock_fallback` | Safe mock entry |

- Request validated with `dictionaryQuerySchema`
- Invalid body → HTTP 400 with field details
- AI wrapper isolated in `lib/ai/aiDictionaryService.ts`
- Prompt guardrails in `lib/dictionary/aiDictionaryPrompt.ts`

---

## 10. Mocked or simulated features

| Item | Label |
|------|-------|
| Dictionary seed entries | MVP mock — illustrative translations |
| Phrase pack translations | MVP mock |
| Phrase pack download | Simulated (localStorage flag, no file download) |
| Correction sync | Simulated status progression |
| Admin backend | Local overrides only |
| AI without key | Mock / fallback results |
| Native speaker validation | **Not implemented** — badges show `ai_generated` / `uncertain` |
| Supabase / cloud sync | **Not implemented** |

---

## 11. Known limitations

1. No authentication or multi-user isolation
2. No real file download for phrase packs (IDs persisted only)
3. Offline translation is phrase/template matching — not full sentence AI
4. Dialect accuracy not verified by native speakers
5. `speechSynthesis` quality varies by device/OS
6. localStorage size limits (~5 MB) for saved words and corrections
7. Settings page is placeholder only
8. Only OpenAI provider wired in AI service
9. No automated E2E browser tests (manual checklist required)
10. OneDrive-synced dev folders may cause file lock issues on Windows

---

## 12. Security and privacy notes

- **No auth** — single-user local data model; suitable for MVP demo only
- **API keys** — `AI_API_KEY` must stay server-side in `.env.local` (never committed)
- **Data stays on device** — saved words, packs, corrections, admin edits use browser storage
- **No telemetry** included in MVP
- **Admin Lite** has no role-based access control
- **Correction queue** is local-only; no PII encryption at rest

---

## 13. Recommended next phase

1. **Supabase integration** — auth, cloud sync for saved words and corrections
2. **Real phrase pack assets** — downloadable JSON/audio bundles
3. **Native speaker review workflow** — backend approval for corrections
4. **Expanded language/dialect coverage** with verified content pipeline
5. **E2E tests** — Playwright for critical user flows
6. **PWA / service worker** — true offline shell caching
7. **Optional paid TTS** — cached cloud TTS for higher quality
8. **Mobile packaging** — React Native or Capacitor if native app required

---

## 14. Manual test checklist

- [ ] `/dictionary` — sample chip prefills form; Explain shows result
- [ ] Result card — Play audio, confidence/validation warnings, profession meaning changes with context
- [ ] Save to My Dictionary — persists after reload; search/filter/delete work
- [ ] `/phrase-packs` — mark pack downloaded; persists after reload
- [ ] `/offline` — phrase cards, emergency mode, Play voice, Repeat slowly, large text
- [ ] Local response buttons speak yes/no/directions
- [ ] Offline sentence translator — sample sentences and unavailable fallback
- [ ] Submit correction from result + offline phrase; manage on `/corrections`
- [ ] `/admin/languages` — add dialect, edit confidence, view low-confidence list
- [ ] Browser offline — banner appears; offline page still usable with downloaded pack
- [ ] Keyboard — skip link, tab order, focus rings on buttons/inputs
- [ ] API — `POST /api/dictionary/generate` returns JSON (or use automated verify script)

---

## 15. Commands run and results

Run before release:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify:lexienn
```

| Command | Purpose |
|---------|---------|
| `lint` | ESLint across project |
| `typecheck` | TypeScript `tsc --noEmit` |
| `test` | Vitest unit tests |
| `build` | Next.js production build |
| `verify:lexienn` | Filesystem + programmatic + API smoke tests |

Automated verification covers: routes, mock seed validation, dictionary mock resolution, profession engine, offline resolver, corrections schema, admin catalog, API mock response, API 400 validation, AI JSON fallback, and AI failure → `mock_fallback`.

Items requiring a browser (TTS playback, UI interactions) are in the manual checklist above.

---

*Generated as Batch 15 deliverable for the Lexienn MVP (Batches 0–15).*
