# Deploy Lexienn on Vercel

This guide covers creating a **new Vercel project** for Lexienn from GitHub. Replace `lexienn.app` with your actual domain if different.

## Prerequisites

- Lexienn repository pushed to GitHub
- Vercel account ([vercel.com](https://vercel.com))
- Node.js 20+ locally for pre-deploy checks (optional)

## Pre-deploy verification (local)

From the repo root:

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:lexienn
```

See [production-deployment-checklist.md](./production-deployment-checklist.md) for the full release checklist.

## Create a new Vercel project (GitHub)

1. Sign in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New… → Project**.
3. **Import** your GitHub repository containing Lexienn.
4. Configure the project:

| Setting | Value |
| --- | --- |
| **Project name** | `lexienn` (recommended) |
| **Framework Preset** | Next.js |
| **Root Directory** | `.` (repo root) |
| **Build Command** | `npm run build` (default from `package.json`) |
| **Output Directory** | *(leave empty — Next.js default)* |
| **Install Command** | `npm install` (default) |

5. Add **Environment Variables** (see below) before the first production deploy, or immediately after import under **Settings → Environment Variables**.
6. Click **Deploy**.

Vercel runs `next build` automatically. Lexienn uses the App Router (`app/`) with API routes under `app/api/`.

## Environment variables

Add secrets in **Vercel → Project → Settings → Environment Variables**. Apply to **Production**, **Preview**, and **Development** as needed.

**Important:** Never prefix secret API keys with `NEXT_PUBLIC_`. Variables starting with `NEXT_PUBLIC_` are embedded in the browser bundle.

| Variable | Required | Example / notes |
| --- | --- | --- |
| `AI_ENABLED` | Recommended | `true` — enable server-side AI dictionary/translation |
| `AI_PROVIDER` | Recommended | `openai` |
| `AI_BASE_URL` | Optional | Not read by the current OpenAI client (uses `https://api.openai.com`). Reserved for custom-compatible endpoints; omit unless you extend the client. |
| `AI_API_KEY` | For AI features | OpenAI API key — **server only** |
| `AI_MODEL` | For AI features | e.g. `gpt-4o-mini` |
| `AI_FALLBACK_ENABLED` | Optional | `true` |
| `AI_TIMEOUT_MS` | Optional | `20000` |
| `VOICE_ENABLED` | Optional | `true` |
| `VOICE_PROVIDER` | Optional | `openai` |
| `VOICE_MODEL` | Optional | e.g. `gpt-4o-mini-tts` |
| `VOICE_NAME` | Optional | e.g. `alloy` |
| `VOICE_FALLBACK_ENABLED` | Optional | `true` |
| `VOICE_TIMEOUT_MS` | Optional | `20000` |
| `SPEECH_INPUT_ENABLED` | Optional | `true` |
| `SPEECH_INPUT_PROVIDER` | Optional | `openai` |
| `SPEECH_INPUT_MODEL` | Optional | `whisper-1` |
| `SPEECH_INPUT_FALLBACK_ENABLED` | Optional | `true` |
| `SPEECH_INPUT_TIMEOUT_MS` | Optional | `20000` |
| `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE` | Recommended | `false` for production |

Voice, speech, and OCR cloud features reuse `AI_API_KEY` on the server. Do not duplicate keys in public env vars.

Copy variable **names and non-secret defaults** from [`.env.example`](../.env.example). Keep real keys in Vercel only — **do not commit** `.env.local`.

## Security checklist

- [ ] `AI_API_KEY` is set only in Vercel (not in git)
- [ ] `.env.local` is gitignored (see `.gitignore`)
- [ ] No `NEXT_PUBLIC_*` variables contain API keys
- [ ] `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false` in Production
- [ ] Status routes (`/api/ai/status`, `/api/voice/status`, `/api/speech/status`) return flags only, never keys

## Custom domain

After the first successful deploy:

1. **Vercel → Project → Settings → Domains → Add Domain**
2. Add root and `www` (e.g. `lexienn.app`, `www.lexienn.app`)
3. Follow [ventraip-dns.md](./ventraip-dns.md) for VentraIP DNS records

## Offline-first behaviour (unchanged by deployment)

Deploying to Vercel does not change offline architecture:

- Downloaded language-pair packs in the browser (IndexedDB) remain the **source of truth** after download
- Cloud/API is optional for pack generation, updates, OCR, voice, and sync
- Packs work offline once downloaded; missing requests stay local until sync

See [offline-first-architecture.md](./offline-first-architecture.md).

## Optional: Vercel CLI

GitHub import is enough for most teams. CLI is optional:

```bash
npm i -g vercel
vercel login
vercel link          # link local folder to the Vercel project
vercel               # preview deployment
vercel --prod        # production deployment
```

## Troubleshooting

| Issue | Check |
| --- | --- |
| Build fails on Vercel | Run `npm run build` locally; fix TypeScript/ESLint errors |
| AI features unavailable | `AI_API_KEY`, `AI_MODEL`, `AI_ENABLED=true` in Vercel env |
| Developer tools visible | Set `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false` and redeploy |
| 404 on routes | Ensure App Router pages exist under `app/` (dictionary, translator, offline, etc.) |

## API routes (server)

Lexienn exposes server routes including:

- `POST /api/dictionary/generate`
- `POST /api/translator/translate`
- `POST /api/ocr/extract`
- `POST /api/voice/speak`
- `POST /api/speech/transcribe`
- `POST /api/offline-packs/generate`
- `GET /api/ai/status`, `/api/voice/status`, `/api/speech/status`, `/api/ocr/status`, `/api/translator/status`

All AI keys are read server-side from `process.env` in `lib/ai/config.ts`, `lib/voice/voiceConfig.ts`, and related modules.
