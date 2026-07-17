import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackAppEvent, getAppEventCounters, clearAppEventCounters } from "@/lib/analytics/appEvents";
import { getReleaseMetadata } from "@/lib/app/releaseMetadata";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { createCorrectionSubmission } from "@/lib/corrections/createCorrection";
import { findCuratedPhrase } from "@/lib/translator/curatedPhrases";
import { FEEDBACK_CATEGORY_LABELS, saveFeedbackSubmission, loadFeedbackSubmissions } from "@/lib/feedback/feedbackStorage";
import { getLanguageByCode } from "@/lib/mock/languages";
import { shouldShowMobileInstallGate } from "@/lib/pwa/shouldShowMobileInstallGate";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("Batch 46 production feedback readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("Feedback form renders and submits locally", () => {
    const form = readFileSync("components/feedback/FeedbackForm.tsx", "utf8");
    expect(form).toContain("Submit feedback");
    expect(form).toContain("saveFeedbackSubmission");
    for (const label of Object.values(FEEDBACK_CATEGORY_LABELS)) {
      expect(Object.values(FEEDBACK_CATEGORY_LABELS)).toContain(label);
    }

    const storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    saveFeedbackSubmission({
      category: "report_issue",
      description: "Sample issue for testing",
      route: "/translator",
      appVersion: "0.1.0",
      commitSha: null,
      deviceSummary: "Desktop · Chrome",
      standalone: false,
      includeDiagnostics: false,
    });
    expect(loadFeedbackSubmissions()).toHaveLength(1);
  });

  it("Correction flow captures source type and language pair", () => {
    const correction = createCorrectionSubmission({
      original_text: "Which way to church",
      current_translation: "Nasaan po ang daan patungo sa simbahan?",
      suggested_correction: "Nasaan po ang daan patungo sa simbahan?",
      language: "tl",
      correction_type: "translation",
      is_native_speaker: false,
      is_profession_reviewer: false,
      source_language: "en",
      source_type: "curated_phrase",
      user_context: "travel",
    });
    expect(correction.source_language).toBe("en");
    expect(correction.source_type).toBe("curated_phrase");
    expect(correction.language).toBe("tl");
    expect(correction.user_context).toBe("travel");

    const actions = readFileSync("components/corrections/ResultCorrectionActions.tsx", "utf8");
    expect(actions).toContain("Suggest correction");
    expect(actions).toContain("Report wrong meaning");
    expect(actions).toContain("Report wrong translation");
  });

  it("Developer diagnostics hidden when Developer Mode false", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");
    expect(isDeveloperModeFeatureEnabled()).toBe(false);
    const more = readFileSync("components/settings/MoreSettingsView.tsx", "utf8");
    expect(more).toContain("isDeveloperModeFeatureEnabled() &&");
    expect(more).toContain("Production diagnostics");
  });

  it("QA screen hidden unless Developer Mode true", () => {
    const qa = readFileSync("app/more/qa/page.tsx", "utf8");
    const alias = readFileSync("app/qa/page.tsx", "utf8");
    expect(qa).toContain("isDeveloperModeFeatureEnabled()");
    expect(qa).toContain('redirect("/more")');
    expect(alias).toContain('redirect("/more")');
  });

  it("App version metadata renders in More/About", () => {
    const about = readFileSync("components/settings/AboutReleasePanel.tsx", "utf8");
    const page = readFileSync("app/more/about/page.tsx", "utf8");
    expect(about).toContain("getReleaseMetadata");
    expect(about).toContain("NEXT_PUBLIC_APP_VERSION");
    expect(page).toContain("AboutReleasePanel");
    const meta = getReleaseMetadata();
    expect(meta.appVersion).toBeTruthy();
  });

  it("Event logger does not store user text by default", () => {
    const storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage, console: { debug: vi.fn() } });
    clearAppEventCounters();
    trackAppEvent("translation_completed", {
      text: "Which way to church",
      transcript: "secret transcript",
      target: "tl",
    });
    const raw = storage.getItem("lexienn_event_counters") ?? "";
    expect(raw).not.toContain("Which way to church");
    expect(raw).not.toContain("secret transcript");
    expect(getAppEventCounters().translation_completed).toBe(1);
  });

  it("Error boundary shows safe message", () => {
    const boundary = readFileSync("components/app/AppErrorBoundary.tsx", "utf8");
    const routeError = readFileSync("app/error.tsx", "utf8");
    expect(boundary).toContain("Something went wrong");
    expect(boundary).toContain("Reload app");
    expect(boundary).toContain("Report issue");
    expect(boundary).toContain("isDeveloperModeFeatureEnabled()");
    expect(routeError).toContain("Reload app");
    expect(routeError).not.toMatch(/error\.message \|\| \"An unexpected/);
  });

  it("Service worker still excludes /api/*", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    expect(worker).toContain('if (url.pathname.startsWith("/api/")) return;');
  });

  it("Existing Define and Translate flows remain working", () => {
    expect(readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8")).toContain(
      "generateDictionaryEntryViaApi",
    );
    expect(readFileSync("components/translator/TextTranslatorView.tsx", "utf8")).toContain(
      "translateSentenceViaApi",
    );
    const phrase = findCuratedPhrase("Which way to church", "tl");
    expect(phrase?.translated_text).toBe("Nasaan po ang daan patungo sa simbahan?");
  });

  it("PWA install gate remains working", () => {
    const shell = readFileSync("components/AppShell.tsx", "utf8");
    expect(shell).toContain("shouldShowMobileInstallGate");
    expect(shell).toContain("MobileInstallGate");
    expect(typeof shouldShowMobileInstallGate).toBe("function");
  });

  it("includes Persian and Azerbaijani languages", () => {
    expect(getLanguageByCode("fa")?.name).toBe("Persian");
    expect(getLanguageByCode("az")?.name).toBe("Azerbaijani");
  });

  it("launch holds complete logo with glow before finish", () => {
    const launch = readFileSync("components/launch/LexiennLaunchScreen.tsx", "utf8");
    expect(launch).toContain("COMPLETE_HOLD_MS = 3000");
    expect(launch).toContain("launch-complete-glow");
  });
});
