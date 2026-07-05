# Offline-first architecture

Lexienn Offline Mode follows a **local-first** design for text + audio phrase packs.

## Source of truth

After a pack is downloaded, the **local store** (IndexedDB in web/PWA) is the source of truth. Phrase cards, search, favorites, missing-request logs, and cached audio blobs read from local data first.

## Cloud role (optional)

Cloud/API is used only when online for:

- **Generate / download** text for a language-pair pack (`POST /api/offline-packs/generate`)
- **Generate / cache** AI voice audio for target phrases (client-side after text save)
- **Update** an existing pack when a newer version is available
- **Sync** missing requests (placeholder — not fully implemented)

API keys stay on the server. The browser never receives provider secrets.

## Decision flow

```
User selects From + To
  → inspect local pack store by pack_key
  → if pack exists: load local text + local audio
  → if pack missing and online: generate/download text, then cache audio
  → if pack missing and offline: show missing-pack message
  → if cloud update fails: keep existing local pack usable
  → if AI disabled: do not generate fake packs
```

## Two-phase download (web)

1. **Text pack** saved locally with status `text_ready`
2. **Audio cache** runs while online; pack moves to `downloaded` when audio assets are stored

If audio generation is slow or fails, text and pronunciation remain usable. Device TTS is playback fallback only.

## Offline playback priority

1. Local native recorded audio
2. Local AI-generated audio (IndexedDB blob)
3. Device TTS fallback
4. Text + pronunciation only

Cloud voice API is never called while offline.

## Pack tiers

| Tier | Target phrases | Batch 27 |
| --- | --- | --- |
| Lite | 150 | Fully generated |
| Standard | 800 | Schema + generator hooks |
| Professional | 2,000 | Schema only |

## Storage implementations

| Runtime | Store | Status |
| --- | --- | --- |
| Web / PWA packs | `IndexedDbOfflinePackStore` | Implemented |
| Web / PWA audio | `offlineAudioCache` | Implemented |
| Unit tests | `MemoryOfflinePackStore` | Implemented |
| Native mobile | `SqliteOfflinePackStore` | Stub only — see `docs/offline-sqlite-schema.md` |

External hard drive export is platform-dependent and not guaranteed in browser/PWA builds.

## Language pair defaults

Offline Mode does **not** hardcode a default pair (for example English → Spanish or Filipino / Tagalog).

- If the user saved Settings defaults, Offline uses those languages.
- Otherwise From/To start unselected until the user chooses a pair.
- All catalog languages expose `supports_offline_pack` and `supports_voice` metadata.
