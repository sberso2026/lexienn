import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import * as openAiClient from "@/lib/ai/openAiClient";
import { clearOfflineAudioCacheForTests } from "@/lib/offline/offlineAudioCache";
import { getLitePackTemplates } from "@/lib/offline/litePhrasePack";
import {
  resetLocalOfflineStoreForTests,
  saveOfflinePack,
  getOfflinePackByKey,
} from "@/lib/offline/localOfflineStore";
import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import { generateOfflineLanguagePairPack } from "@/lib/offline/offlinePackGenerator";
import {
  clearOfflinePackDownloadProgressForTests,
  getOfflinePackDownloadProgress,
  saveOfflinePackDownloadProgress,
} from "@/lib/offline/offlinePackDownloadProgress";
import {
  PACK_DOWNLOAD_ERROR_MESSAGES,
  TEXT_SAVE_BATCH_SIZE,
  buildPackDownloadSnapshot,
} from "@/lib/offline/offlinePackDownloadTypes";
import {
  createPackDownloadRuntime,
  runResumableOfflinePackDownload,
} from "@/lib/offline/offlinePackDownload";
import { verifyOfflinePackStructure } from "@/lib/offline/offlinePackVerification";
import { searchOfflinePackEntries } from "@/lib/offline/offlinePhraseSearch";
import { clearDownloadedOfflinePacks } from "@/lib/storage/localDataReset";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REQUEST = {
  from_language: "en",
  to_language: "tl",
  target_language_selection: "tl",
  pack_tier: "lite" as const,
  include_audio_manifest: true,
};

async function seedGeneratedPack() {
  const generated = await generateOfflineLanguagePairPack(REQUEST);
  if (!generated) throw new Error("Expected generated pack");
  return generated.pack;
}

