import { describe, expect, it, beforeEach } from "vitest";
import {
  buildOfflineEntryAudioKey,
  clearOfflineAudioCacheForTests,
  getOfflineEntryAudio,
  saveOfflineEntryAudio,
} from "@/lib/offline/offlineAudioCache";

describe("offline entry audio cache", () => {
  beforeEach(() => {
    clearOfflineAudioCacheForTests();
  });

  it("stores and retrieves cached phrase audio by pack entry key", async () => {
    await saveOfflineEntryAudio({
      pack_key: "en__zh",
      entry_id: "offline-pack:en__zh:emergency-help",
      audio_base64: "abc123",
      audio_mime_type: "audio/mpeg",
    });

    const cacheKey = buildOfflineEntryAudioKey(
      "en__zh",
      "offline-pack:en__zh:emergency-help",
    );
    const cached = await getOfflineEntryAudio(cacheKey);

    expect(cached?.audio_base64).toBe("abc123");
    expect(cached?.audio_mime_type).toBe("audio/mpeg");
  });
});
