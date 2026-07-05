import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import * as openAiClient from "@/lib/ai/openAiClient";
import { getLitePackTemplates } from "@/lib/offline/litePhrasePack";
import { LITE_PACK_MIN_PHRASES } from "@/lib/offline/litePhrasePack";
import {
  addOfflineFavorite,
  isOfflineFavorite,
  listOfflineMissingRequests,
  resetLocalOfflineStoreForTests,
  saveOfflineMissingRequest,
  saveOfflinePack,
} from "@/lib/offline/localOfflineStore";
import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import {
  canGenerateOfflinePackWithoutAi,
  generateOfflineLanguagePairPack,
} from "@/lib/offline/offlinePackGenerator";
import {
  addMissingPhraseToOfflinePack,
  buildPackAvailabilityMessage,
  downloadOfflineLanguagePairPack,
  generateMissingPhraseOnline,
  getMissingPhraseTranslation,
  inspectOfflinePackAvailability,
  removeOfflineLanguagePairPack,
  toggleOfflineFavorite,
} from "@/lib/offline/offlinePackService";
import { searchOfflinePackEntries } from "@/lib/offline/offlinePhraseSearch";
import * as translatorApiClient from "@/lib/translator/translatorApiClient";
import {
  getOfflineDefaultLanguages,
  hasSavedUserPreferences,
  USER_PREFERENCES_STORAGE_KEY,
} from "@/lib/settings/userPreferences";
import { clearOfflineAudioCacheForTests } from "@/lib/offline/offlineAudioCache";
import { getOfflinePackStoreKind } from "@/lib/offline/getOfflinePackStore";
import { sqliteOfflinePackStore } from "@/lib/offline/sqliteOfflinePackStore";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("offline pack key", () => {
  it("builds stable keys for any language pair", () => {
    expect(buildOfflinePackKey("es", "vi")).toBe("es__vi");
    expect(buildOfflinePackKey("de", "lo")).toBe("de__lo");
    expect(buildOfflinePackKey("en", "ceb::dialect-ceb-cebu")).toBe(
      "en__ceb::dialect-ceb-cebu",
    );
  });
});

