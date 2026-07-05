# Offline local storage schema

Lexienn offline phrase packs use **IndexedDB** in the browser as the local-first store. The schema mirrors the planned SQLite layout for future native/mobile shells.

Database name: `lexienn_offline`  
Version: `1`

## Object stores

### `offline_packs` (key: `pack_key`)

Equivalent to SQLite table `offline_packs` plus embedded entries for fast reads.

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Stable pack id |
| from_language_id | string | Language selection value |
| to_language_id | string | Language selection value (may include dialect) |
| to_variant_label | string? | Display label for regional variant |
| pack_key | string | `{from}__{to}` |
| version | string | Pack version |
| status | enum | downloaded, update_available, generating, missing |
| source | enum | curated, ai_generated, template, unavailable |
| estimated_size_bytes | number | Pre-download estimate |
| downloaded_at | ISO datetime | First download |
| updated_at | ISO datetime | Last update |
| from_display_name | string | UI label |
| to_display_name | string | UI label |
| entry_count | number | Number of phrases |
| entries | array | Phrase entries (see below) |
| examples | array | Optional usage examples |

### `entries` (embedded in pack documents)

| Field | Type |
| --- | --- |
| id | string |
| pack_id | string |
| category | phrase category enum |
| source_text | string |
| translated_text | string |
| pronunciation_simple | string |
| literal_translation | string? |
| usage_note | string? |
| confidence_score | number |
| validation_status | enum |
| source | enum |
| audio_type | enum |
| voice_metadata | object? |
| audio_local_path | string? |
| created_at | ISO datetime |
| updated_at | ISO datetime |

### `recent_phrases` (key: `id`)

Tracks recently played offline phrases.

### `recent_pairs` (key: `pack_key`)

Tracks recently selected From → To pairs.

## Related SQLite tables (future native app)

The following tables are documented for parity but not yet separate IndexedDB stores in the web MVP:

- `languages`
- `examples`
- `favorites`
- `missing_requests`

## Local-first rules

1. Downloaded packs in IndexedDB are the source of truth after download.
2. Cloud `/api/offline-packs/generate` is optional and only used when online.
3. If cloud generation fails, existing local packs remain usable.
4. External hard drive export is platform-dependent and not guaranteed in browser/PWA builds.
