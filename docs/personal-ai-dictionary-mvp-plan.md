# Personal AI Dictionary — MVP Implementation Plan

**Batch 0 deliverable** · Repository discovery completed 2026-07-03

---

## 1. Repository Discovery Summary

| Item | Finding |
|------|---------|
| **Repository state** | **Empty** — no source files, config, or git history detected |
| **Project type** | Greenfield — new app scaffold required in **Batch 1** |
| **Framework** | None present — will use **Next.js (App Router)** per MVP spec |
| **Package manager** | None — will use **npm** (default for Next.js scaffold) |
| **Routing** | None — will use Next.js App Router file-based routes |
| **Styling** | None — will use **Tailwind CSS** (included in Next.js scaffold) |
| **Database** | None — **Supabase-ready architecture** planned; MVP uses **localStorage / IndexedDB** |
| **Auth** | None — no existing auth to preserve; admin-lite is local-only for MVP |
| **Tests** | None — will add lint/typecheck/build scripts via Next.js; no test runner yet |
| **Existing features** | None — safe to scaffold without migration risk |

### Conclusion

This is an **empty repository**. Batch 1 must scaffold a full Next.js + React + TypeScript + Tailwind application before any feature work begins.

---

## 2. Recommended MVP Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Client)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Pages / UI   │  │ Local Store  │  │ Web Speech API (TTS) │ │
│  │ (React)      │  │ localStorage │  │                      │ │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘ │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ lib/ — types, schemas, mock data, profession engine,     │   │
│  │        offline resolver, storage helpers                   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ POST /api/dictionary/generate
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js Server (API Routes)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Zod validate │→ │ AI wrapper   │→ │ Mock / AI provider   │ │
│  │              │  │ (isolated)   │  │ (key optional)       │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (future)
                    ┌──────────────────┐
                    │ Supabase         │
                    │ (auth, sync, DB) │
                    └──────────────────┘
```

### Stack (to be created in Batch 1)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15+ (App Router) | SSR/API routes, file-based routing, production-ready |
| UI | React 19 + TypeScript | Type safety, component model |
| Styling | Tailwind CSS | Mobile-first, dark mode support |
| Validation | Zod | Shared client/server schemas |
| Offline storage | localStorage (+ IndexedDB if needed) | No backend required for MVP |
| TTS | `window.speechSynthesis` | Free, browser-native, no API keys |
| AI (later) | Isolated service wrapper | Mock fallback when `AI_API_KEY` missing |
| Database (future) | Supabase | Auth, sync, corrections queue — not required for MVP |

### Directory structure (proposed)

```
/
├── app/
│   ├── layout.tsx                 # Root layout, AppHeader, AppNav
│   ├── page.tsx                   # Redirect or home
│   ├── dictionary/
│   │   ├── page.tsx               # Lookup form
│   │   └── result/page.tsx        # Result display
│   ├── my-dictionary/page.tsx
│   ├── offline/page.tsx
│   ├── phrase-packs/page.tsx
│   ├── corrections/page.tsx
│   ├── settings/page.tsx
│   ├── admin/
│   │   └── languages/page.tsx
│   └── api/
│       └── dictionary/
│           └── generate/route.ts
├── components/
│   ├── layout/                    # AppHeader, AppNav, PageContainer
│   ├── ui/                        # FeatureCard, StatusBadge, EmptyState, etc.
│   ├── dictionary/                # LookupForm, ResultCard
│   ├── offline/                   # PhraseCard, CategoryButtons, ResponseButtons
│   └── admin/                     # Admin panels
├── lib/
│   ├── types/                     # TypeScript interfaces
│   ├── schemas/                   # Zod schemas
│   ├── mock/                      # Seed languages, dialects, entries, phrase packs
│   ├── dictionary/                # Profession engine, AI prompt, AI wrapper
│   ├── offline/                   # OfflineTranslationResolver, phrase pack store
│   ├── storage/                   # localStorage helpers (saved words, corrections, packs)
│   └── audio/                     # speechSynthesis helpers
├── docs/
│   └── personal-ai-dictionary-mvp-plan.md
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Proposed Routes / Pages

| Route | Purpose | Batch |
|-------|---------|-------|
| `/` | Redirect to `/dictionary` or landing with nav | 1 |
| `/dictionary` | Word/phrase lookup form | 1 (shell), 3 (form) |
| `/dictionary/result` | Structured dictionary result card | 1 (shell), 4 (card) |
| `/my-dictionary` | Saved personal dictionary | 1 (shell), 6 (persistence) |
| `/offline` | Remote communication mode (downloaded packs only) | 1 (shell), 8 (full UI) |
| `/phrase-packs` | Browse and mark packs as downloaded | 1 (shell), 7 (packs) |
| `/corrections` | Local correction submission queue | 1 (shell), 10 (queue) |
| `/settings` | User context profile, language defaults | 1 (shell), later wiring |
| `/admin/languages` | Admin-lite language/dialect management | 1 (shell), 11 (admin) |
| `POST /api/dictionary/generate` | AI dictionary generation (mock fallback) | 12 |