describe("offline pack generation", () => {
  it("requires AI for full lite packs even when curated phrases exist", async () => {
    expect(
      canGenerateOfflinePackWithoutAi({
        from_language: "en",
        to_language: "tl::dialect-tl-manila",
      }),
    ).toBe(true);

    const result = await generateOfflineLanguagePairPack({
      from_language: "en",
      to_language: "tl::dialect-tl-manila",
      target_language_selection: "tl::dialect-tl-manila",
      pack_tier: "lite",
    });

    expect(result).toBeNull();
  });

  it("reports unavailable without AI for unsupported pairs", async () => {
    expect(
      canGenerateOfflinePackWithoutAi({
        from_language: "es",
        to_language: "vi",
      }),
    ).toBe(false);
  });

  it("generates Tagalog to Vietnamese packs using Philippine sources and AI", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    vi.spyOn(openAiClient, "requestOpenAiChatCompletion").mockResolvedValue(
      JSON.stringify({
        translations: getLitePackTemplates().map((template) => ({
          id: template.id,
          translated_text: `VI ${template.source_text}`,
          pronunciation_simple: `vee ${template.source_text}`,
          validation_status: "ai_generated",
          confidence_score: 0.7,
        })),
      }),
    );

    const result = await generateOfflineLanguagePairPack({
      from_language: "tl",
      to_language: "vi",
      user_context: "traveller",
    });

    expect(result).not.toBeNull();
    expect(result?.pack.pack_key).toBe("tl__vi");
    expect(result?.pack.source).toBe("ai_generated");
    expect(result?.pack.entries.length).toBeGreaterThanOrEqual(LITE_PACK_MIN_PHRASES);
    expect(result?.pack.entries[0]?.source_text.toLowerCase()).toContain("tulungan");

    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("generates English to Chinese packs in batched AI translation calls", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi.spyOn(openAiClient, "requestOpenAiChatCompletion").mockResolvedValue(
      JSON.stringify({
        translations: getLitePackTemplates().map((template) => ({
          id: template.id,
          translated_text: `中文 ${template.source_text}`,
          pronunciation_simple: `zhong wen ${template.source_text}`,
          validation_status: "ai_generated",
          confidence_score: 0.7,
        })),
      }),
    );

    const result = await generateOfflineLanguagePairPack({
      from_language: "en",
      to_language: "zh",
      user_context: "traveller",
    });

    expect(result).not.toBeNull();
    expect(result?.pack.pack_key).toBe("en__zh");
    expect(result?.pack.source).toBe("ai_generated");
    expect(result?.pack.entries.length).toBeGreaterThanOrEqual(LITE_PACK_MIN_PHRASES);
    expect(aiSpy.mock.calls.length).toBeGreaterThan(1);

    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
});

describe("offline local store and service", () => {
  beforeEach(() => {
    resetLocalOfflineStoreForTests();
    clearOfflineAudioCacheForTests();
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.spyOn(openAiClient, "requestOpenAiChatCompletion").mockResolvedValue(
      JSON.stringify({
        translations: getLitePackTemplates().map((template) => ({
          id: template.id,
          translated_text: `TL ${template.source_text}`,
          pronunciation_simple: `tee-el ${template.source_text}`,
          validation_status: "ai_generated",
          confidence_score: 0.7,
        })),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("persists downloaded packs locally", async () => {
    const pack = await downloadOfflineLanguagePairPack({
      from_language: "en",
      to_language: "tl",
      target_language_selection: "tl",
      pack_tier: "lite",
      include_audio_manifest: true,
    });

    const availability = await inspectOfflinePackAvailability("en", "tl");
    expect(availability.status).toBe("downloaded");
    expect(availability.pack?.pack_key).toBe(pack.pack_key);
  });

  it("searches downloaded pack phrases", async () => {
    const generated = await generateOfflineLanguagePairPack({
      from_language: "en",
      to_language: "tl",
      target_language_selection: "tl",
      pack_tier: "lite",
      include_audio_manifest: true,
    });
    expect(generated).not.toBeNull();
    if (!generated) return;

    await saveOfflinePack(generated.pack);
    const matches = searchOfflinePackEntries(generated.pack, "doctor");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("removes downloaded packs", async () => {
    const pack = await downloadOfflineLanguagePairPack({
      from_language: "en",
      to_language: "ceb",
      target_language_selection: "ceb",
      pack_tier: "lite",
      include_audio_manifest: true,
    });

    await removeOfflineLanguagePairPack(pack.pack_key);
    const availability = await inspectOfflinePackAvailability("en", "ceb");
    expect(availability.status).toBe("missing");
  });

  it("saves favorites locally", async () => {
    await addOfflineFavorite("entry-1", "en__tl");
    expect(await isOfflineFavorite("entry-1")).toBe(true);
    expect(await toggleOfflineFavorite("entry-1", "en__tl")).toBe(false);
  });

  it("saves missing requests locally", async () => {
    await saveOfflineMissingRequest({
      from_language_id: "en",
      to_language_id: "tl",
      pack_key: "en__tl",
      requested_text: "Where is the clinic?",
      user_context: "traveller",
    });
    const requests = await listOfflineMissingRequests("en__tl");
    expect(requests.length).toBe(1);
    expect(requests[0]?.status).toBe("saved_locally");
  });

  it("uses memory store in tests", () => {
    expect(getOfflinePackStoreKind()).toBe("memory");
  });

  it("persists generated missing phrase translations locally", async () => {
    const saved = await saveOfflineMissingRequest({
      from_language_id: "en",
      to_language_id: "tl",
      pack_key: "en__tl",
      requested_text: "Where is the pharmacy?",
      user_context: "traveller",
    });

    vi.spyOn(translatorApiClient, "translateSentenceViaApi").mockResolvedValue({
      original_text: saved.requested_text,
      translated_text: "Nasaan ang botika?",
      source_language: "en",
      target_language: "tl",
      natural_translation: "Nasaan ang botika?",
      pronunciation_simple: "na-sa-an ang bo-ti-ka",
      usage_note: "Use in towns and cities.",
      confidence_score: 0.82,
      validation_status: "ai_generated",
      source: "ai",
      reliability_label: "AI generated",
    });

    await generateMissingPhraseOnline(saved);
    const requests = await listOfflineMissingRequests("en__tl");
    expect(requests[0]?.translated_text).toBe("Nasaan ang botika?");
    expect(requests[0]?.status).toBe("synced");
    expect(getMissingPhraseTranslation(requests[0]!)).toMatchObject({
      translated_text: "Nasaan ang botika?",
    });
  });

  it("adds generated missing phrases to the offline pack", async () => {
    const saved = await saveOfflineMissingRequest({
      from_language_id: "en",
      to_language_id: "tl",
      pack_key: "en__tl",
      requested_text: "Where is the pharmacy?",
      user_context: "traveller",
    });

    vi.spyOn(translatorApiClient, "translateSentenceViaApi").mockResolvedValue({
      original_text: saved.requested_text,
      translated_text: "Nasaan ang botika?",
      source_language: "en",
      target_language: "tl",
      natural_translation: "Nasaan ang botika?",
      pronunciation_simple: "na-sa-an ang bo-ti-ka",
      confidence_score: 0.82,
      validation_status: "ai_generated",
      source: "ai",
      reliability_label: "AI generated",
    });

    const generated = await generateMissingPhraseOnline(saved);
    expect(generated.translated_text).toBe("Nasaan ang botika?");

    const pack = await addMissingPhraseToOfflinePack(
      (await listOfflineMissingRequests("en__tl"))[0]!,
    );
    expect(pack.entries.some((entry) => entry.source_text === saved.requested_text)).toBe(true);
    expect(pack.entries[0]?.category).toBe("directions");

    const updatedRequests = await listOfflineMissingRequests("en__tl");
    expect(updatedRequests[0]?.pack_entry_id).toBeTruthy();

    const matches = searchOfflinePackEntries(pack, "pharmacy");
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe("offline availability messaging", () => {
  it("returns curated messaging for English to Tagalog", async () => {
    const availability = await inspectOfflinePackAvailability("en", "tl");
    expect(availability.availabilityMessage).toContain("Curated pack available.");
  });

  it("returns missing-pair messaging when no languages selected", async () => {
    const availability = await inspectOfflinePackAvailability("", "");
    expect(availability.pairSelected).toBe(false);
    expect(availability.availabilityMessage).toContain("Select a From and To");
  });

  it("returns unavailable messaging for unsupported pairs when offline", () => {
    expect(
      buildPackAvailabilityMessage(
        {
          pairSelected: true,
          canGenerate: false,
          canGenerateWithoutAi: false,
          status: "missing",
        },
        false,
      ),
    ).toContain("No offline pack downloaded");
  });
});

describe("offline settings defaults", () => {
  it("does not treat built-in defaults as saved settings", () => {
    expect(hasSavedUserPreferences()).toBe(false);
    expect(getOfflineDefaultLanguages()).toBeNull();
  });

  it("returns saved settings defaults when preferences exist", () => {
    const storage = {
      getItem: (key: string) =>
        key === USER_PREFERENCES_STORAGE_KEY
          ? JSON.stringify({
              default_source_language: "de",
              default_target_language: "lo",
            })
          : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("window", { localStorage: storage });
    expect(hasSavedUserPreferences()).toBe(true);
    expect(getOfflineDefaultLanguages()).toEqual({ from: "de", to: "lo" });
    vi.unstubAllGlobals();
  });
});

describe("offline storage abstraction", () => {
  it("documents sqlite stub without implementing native runtime", async () => {
    await expect(sqliteOfflinePackStore.savePack({} as never)).rejects.toThrow(
      /not implemented/i,
    );
  });
});

describe("offline UI layout", () => {
  it("does not hardcode English → Spanish or Filipino / Tagalog defaults", () => {
    const offlineView = readFileSync(
      join(process.cwd(), "components/offline/OfflineView.tsx"),
      "utf8",
    );
    expect(offlineView).not.toContain('const DEFAULT_FROM = "en"');
    expect(offlineView).not.toContain('const DEFAULT_TO = "es"');
    expect(offlineView).not.toContain("pack-tl-manila-remote");
    expect(offlineView).toContain("getOfflineDefaultLanguages");
    expect(offlineView).toContain('useState("")');
  });

  it("does not show legacy bundled pack UI on phrase packs page", () => {
    const phrasePacks = readFileSync(
      join(process.cwd(), "components/phrase-packs/PhrasePacksView.tsx"),
      "utf8",
    );
    expect(phrasePacks).toContain("PackSection");
    expect(phrasePacks).toContain("Downloaded");
    expect(phrasePacks).not.toContain("PhrasePackCard");
    expect(phrasePacks).not.toContain("markPackDownloaded");
  });

  it("documents sqlite schema", () => {
    const schemaDoc = readFileSync(
      join(process.cwd(), "docs/offline-sqlite-schema.md"),
      "utf8",
    );
    expect(schemaDoc).toContain("entries");
    expect(schemaDoc).toContain("favorites");
    expect(schemaDoc).toContain("missing_requests");
  });
});
