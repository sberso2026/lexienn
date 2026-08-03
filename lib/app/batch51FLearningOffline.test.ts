import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  OFFLINE_RESOLUTION_ORDER,
  resolveConversationCapabilities,
  resolveLanguageCapabilities,
} from "@/lib/capabilities/contracts";
import { buildOfflineCapabilities } from "@/lib/offline/offlineCapabilities";
import { buildSmartPackPlan, SMART_PACK_THEMES } from "@/lib/offline/smartPackBuilder";
import {
  applyReviewGrade,
  buildReviewQueue,
  getLearningProgressStats,
  loadReviewItemRecords,
  registerLearningItem,
} from "@/lib/storage/vocabularyReviewStorage";

describe("Batch 51F learning and offline hardening", () => {
  it("exposes capability contracts and feature flags", () => {
    expect(existsSync(join(process.cwd(), "lib/capabilities/contracts.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib/config/featureFlags.ts"))).toBe(true);
    const flags = readFileSync(join(process.cwd(), "lib/config/featureFlags.ts"), "utf8");
    expect(flags).toContain("isAdvancedLearningEnabled");
    expect(flags).toContain("isSmartOfflinePackEnabled");
    expect(flags).toContain("isConversationEnabled");
    expect(OFFLINE_RESOLUTION_ORDER[0]).toContain("exact curated");
    expect(resolveConversationCapabilities().conversationMode).toBe("available");
    const mi = resolveLanguageCapabilities("mi");
    expect(mi.offlinePack).toBe("unavailable");
  });

  it("tracks spaced review grades and progress stats", () => {
    const storage = readFileSync(
      join(process.cwd(), "lib/storage/vocabularyReviewStorage.ts"),
      "utf8",
    );
    expect(storage).toContain('case "again"');
    expect(storage).toContain('case "hard"');
    expect(storage).toContain('case "good"');
    expect(storage).toContain('case "easy"');
    expect(storage).toContain("nextReviewAt");
    expect(storage).toContain("firstSeenAt");
    expect(storage).toContain("correctCount");
    expect(storage).toContain("incorrectCount");
    expect(storage).toContain("getLearningProgressStats");
    expect(typeof applyReviewGrade).toBe("function");
    expect(typeof registerLearningItem).toBe("function");
    expect(typeof buildReviewQueue).toBe("function");
    expect(typeof getLearningProgressStats).toBe("function");
    expect(typeof loadReviewItemRecords).toBe("function");
  });

  it("Library learning UI includes queues and practice modes", () => {
    const card = readFileSync(
      join(process.cwd(), "components/library/VocabularyReviewCard.tsx"),
      "utf8",
    );
    expect(card).toContain("Recently learned");
    expect(card).toContain("Difficult");
    expect(card).toContain("Favorites");
    expect(card).toContain("choose_translation");
    expect(card).toContain("listen_type");
    expect(card).toContain("read_speak");
  });

  it("Smart Pack builder covers required themes and honest capabilities", () => {
    expect(SMART_PACK_THEMES.map((theme) => theme.id)).toEqual(
      expect.arrayContaining([
        "travel",
        "emergency",
        "engineering",
        "healthcare",
        "business",
        "daily",
        "personal_vocabulary",
      ]),
    );
    const plan = buildSmartPackPlan({
      fromLanguageId: "en",
      toLanguageId: "mi",
      themeId: "travel",
      packTier: "lite",
    });
    expect(plan.estimatedBytes).toBeGreaterThan(0);
    expect(plan.unavailableCapabilities.join(" ")).toMatch(/OCR|offline AI/i);
    const caps = buildOfflineCapabilities({ languageId: "mi" });
    expect(caps.offlineOcrPack).toBe("unavailable");
    expect(caps.honestLimitations.length).toBeGreaterThan(0);

    const offlineView = readFileSync(
      join(process.cwd(), "components/offline/OfflineView.tsx"),
      "utf8",
    );
    expect(offlineView).toContain("SmartPackBuilder");
    expect(existsSync(join(process.cwd(), "components/offline/SmartPackBuilder.tsx"))).toBe(
      true,
    );
  });

  it("save paths tag learning sources", () => {
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TextTranslatorView.tsx"),
      "utf8",
    );
    const camera = readFileSync(
      join(process.cwd(), "components/translator/CameraTranslationResultCard.tsx"),
      "utf8",
    );
    const conversation = readFileSync(
      join(process.cwd(), "components/conversation/ConversationView.tsx"),
      "utf8",
    );
    const tap = readFileSync(
      join(process.cwd(), "components/lens/TapToDefineSheet.tsx"),
      "utf8",
    );
    expect(translator).toContain('source: "translate"');
    expect(camera).toContain('source: "lens"');
    expect(conversation).toContain('source: "conversation"');
    expect(tap).toContain('source: "lens"');
  });
});