---

## 4. Proposed Components

### Layout (Batch 1)

| Component | Responsibility |
|-----------|----------------|
| `AppHeader` | App title "Personal AI Dictionary", optional status indicators |
| `AppNav` | Main navigation links, mobile-friendly |
| `PageContainer` | Consistent padding, max-width, mobile-first |

### UI primitives (Batch 1)

| Component | Responsibility |
|-----------|----------------|
| `FeatureCard` | Card wrapper for features and phrase cards |
| `StatusBadge` | MVP / unfinished feature badges |
| `EmptyState` | No data placeholders |
| `LanguageBadge` | Language + dialect display |
| `ConfidenceBadge` | Confidence score with color coding |

### Dictionary (Batches 3–4)

| Component | Responsibility |
|-----------|----------------|
| `DictionaryLookupForm` | Input, language/dialect/context selectors, submit |
| `DictionaryResultCard` | Full structured result display |
| `PronunciationBlock` | Sound-out, syllables, optional IPA |
| `ExampleSentences` | General, professional, target-language samples |
| `AudioButton` | Play / repeat slowly via speech synthesis |

### Offline (Batches 7–8)

| Component | Responsibility |
|-----------|----------------|
| `PhrasePackList` | Available packs with download toggle |
| `CategoryButtonGrid` | Emergency, directions, food, etc. |
| `OfflinePhraseCard` | Phrase display with large-text and audio |
| `LocalResponseButtons` | yes/no/left/right/etc. communication board |

### Admin (Batch 11)

| Component | Responsibility |
|-----------|----------------|
| `LanguageManager` | View/add languages and dialects |
| `ConfidenceEditor` | Update confidence and validation status |
| `CorrectionQueueView` | Pending local corrections |
| `LowConfidenceList` | Entries below threshold |

---

## 5. Proposed Data Models

All models will be defined as TypeScript types + Zod schemas in **Batch 2**.

### Core entities

```typescript
// Enums
EntryType: word | phrase | idiom | slang | proverb | technical_term | sentence
UserContext: general | student | household_family | engineer | construction_worker |
             business_owner | farmer | traveller | health_emergency | custom
ValidationStatus: ai_generated | verified_dictionary | community_corrected |
                  native_speaker_reviewed | professionally_reviewed | uncertain
AudioType: native_recorded | synthetic_tts | cached_cloud_tts | unavailable

// Models
Language          { id, code, name, native_name, is_active }
Dialect           { id, language_id, name, variant_label, confidence_level, validation_status }
UserContextProfile { context, label, explanation_level_default }
DictionaryQuery   { input_text, source_language, target_language, target_dialect?,
                    user_context, explanation_level, output_mode }
DictionaryEntry   { id, input_text, source_language, target_language, target_dialect,
                    entry_type, general_meaning_en, detailed_meaning_en,
                    target_meaning, profession_meanings[], examples[],
                    pronunciation, usage_notes, related_terms[], common_mistakes[],
                    confidence_score, validation_status, audio_type }
ProfessionMeaning { context, meaning_en, caution_note? }
PronunciationInfo { simple, syllables?, ipa? }
ExampleSentence   { text, language, context_label }
OfflinePhrase     { id, english, target_text, dialect_id, pronunciation_simple,
                    category, audio_type, validation_status, confidence_score,
                    local_responses? }
OfflinePhrasePack { id, language_id, dialect_id, name, categories[], phrases[],
                    phrase_count, estimated_size_kb }
SavedWord         { id, input_text, target_language, target_dialect, user_context,
                    short_meaning, target_meaning, pronunciation_simple,
                    saved_at, validation_status, confidence_score }
CorrectionSubmission { id, original_text, current_translation, suggested_correction,
                       language, dialect, correction_type, contributor_note,
                       is_native_speaker, is_profession_reviewer, status, created_at }
```

### Storage keys (localStorage)

| Key | Content |
|-----|---------|
| `pad_saved_words` | `SavedWord[]` |
| `pad_downloaded_packs` | `string[]` (pack IDs) |
| `pad_corrections` | `CorrectionSubmission[]` |
| `pad_admin_overrides` | Custom dialects, confidence edits |
| `pad_user_settings` | Default language, context, theme |

---

## 6. Proposed Offline Storage Approach

| Concern | MVP approach | Future upgrade |
|---------|--------------|----------------|
| Saved dictionary | `localStorage` JSON array | Supabase `saved_words` table |
| Downloaded phrase packs | `localStorage` pack ID list; phrases from bundled mock data | IndexedDB or Service Worker cache |
| Corrections queue | `localStorage` with `pending_sync` status | Supabase sync on upload |
| Admin overrides | `localStorage` merge over mock seed | Supabase admin tables |
| User settings | `localStorage` | Supabase user profile |
| Offline translation | In-memory resolver over downloaded pack phrases | On-device ML (native app) |

