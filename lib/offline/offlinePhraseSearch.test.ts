import { describe, expect, it } from "vitest";
import { inferMissingPhraseCategory } from "@/lib/offline/missingPhrasePackActions";
import type { OfflinePackEntry, OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import {
  normalizeOfflineSearchText,
  searchOfflinePackEntries,
} from "@/lib/offline/offlinePhraseSearch";

function buildTestPack(entries: OfflinePackEntry[]): OfflineStoredPack {
  return {
    id: "en__tl",
    pack_key: "en__tl",
    from_language_id: "en",
    to_language_id: "tl",
    pack_tier: "lite",
    version: "2.0.0",
    status: "downloaded",
    source: "ai_generated",
    phrase_count: entries.length,
    audio_count: 0,
    audio_coverage_percent: 0,
    text_coverage_percent: 100,
    estimated_size_bytes: 1024,
    downloaded_at: "2026-07-04T00:00:00.000Z",
    updated_at: "2026-07-04T00:00:00.000Z",
    from_display_name: "English",
    to_display_name: "Tagalog",
    entry_count: entries.length,
    entries,
    examples: [],
  };
}

describe("offline phrase search", () => {
  it("ignores punctuation in search queries", () => {
    const pack = buildTestPack([
      {
        id: "entry-1",
        pack_id: "en__tl",
        category: "directions",
        source_text: "How to go to Disneyland",
        translated_text: "Paano pumunta sa Disneyland",
        pronunciation_simple: "paa-no",
        confidence_score: 0.8,
        validation_status: "ai_generated",
        source: "ai_generated",
        audio_type: "unavailable",
        created_at: "2026-07-04T00:00:00.000Z",
        updated_at: "2026-07-04T00:00:00.000Z",
      },
    ]);

    expect(searchOfflinePackEntries(pack, "How to go to Disneyland?").length).toBe(1);
    expect(normalizeOfflineSearchText("Disneyland?")).toBe("disneyland");
  });

  it("finds user-added entries from partial queries", () => {
    const pack = buildTestPack([
      {
        id: "entry-1",
        pack_id: "en__tl",
        category: "directions",
        source_text: "How to go to Disneyland",
        translated_text: "Paano pumunta sa Disneyland",
        pronunciation_simple: "paa-no",
        confidence_score: 0.8,
        validation_status: "ai_generated",
        source: "ai_generated",
        audio_type: "unavailable",
        created_at: "2026-07-04T00:00:00.000Z",
        updated_at: "2026-07-04T00:00:00.000Z",
      },
    ]);

    expect(searchOfflinePackEntries(pack, "Disneyland").length).toBe(1);
  });
});

describe("missing phrase category inference", () => {
  it("classifies travel questions as directions", () => {
    expect(inferMissingPhraseCategory("How to go to Disneyland?")).toBe("directions");
  });
});
