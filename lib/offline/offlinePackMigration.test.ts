import { describe, expect, it } from "vitest";
import {
  migrateOfflinePack,
  packContainsPrototypeWording,
  resolveOfflinePackStatus,
} from "@/lib/offline/offlinePackMigration";
import type { OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import {
  OFFLINE_PACK_CONTENT_VERSION,
  OFFLINE_PACK_SCHEMA_VERSION,
  OFFLINE_PACK_VERSION,
} from "@/lib/offline/offlinePackVersions";

function buildTestPack(overrides?: Partial<OfflineStoredPack>): OfflineStoredPack {
  const now = new Date().toISOString();
  return {
    id: "offline-pack:en__tl",
    pack_key: "en__tl",
    from_language_id: "en",
    to_language_id: "tl",
    pack_tier: "lite",
    schema_version: 1,
    content_version: 1,
    version: "1.0.0",
    status: "downloaded",
    source: "curated",
    phrase_count: 1,
    audio_count: 0,
    audio_coverage_percent: 0,
    text_coverage_percent: 100,
    estimated_size_bytes: 1024,
    downloaded_at: now,
    updated_at: now,
    from_display_name: "English",
    to_display_name: "Tagalog",
    entry_count: 1,
    entries: [
      {
        id: "en__tl:help",
        pack_id: "offline-pack:en__tl",
        category: "emergency",
        source_text: "I need help.",
        translated_text: "Tulungan niyo po ako. (MVP mock)",
        pronunciation_simple: "too-LOONG-an",
        confidence_score: 0.7,
        validation_status: "ai_generated",
        source: "ai_generated",
        audio_type: "unavailable",
        created_at: now,
        updated_at: now,
      },
    ],
    examples: [],
    ...overrides,
  };
}

describe("offlinePackMigration", () => {
  it("cleans prototype wording and marks pack current when migration succeeds", () => {
    const result = migrateOfflinePack(buildTestPack());

    expect(result.migrationApplied).toBe(true);
    expect(result.containsPrototypeWording).toBe(false);
    expect(result.stillOutdated).toBe(false);
    expect(result.pack.entries[0]?.translated_text).not.toMatch(/mvp mock/i);
    expect(result.pack.schema_version).toBe(OFFLINE_PACK_SCHEMA_VERSION);
    expect(result.pack.content_version).toBe(OFFLINE_PACK_CONTENT_VERSION);
    expect(result.pack.version).toBe(OFFLINE_PACK_VERSION);
    expect(resolveOfflinePackStatus(result.pack)).toBe("downloaded");
  });

  it("marks pack outdated when prototype wording cannot be cleaned safely", () => {
    const pack = buildTestPack({
      entries: [
        {
          ...buildTestPack().entries[0]!,
          translated_text: "MVP mock seed data for Admin Lite rule fallback",
        },
      ],
    });

    expect(packContainsPrototypeWording(pack)).toBe(true);
    const result = migrateOfflinePack(pack);
    expect(result.stillOutdated).toBe(true);
    expect(resolveOfflinePackStatus(result.pack)).toBe("update_available");
  });

  it("detects outdated packs by schema and content version", () => {
    const pack = buildTestPack({
      schema_version: 1,
      content_version: 1,
      version: "1.0.0",
      entries: [
        {
          ...buildTestPack().entries[0]!,
          translated_text: "Tulungan niyo po ako.",
        },
      ],
    });

    expect(resolveOfflinePackStatus(pack)).toBe("update_available");
  });
});
