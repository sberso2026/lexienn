# Offline SQLite schema (native mobile target)

Lexienn documents this schema for future native mobile shells. The web/PWA runtime uses **IndexedDB** via `IndexedDbOfflinePackStore` and `offlineAudioCache`. Native SQLite is **not implemented** in the browser build.

See also:

- `docs/offline-local-schema.md` — IndexedDB mapping used today
- `docs/offline-first-architecture.md` — local-first rules

## Tables

### `languages`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Language selection value |
| display_name | TEXT | UI label |
| native_name | TEXT | Native script/name |
| iso_639_code | TEXT | ISO code |
| locale_tag | TEXT | BCP-47 tag |
| region_group | TEXT | Catalog group |
| supports_translation | INTEGER | 0/1 |
| supports_voice | INTEGER | 0/1 |
| supports_offline_pack | INTEGER | 0/1 |
| supports_ocr | INTEGER | 0/1 |
| supports_speech_input | INTEGER | 0/1 |

### `offline_packs`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Stable pack id |
| from_language_id | TEXT | Source selection |
| to_language_id | TEXT | Target selection |
| to_variant_label | TEXT NULL | Regional label |
| pack_key | TEXT UNIQUE | `{from}__{to}` |
| pack_tier | TEXT | lite, standard, professional |
| version | TEXT | Semantic pack release (e.g. 2.0.0) |
| schema_version | INTEGER | IndexedDB record shape version (current: 2) |
| content_version | INTEGER | Seed phrase content version (current: 2) |
| generated_by_app_version | TEXT NULL | App build that created the pack |
| status | TEXT | missing, downloaded, update_available, generating, text_ready, audio_downloading |
| source | TEXT | curated, ai_generated, template, unavailable |
| phrase_count | INTEGER | Stored phrase count |
| audio_count | INTEGER | Entries with local playable audio |
| audio_coverage_percent | REAL | 0–100 |
| text_coverage_percent | REAL | 0–100 vs tier target |
| estimated_size_bytes | INTEGER | Pre-download estimate |
| downloaded_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

### `entries`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Entry id |
| pack_id | TEXT | FK → offline_packs.id |
| category | TEXT | Phrase category enum |
| source_text | TEXT | From-language phrase |
| translated_text | TEXT | To-language phrase |
| pronunciation_simple | TEXT | Sound-out guide |
| literal_translation | TEXT NULL | Optional literal gloss |
| usage_note | TEXT NULL | Register / notes |
| confidence_score | REAL | 0.0–1.0 |
| validation_status | TEXT | Validation enum |
| source | TEXT | curated / ai_generated / template / unavailable |
| phrase_template_id | TEXT NULL | Template id when expanded |
| audio_type | TEXT | native_recorded, ai_generated, device_tts_fallback, unavailable |
| audio_local_path | TEXT NULL | On-device audio path |
| audio_blob_key | TEXT NULL | IndexedDB / blob key |
| audio_hash | TEXT NULL | Content hash |
| audio_duration_ms | INTEGER NULL | Duration |
| voice_locale | TEXT NULL | BCP-47 voice locale |
| voice_style | TEXT NULL | e.g. local_conversational |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

### `examples`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Example id |
| entry_id | TEXT | FK → entries.id |
| source_example | TEXT | Source sentence |
| translated_example | TEXT | Target sentence |
| context_label | TEXT NULL | Optional label |

### `audio_assets`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | `{pack_key}::{entry_id}` |
| entry_id | TEXT | FK → entries.id |
| audio_type | TEXT | native_recorded, ai_generated, device_tts_fallback, unavailable |
| voice_locale | TEXT NULL | BCP-47 tag |
| voice_style | TEXT NULL | Voice style label |
| audio_local_path | TEXT NULL | Native file path |
| audio_blob_key | TEXT | Local blob key |
| audio_hash | TEXT NULL | SHA-like hash |
| duration_ms | INTEGER NULL | Playback duration |
| provider | TEXT NULL | openai / native / device |
| created_at | TEXT | ISO datetime |

### `favorites`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | `{pack_key}:{entry_id}` |
| entry_id | TEXT | FK → entries.id |
| created_at | TEXT | ISO datetime |

### `missing_requests`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Request id |
| from_language_id | TEXT | Source selection |
| to_language_id | TEXT | Target selection |
| requested_text | TEXT | User search or OCR text |
| user_context | TEXT | Context label |
| request_type | TEXT | search, ocr, camera |
| status | TEXT | saved_locally, pending_sync, synced |
| created_at | TEXT | ISO datetime |
| synced_at | TEXT NULL | Cloud sync timestamp |

### `ocr_sessions`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Session id |
| from_language_id | TEXT | Source selection or auto-detect result |
| to_language_id | TEXT | Target selection |
| image_hash | TEXT NULL | Hash of processed image (not stored by default in web) |
| extracted_text | TEXT | Raw OCR output |
| corrected_text | TEXT NULL | User-edited text |
| detected_language | TEXT NULL | OCR language guess |
| confidence_score | REAL | 0.0–1.0 |
| status | TEXT | extracted, corrected, translated, saved_locally |
| created_at | TEXT | ISO datetime |
| synced_at | TEXT NULL | Optional cloud sync timestamp |

### `ocr_blocks`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Block id |
| ocr_session_id | TEXT | FK → ocr_sessions.id |
| text | TEXT | Block text |
| bounding_box_json | TEXT NULL | Optional layout JSON |
| confidence_score | REAL NULL | Block confidence |
| reading_order | INTEGER NULL | Reading sequence |

Web/PWA note: OCR sessions and blocks are documented for native SQLite targets. The current browser build processes images in memory and does not persist OCR sessions unless the user explicitly saves translated phrases to offline packs.

### `speech_input_sessions`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Session id |
| input_target | TEXT | dictionary, translator |
| language_hint | TEXT | Requested language hint |
| detected_language | TEXT NULL | Detected or inferred language |
| transcript | TEXT | Final transcript text |
| confidence_score | REAL | 0.0–1.0 |
| source | TEXT | browser_speech, cloud_speech, unavailable |
| status | TEXT | completed, failed, cancelled |
| error_code | TEXT NULL | Machine-readable error |
| created_at | TEXT | ISO datetime |

### `speech_input_errors`

| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PRIMARY KEY | Error id |
| session_id | TEXT | FK → speech_input_sessions.id |
| error_code | TEXT | e.g. permission_denied, unsupported |
| error_message | TEXT | User-facing message |
| created_at | TEXT | ISO datetime |

Web/PWA note: Speech input sessions and errors are documented for native SQLite targets. The browser build transcribes in memory and does not persist raw audio or sessions unless the user explicitly saves a phrase for later via missing_requests.

## Adapter contract

Implement `OfflinePackStore` from `lib/offline/offlinePackStore.ts`:

- `IndexedDbOfflinePackStore` — web/PWA pack metadata + entries (implemented)
- `offlineAudioCache` — web/PWA audio blobs keyed by `audio_blob_key` (implemented)
- `MemoryOfflinePackStore` — unit tests (implemented)
- `SqliteOfflinePackStore` — native mobile stub only (not implemented in web)

Do not claim native SQLite support unless the runtime uses `SqliteOfflinePackStore` with a real driver.

## Pack tiers

| Tier | Minimum phrases | Batch 27 status |
| --- | --- | --- |
| Lite | 150 | Fully generated |
| Standard | 800 | Schema + generator hooks |
| Professional | 2,000 | Schema only |