**Principles:**
- All offline features work without network after initial page load.
- Mock phrase data ships with the app bundle (no real file download in MVP).
- "Mark as downloaded" simulates pack availability for offline mode.
- No claim of native-speaker validation on mock data.

---

## 7. Proposed API Routes

| Method | Route | Purpose | Batch |
|--------|-------|---------|-------|
| `POST` | `/api/dictionary/generate` | Generate dictionary entry (mock or AI) | 12 |

### Request body (Zod-validated)

```json
{
  "input_text": "load",
  "source_language": "en",
  "target_language": "tl",
  "target_dialect": "tl-manila",
  "user_context": "engineer",
  "explanation_level": "professional",
  "output_mode": "explain_and_translate"
}
```

### Response

Structured `DictionaryEntry` JSON. Falls back to deterministic mock when `AI_API_KEY` is unset or AI output fails validation.

### Environment variables (`.env.example`)

```
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
# Future:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 8. Batch Execution Plan

| Batch | Name | Depends on | Key deliverables |
|-------|------|------------|------------------|
| **0** | Repository discovery & plan | — | This document |
| **1** | App shell & navigation | 0 | Next.js scaffold, 8 routes, layout components |
| **2** | Types, schemas, mock data | 1 | `lib/types`, `lib/schemas`, `lib/mock` |
| **3** | Dictionary lookup form | 2 | Form with validation, mock result routing |
| **4** | Dictionary result card | 2, 3 | Full result UI, speech synthesis |
| **5** | Profession-aware engine | 2 | `getProfessionAwareMeaning()` etc. |
| **6** | My Dictionary persistence | 2, 4 | localStorage save/search/filter/export |
| **7** | Offline phrase packs | 2 | Pack list, download simulation |
| **8** | Offline remote mode | 7 | Category UI, phrase cards, response buttons |
| **9** | Offline sentence translation | 7, 8 | `OfflineTranslationResolver` |
| **10** | Correction queue | 2, 4 | Form + local storage + corrections page |
| **11** | Admin lite | 2, 10 | Language/dialect manager, low-confidence view |
| **12** | API route | 2, 5 | `POST /api/dictionary/generate` |
| **13** | AI prompt & guardrails | 12 | `aiDictionaryPrompt.ts`, strict JSON schema |
| **14** | Polish & accessibility | 1–13 | Loading/error states, a11y, mobile UX |
| **15** | Verification & final report | 14 | Checklist script, final report doc |

---

## 9. Risks and Assumptions

### Risks

| Risk | Mitigation |
|------|------------|
| Mock dialect data may be inaccurate | Label all mock data; show validation status badges; never claim native-speaker verified |
| `speechSynthesis` unavailable or poor quality on some devices | Graceful fallback message; no paid TTS in MVP |
| localStorage size limits (~5 MB) | Phrase packs stay in bundle; only IDs persisted |
| Empty repo — no CI/CD yet | Add lint/typecheck/build in Batch 1; verification script in Batch 15 |
| OneDrive sync may cause file conflicts | User should be aware; consider local dev outside synced folder if issues arise |
| AI hallucination when keys added later | Strict Zod output validation, prompt guardrails (Batch 13), safe fallback |

### Assumptions

1. **npm** is available on the developer machine for Batch 1 scaffold.
2. MVP targets **modern browsers** with ES2020+ and optional Web Speech API.
3. **No authentication** required for MVP; single-user local data is acceptable.
4. **Supabase** integration is architectural placeholder only until post-MVP.
5. **English** is the primary explanation language; target languages per spec (Tagalog, Cebuano, Hiligaynon, Ilocano, Waray, Indonesian, Malay, Spanish).
6. Profession-aware meanings use **deterministic rules** over curated mock data — not real AI until Batch 12+.
7. Offline translation is **phrase/template matching only** — not full sentence AI translation.
8. Admin-lite has **no role-based security** unless auth is added later.

### Out of scope (explicitly excluded from MVP)

- Payment, subscriptions, social login
- Enterprise features, multi-tenant isolation
- Advanced speech-to-speech translation
- Camera OCR
- Native mobile app
- Complex AI model hosting
- Real file downloads for phrase packs
- Native-speaker validation workflow (corrections are local queue only)

---

## 10. Batch 1 Prerequisites

Before starting Batch 1, run:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Then add **Zod** and create layout components and placeholder pages per the route table above.

---

## 11. Acceptance Criteria — Batch 0

- [x] Repository inspected — confirmed empty
- [x] Stack identified — none present; Next.js scaffold required
- [x] Planning document created at `docs/personal-ai-dictionary-mvp-plan.md`
- [x] No unrelated files changed
- [x] No feature implementation yet

**Next recommended batch:** **Batch 1 — App Shell and Navigation** (includes Next.js scaffold)