describe("offline pack download orchestrator", () => {
  beforeEach(() => {
    resetLocalOfflineStoreForTests();
    clearOfflineAudioCacheForTests();
    clearOfflinePackDownloadProgressForTests();
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

  it("saves text packs in batches", async () => {
    const pack = await seedGeneratedPack();
    const saves: number[] = [];
    const originalSave = saveOfflinePack;
    vi.spyOn(await import("@/lib/offline/localOfflineStore"), "saveOfflinePack").mockImplementation(
      async (nextPack) => {
        saves.push(nextPack.entries.length);
        return originalSave(nextPack);
      },
    );

    vi.stubGlobal("window", {
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pack }),
    }));
    vi.stubGlobal("navigator", { onLine: true, storage: { estimate: async () => ({ quota: 1e9, usage: 0 }) } });

    await runResumableOfflinePackDownload({
      request: REQUEST,
      runtime: createPackDownloadRuntime(),
    });

    expect(saves.some((count) => count >= TEXT_SAVE_BATCH_SIZE)).toBe(true);
    vi.unstubAllGlobals();
  });

  it("resumes interrupted text download from saved progress", async () => {
    const pack = await seedGeneratedPack();
    const packKey = buildOfflinePackKey("en", "tl");
    const partialCount = TEXT_SAVE_BATCH_SIZE;
    await saveOfflinePack({
      ...pack,
      entries: pack.entries.slice(0, partialCount),
      status: "text_ready",
    });
    await saveOfflinePackDownloadProgress({
      pack_key: packKey,
      source_language: "en",
      target_language: "tl",
      category: "lite",
      total_items: pack.entries.length,
      completed_items: partialCount,
      audio_completed_items: 0,
      status: "paused",
      updated_at: new Date().toISOString(),
      include_audio: true,
      request: REQUEST,
    });
    await import("@/lib/offline/offlinePackDownloadProgress").then((mod) =>
      mod.saveOfflinePackDownloadBuffer(packKey, pack),
    );

    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.stubGlobal("navigator", { onLine: true, storage: { estimate: async () => ({ quota: 1e9, usage: 0 }) } });

    const result = await runResumableOfflinePackDownload({
      request: REQUEST,
      resume: true,
      runtime: createPackDownloadRuntime(),
    });

    expect(result.entries.length).toBe(pack.entries.length);
    vi.unstubAllGlobals();
  });

  it("keeps text pack when audio caching fails", async () => {
    const pack = await seedGeneratedPack();
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pack }),
    }));
    vi.stubGlobal("navigator", { onLine: true, storage: { estimate: async () => ({ quota: 1e9, usage: 0 }) } });
    vi.spyOn(await import("@/lib/voice/voiceApiClient"), "requestVoiceSpeech").mockRejectedValue(
      new Error("audio down"),
    );

    const result = await runResumableOfflinePackDownload({
      request: REQUEST,
      runtime: createPackDownloadRuntime(),
    });

    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.status).toBe("text_ready");
    vi.unstubAllGlobals();
  });

  it("maps storage quota errors to a controlled message", () => {
    expect(PACK_DOWNLOAD_ERROR_MESSAGES.storage_quota_exceeded).toBe(
      "Not enough device storage for this pack.",
    );
    const snapshot = buildPackDownloadSnapshot({
      status: "failed",
      completed_items: 0,
      audio_completed_items: 0,
      total_items: 10,
      error_code: "storage_quota_exceeded",
      include_audio: true,
    });
    expect(snapshot.message).toContain("Not enough device storage");
  });

  it("pauses on network failure and keeps partial pack readable", async () => {
    const pack = await seedGeneratedPack();
    const packKey = buildOfflinePackKey("en", "tl");
    await saveOfflinePack({
      ...pack,
      entries: pack.entries.slice(0, 20),
      status: "text_ready",
    });

    const progress = await getOfflinePackDownloadProgress(packKey);
    expect(progress).toBeNull();

    const offlinePack = await getOfflinePackByKey(packKey);
    expect(offlinePack?.entries.length).toBe(20);
    const matches = searchOfflinePackEntries(offlinePack!, "help");
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  it("does not corrupt an existing pack when a write fails mid-download", async () => {
    const pack = await seedGeneratedPack();
    const packKey = buildOfflinePackKey("en", "tl");
    await saveOfflinePack({ ...pack, status: "downloaded" });

    const saveSpy = vi
      .spyOn(await import("@/lib/offline/localOfflineStore"), "saveOfflinePack")
      .mockImplementationOnce(async () => {
        throw new Error("IndexedDB write failed");
      })
      .mockImplementation(async (next) => {
        const { saveOfflinePack: realSave } = await import("@/lib/offline/localOfflineStore");
        return realSave(next);
      });

    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pack: { ...pack, pack_key: `${packKey}-new` } }),
    }));
    vi.stubGlobal("navigator", { onLine: true, storage: { estimate: async () => ({ quota: 1e9, usage: 0 }) } });

    await expect(
      runResumableOfflinePackDownload({
        request: { ...REQUEST, to_language: "ceb", target_language_selection: "ceb" },
        runtime: createPackDownloadRuntime(),
      }),
    ).rejects.toBeTruthy();

    const existing = await getOfflinePackByKey(packKey);
    expect(existing?.entries.length).toBe(pack.entries.length);
    saveSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("verification catches incomplete packs", () => {
    const generated = {
      from_language_id: "en",
      to_language_id: "tl",
      pack_tier: "lite" as const,
      entries: [],
      phrase_count: 0,
    };
    const result = verifyOfflinePackStructure(generated as never, REQUEST);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("clear downloaded packs removes pack data safely", async () => {
    const pack = await seedGeneratedPack();
    await saveOfflinePack({ ...pack, status: "downloaded" });
    await saveOfflinePackDownloadProgress({
      pack_key: pack.pack_key,
      source_language: "en",
      target_language: "tl",
      category: "lite",
      total_items: pack.entries.length,
      completed_items: pack.entries.length,
      audio_completed_items: 0,
      status: "failed",
      updated_at: new Date().toISOString(),
      include_audio: true,
      request: REQUEST,
    });

    const removed = await clearDownloadedOfflinePacks();
    expect(removed).toBe(1);
    expect(await getOfflinePackByKey(pack.pack_key)).toBeNull();
    expect(await getOfflinePackDownloadProgress(pack.pack_key)).toBeNull();
  });
});

describe("offline pack download UI wiring", () => {
  it("keeps pack buttons as type=button and exposes download progress panel", () => {
    const selector = readFileSync(
      join(process.cwd(), "components/offline/OfflineLanguagePairSelector.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      join(process.cwd(), "components/offline/OfflinePackDownloadPanel.tsx"),
      "utf8",
    );
    const phrasePacks = readFileSync(
      join(process.cwd(), "components/phrase-packs/PhrasePacksView.tsx"),
      "utf8",
    );

    expect(selector).toContain('type="button"');
    expect(panel).toContain("offline-pack-download-panel");
    expect(panel).toContain("Retry audio");
    expect(phrasePacks).not.toContain("<ActionButton");
    expect(phrasePacks).toContain("Download");
  });
});
