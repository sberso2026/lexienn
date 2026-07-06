import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseAiDictionaryEntry } from "@/lib/ai/parseAiDictionaryEntry";
import * as aiService from "@/lib/ai/aiDictionaryService";
import { createCorrectionSubmission } from "@/lib/corrections/createCorrection";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { dictionaryGenerateResponseSchema } from "@/lib/dictionary/apiSchemas";
import {
  getMockDictionaryEntryByInput,
  mockPhrasePacks,
  validateMockSeedData,
} from "@/lib/mock";
import { isSpeechSynthesisSupported, getVoiceStatusMessage } from "@/lib/audio/speechSynthesis";
import { resolveOfflineTranslation } from "@/lib/offline/offlineTranslationResolver";
import { dictionaryQuerySchema, dictionaryEntrySchema } from "@/lib/schemas";
import { mergeDialects } from "@/lib/admin/catalog";
import { collectLowConfidenceItems } from "@/lib/admin/lowConfidence";
import { mockDialects } from "@/lib/mock/dialects";
import {
  AFRICAN_LANGUAGES_GROUP,
  getLanguageSelectGroups,
} from "@/lib/languages/languageOptions";

const sampleQuery = {
  input_text: "water",
  source_language: "en",
  target_language: "tl",
  user_context: "general" as const,
  explanation_level: "normal" as const,
  output_mode: "explain_and_translate" as const,
};

const engineerQuery = {
  ...sampleQuery,
  input_text: "load",
  user_context: "engineer" as const,
};

const householdQuery = {
  ...sampleQuery,
  input_text: "load",
  user_context: "household_family" as const,
};

describe("Lexienn MVP verification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("validates mock seed data with Zod", () => {
    const result = validateMockSeedData();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("dictionary lookup resolves curated entry for water", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");
    const result = await generateDictionaryEntry(sampleQuery);
    expect(dictionaryEntrySchema.safeParse(result.entry).success).toBe(true);
    expect(result.entry.input_text).toBe("water");
    expect(result.entry.general_meaning_en.length).toBeGreaterThan(0);
    expect(result.entry.target_meaning.length).toBeGreaterThan(0);
    expect(result.entry.confidence.score).toBeGreaterThanOrEqual(0);
    expect(result.entry.validation_status).toBeTruthy();
    expect(result.source).toBe("curated_dictionary");
  });

  it("dictionary result includes confidence and validation fields", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");
    const result = await generateDictionaryEntry(sampleQuery);
    const entry = result.entry;
    expect(entry.confidence.level).toMatch(/high|medium|low/);
    expect(entry.validation_status).toBeTruthy();
    expect(entry.pronunciation.simple.length).toBeGreaterThan(0);
  });

  it("profession-aware meaning differs for load between engineer and household", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");
    const base = getMockDictionaryEntryByInput("load");
    expect(base).toBeTruthy();

    const engineerEntry = await generateDictionaryEntry(engineerQuery);
    const householdEntry = await generateDictionaryEntry(householdQuery);

    const engineerMeaning = engineerEntry.entry.profession_meanings.find(
      (m) => m.context === "engineer",
    )?.meaning_en;
    const householdMeaning = householdEntry.entry.profession_meanings.find(
      (m) => m.context === "household_family",
    )?.meaning_en;

    expect(engineerMeaning).toBeTruthy();
    expect(householdMeaning).toBeTruthy();
    expect(engineerMeaning).not.toEqual(householdMeaning);
    expect(engineerMeaning!.toLowerCase()).toMatch(/load|force|structure/);
    expect(householdMeaning!.toLowerCase()).toMatch(/laundry|household|home|grocer/);
  });

  it("speech synthesis helpers are available", () => {
    expect(typeof isSpeechSynthesisSupported).toBe("function");
    expect(
      getVoiceStatusMessage({
        voiceName: "Test Voice",
        voiceLang: "fil-PH",
        usedRegionalFallback: true,
        noLocalVoice: false,
      }),
    ).toContain("not native-speaker verified");
    expect(
      getVoiceStatusMessage({
        voiceName: null,
        voiceLang: null,
        usedRegionalFallback: false,
        noLocalVoice: true,
      }),
    ).toContain("No matching speech voice found");
  });

  it("offline phrase packs are bundled and validated", () => {
    expect(mockPhrasePacks.length).toBeGreaterThanOrEqual(3);
    for (const pack of mockPhrasePacks) {
      expect(pack.phrases.length).toBeGreaterThan(0);
      expect(pack.phrase_count).toBe(pack.phrases.length);
    }
  });

  it("offline sentence resolver matches exact phrase from pack", () => {
    const pack = mockPhrasePacks[0];
    const result = resolveOfflineTranslation("I need water.", pack, "tl");
    expect(result.resolution_method).not.toBe("unavailable");
    expect(result.resolved_translation.length).toBeGreaterThan(0);
    expect(result.confidence_score).toBeGreaterThan(0);
  });

  it("offline sentence resolver returns safe fallback for unknown sentence", () => {
    const pack = mockPhrasePacks[0];
    const result = resolveOfflineTranslation(
      "This is a very complex unmatched sentence with no pack coverage.",
      pack,
      "tl",
    );
    expect(["unavailable", "simplified_suggestion", "keyword_fallback"]).toContain(
      result.resolution_method,
    );
  });

  it("correction submission validates and builds queue item", () => {
    const correction = createCorrectionSubmission({
      original_text: "water",
      current_translation: "tubig (mock)",
      suggested_correction: "tubig",
      language: "tl",
      dialect: "dialect-tl-manila",
      correction_type: "translation",
      is_native_speaker: false,
      is_profession_reviewer: false,
    });
    expect(correction.status).toBe("pending_sync");
    expect(correction.id.length).toBeGreaterThan(0);
  });

  it("admin catalog merges dialect overrides", () => {
    const merged = mergeDialects(mockDialects, {
      customDialects: [],
      dialectEdits: {
        [mockDialects[0].id]: { confidence_level: 0.42 },
      },
    });
    const edited = merged.find((d) => d.id === mockDialects[0].id);
    expect(edited?.confidence_level).toBe(0.42);
    expect(collectLowConfidenceItems().length).toBeGreaterThan(0);
  });

  it("API generation returns curated_dictionary without AI key", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");
    const result = await generateDictionaryEntry(sampleQuery);
    expect(result.source).toBe("curated_dictionary");
    const parsed = dictionaryGenerateResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("invalid dictionary query fails Zod validation", () => {
    const result = dictionaryQuerySchema.safeParse({
      input_text: "",
      source_language: "en",
      target_language: "tl",
    });
    expect(result.success).toBe(false);
  });

  it("invalid AI JSON returns null for safe fallback", () => {
    expect(parseAiDictionaryEntry("not-json", sampleQuery)).toBeNull();
    expect(parseAiDictionaryEntry({ incomplete: true }, sampleQuery)).toBeNull();
  });

  it("AI failure returns curated_dictionary for known seed when AI returns null", async () => {
    vi.stubEnv("AI_API_KEY", "test-key-not-real");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.spyOn(aiService, "isAiDictionaryConfigured").mockReturnValue(true);
    vi.spyOn(aiService, "generateDictionaryEntryWithAi").mockResolvedValue(null);

    const result = await generateDictionaryEntry(sampleQuery);
    expect(result.source).toBe("curated_dictionary");
    expect(result.entry.input_text).toBe("water");
    expect(dictionaryEntrySchema.safeParse(result.entry).success).toBe(true);
  });

  it("keeps AI config out of client components", () => {
    function listComponentFiles(dir: string): string[] {
      const files: string[] = [];
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) files.push(...listComponentFiles(full));
        else if (/\.(tsx|ts)$/.test(entry)) files.push(full);
      }
      return files;
    }

    for (const file of listComponentFiles("components")) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toMatch(/@\/lib\/ai\/config/);
      expect(content).not.toMatch(/getAiConfig/);
      expect(content).not.toMatch(/@\/lib\/voice\/voiceConfig/);
      expect(content).not.toMatch(/getVoiceConfig/);
    }
  });

  it("result card no longer shows MVP mock data badge", () => {
    const content = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
    expect(content).not.toContain("MVP mock data");
    expect(content).toContain("DictionarySourceBadge");
    expect(content).toContain("useVoicePlayback");
    expect(content).toContain("BottomActionBar");
  });

  it("translator auto-plays voice after Translate is clicked, or shows browser-blocked fallback", () => {
    const content = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(content).not.toContain("Play Voice");
    expect(content).toContain("autoplayRequestId");
    expect(content).toContain("autoplayBlocked");
    expect(content).toContain("Repeat slowly");
  });

  it("dictionary page has no visible Dialect field", () => {
    const content = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    expect(content).not.toMatch(/label="Dialect"/);
    expect(content).toContain("SearchableLanguageSelectField");
    expect(content).toContain("target_language_selection");
  });

  it("language selectors use a single searchable combobox without duplicate search fields", () => {
    const fieldSource = readFileSync("components/ui/SearchableLanguageSelectField.tsx", "utf8");
    const selectSource = readFileSync("components/ui/SearchableLanguageSelect.tsx", "utf8");
    const dictionary = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");

    expect(fieldSource).toContain("SearchableLanguageSelect");
    expect(fieldSource).not.toContain("<select");
    expect(fieldSource).not.toContain('placeholder="Search languages…"');
    expect(selectSource).toContain("SearchableLanguageSelect");
    expect(selectSource).toContain('placeholder="Search languages…"');
    expect(selectSource).not.toContain("<select");
    expect(dictionary.match(/<SearchableLanguageSelectField/g)?.length).toBe(2);
    expect(translator.match(/<SearchableLanguageSelectField/g)?.length).toBe(2);
    expect(settings.match(/<SearchableLanguageSelectField/g)?.length).toBe(2);
  });

  it("settings default languages sync through user preferences", () => {
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");
    const dictionary = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(settings).toContain("useUserPreferences");
    expect(settings).toContain("default_target_language");
    expect(dictionary).toContain("useUserPreferences");
    expect(translator).toContain("useUserPreferences");
  });

  it("African Languages group exists in language options", () => {
    const groups = getLanguageSelectGroups();
    expect(groups.some((group) => group.label === AFRICAN_LANGUAGES_GROUP)).toBe(true);
  });

  it("AI voice passes dialect metadata in voice schemas", () => {
    const content = readFileSync("lib/voice/voiceSchemas.ts", "utf8");
    expect(content).toContain("dialect_label");
    expect(content).toContain("voice_instruction");
    expect(content).toContain("locale_tag");
  });

  it("offline phrase card does not require OS voice installation messaging", () => {
    const content = readFileSync("components/offline/OfflinePhraseCard.tsx", "utf8");
    expect(content).not.toMatch(/install.*Windows/i);
    expect(content).toContain("VoiceButton");
  });

  it("offline page uses language-pair selectors instead of default Tagalog pack", () => {
    const offlinePage = readFileSync("app/offline/page.tsx", "utf8");
    const offlineView = readFileSync("components/offline/OfflineView.tsx", "utf8");
    expect(offlinePage).toContain("OfflineView");
    expect(offlineView).toContain("OfflineLanguagePairSelector");
    expect(offlineView).not.toContain("pack-tl-manila-remote");
    expect(offlineView).not.toContain('const DEFAULT_FROM = "en"');
    expect(offlineView).toContain("getOfflineDefaultLanguages");
  });

  it("phrase packs page uses catalog instead of legacy bundled cards", () => {
    const phrasePacks = readFileSync("components/phrase-packs/PhrasePacksView.tsx", "utf8");
    expect(phrasePacks).toContain("buildOfflinePackCatalog");
    expect(phrasePacks).not.toContain("PhrasePackCard");
  });

  it("batch 27 lite pack meets 150 phrase minimum", async () => {
    const { getLitePackTemplates, LITE_PACK_MIN_PHRASES } = await import(
      "@/lib/offline/litePhrasePack"
    );
    expect(getLitePackTemplates().length).toBeGreaterThanOrEqual(LITE_PACK_MIN_PHRASES);
  });

  it("batch 27 languages expose offline and voice metadata", async () => {
    const { getAllLanguageOptions } = await import("@/lib/languages/languageOptions");
    const options = getAllLanguageOptions();
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(typeof option.supports_offline_pack).toBe("boolean");
      expect(typeof option.supports_voice).toBe("boolean");
      expect(typeof option.supports_ocr).toBe("boolean");
      expect(typeof option.supports_speech_input).toBe("boolean");
      expect(option.locale_tag.length).toBeGreaterThan(0);
    }
  });

  it("batch 27 offline UI shows text and audio coverage", () => {
    const banner = readFileSync("components/offline/OfflineStatusBanner.tsx", "utf8");
    const selector = readFileSync("components/offline/OfflineLanguagePairSelector.tsx", "utf8");
    expect(banner).toContain("textCoverageLabel");
    expect(banner).toContain("audioCoverageLabel");
    expect(selector).toContain("packTierLabel");
  });

  it("batch 28 translator exposes Text and Camera modes", () => {
    const shell = readFileSync("components/translator/TranslatorView.tsx", "utf8");
    expect(shell).toContain("TranslatorModeTabs");
    expect(shell).toContain("TextTranslatorView");
    expect(shell).toContain("CameraTranslatorView");
  });

  it("batch 28 camera OCR reuses translator API and manual fallback", () => {
    const camera = readFileSync("components/translator/CameraTranslatorView.tsx", "utf8");
    const route = readFileSync("app/api/ocr/extract/route.ts", "utf8");
    expect(camera).toContain("translateSentenceViaApi");
    expect(camera).toContain("Type the text manually");
    expect(camera).toContain("saveOcrMissingTranslationRequest");
    expect(route).toContain("ocrExtractRequestSchema");
    expect(route).not.toContain("AI_API_KEY");
  });

  it("batch 28 sqlite schema documents OCR tables", () => {
    const schema = readFileSync("docs/offline-sqlite-schema.md", "utf8");
    expect(schema).toContain("supports_ocr");
    expect(schema).toContain("ocr_sessions");
    expect(schema).toContain("ocr_blocks");
    expect(schema).toContain("request_type");
  });

  it("batch 29 dictionary and translator expose voice input controls", () => {
    const dictionary = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    const cameraEditor = readFileSync("components/translator/OcrResultEditor.tsx", "utf8");
    expect(dictionary).toContain("VoiceInputTextArea");
    expect(dictionary).toContain('inputTarget="dictionary"');
    expect(translator).toContain("VoiceInputTextArea");
    expect(translator).toContain('inputTarget="translator"');
    expect(cameraEditor).toContain("VoiceInputTextArea");
  });

  it("batch 29 speech-to-text route keeps API keys server-side", () => {
    const route = readFileSync("app/api/speech/transcribe/route.ts", "utf8");
    const service = readFileSync("lib/speech/speechToTextService.ts", "utf8");
    const client = readFileSync("lib/speech/speechToTextClient.ts", "utf8");
    expect(route).not.toContain("AI_API_KEY");
    expect(client).toContain("/api/speech/transcribe");
    expect(client).not.toContain("AI_API_KEY");
    expect(service).toContain("process.env.AI_API_KEY");
    expect(service).toContain("whisper");
  });

  it("batch 29 sqlite schema documents speech input tables", () => {
    const schema = readFileSync("docs/offline-sqlite-schema.md", "utf8");
    expect(schema).toContain("supports_speech_input");
    expect(schema).toContain("speech_input_sessions");
    expect(schema).toContain("speech_input_errors");
  });

  it("batch 29 voice input handles permission and unsupported states", () => {
    const status = readFileSync("components/speech/VoiceInputStatus.tsx", "utf8");
    const hook = readFileSync("hooks/useVoiceInput.ts", "utf8");
    const client = readFileSync("lib/speech/speechToTextClient.ts", "utf8");
    const preflight = readFileSync("lib/speech/requestMicPermission.ts", "utf8");
    expect(hook).toContain("requestMicPermissionPreflight");
    expect(hook).not.toContain("Microphone access was blocked");
    expect(preflight).toContain("getUserMedia({ audio: true })");
    expect(client).toContain("micPermissionPreflightPassed");
    expect(status).toContain("Use transcript");
    expect(status).toContain("Continue typing");
    expect(status).toContain("Try again");
    expect(readFileSync("lib/speech/micPermissionMessages.ts", "utf8")).toContain(
      "permission_denied",
    );
    expect(hook).toContain("unsupported");
  });

  it("batch 42 mic permission classifier and platform detection exist", () => {
    const classifier = readFileSync("lib/speech/classifyMicError.ts", "utf8");
    const platform = readFileSync("lib/platform/detectClientPlatform.ts", "utf8");
    const diagnostics = readFileSync("components/settings/MicDiagnosticsPanel.tsx", "utf8");
    expect(classifier).toContain("mic_permission_denied");
    expect(classifier).toContain("NotAllowedError");
    expect(platform).toContain("isStandalonePwa");
    expect(diagnostics).toContain("runMicDiagnosticsTest");
  });

  it("batch 30 mobile bottom nav uses compact Define/Translate labels", () => {
    const nav = readFileSync("components/layout/MobileBottomNav.tsx", "utf8");
    const config = readFileSync("lib/navigation/navConfig.tsx", "utf8");
    expect(nav).toContain("MAIN_NAV_ITEMS");
    expect(config).toContain('label: "Define"');
    expect(config).toContain('label: "Translate"');
    expect(config).toContain('label: "Packs"');
    expect(nav).toContain("md:hidden");
  });

  it("batch 30 compact header replaces large page titles", () => {
    const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
    const dictionary = readFileSync("app/dictionary/page.tsx", "utf8");
    expect(header).toContain("header-height");
    expect(header).toContain("Online");
    expect(dictionary).not.toContain("text-2xl");
  });

  it("batch 30 dictionary uses compact input card with mic inside field", () => {
    const form = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    const voice = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");
    expect(form).toContain("CompactCard");
    expect(form).toContain("ExpandableSection");
    expect(voice).toContain("compact");
    expect(voice).toContain("absolute");
  });

  it("batch 30 translator has no Play Voice button and uses icon actions", () => {
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(translator).not.toContain("Play Voice");
    expect(translator).not.toContain("Repeat Slowly");
    expect(translator).toContain("IconButton");
    expect(translator).toContain("CompactCard");
  });

  it("batch 30 settings hides admin unless developer mode enabled", () => {
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");
    const prefs = readFileSync("lib/settings/userPreferences.ts", "utf8");
    expect(prefs).toContain("developer_mode_enabled");
    expect(settings).toContain("Developer Mode");
    expect(settings).toContain("preferences.developer_mode_enabled");
    expect(settings).not.toContain("AI provider configured");
    expect(settings).not.toContain("Rule fallback enabled");
  });

  it("batch 30 offline banner uses compact status chips", () => {
    const banner = readFileSync("components/offline/OfflineStatusBanner.tsx", "utf8");
    expect(banner).toContain("StatusChip");
    expect(banner).not.toContain("Cloud generation is available");
    expect(banner).not.toContain("External hard drive");
  });

  it("batch 30 phrase packs use compact pack cards", () => {
    const packs = readFileSync("components/phrase-packs/PhrasePacksView.tsx", "utf8");
    expect(packs).toContain("PackCard");
    expect(packs).not.toContain("Cloud generation is optional");
  });

  it("batch 31 production UI avoids MVP and mock wording in components", () => {
    function listUiFiles(dir: string): string[] {
      const files: string[] = [];
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) files.push(...listUiFiles(full));
        else if (/\.tsx$/.test(entry)) files.push(full);
      }
      return files;
    }

    const forbidden = [
      /\bMVP\b/i,
      /mock seed/i,
      /Admin Lite/i,
      /Rule fallback/i,
      /AI provider configured/i,
      /MVP mock/i,
    ];

    for (const file of listUiFiles("components")) {
      const content = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(content).not.toMatch(pattern);
      }
    }
  });

  it("batch 31 developer labels module defines professional dev-mode names", () => {
    const labels = readFileSync("lib/ui/developerLabels.ts", "utf8");
    expect(labels).toContain('development: "Development"');
    expect(labels).toContain('seedData: "Seed data"');
    expect(labels).toContain('localAdminTools: "Local admin tools"');
    expect(labels).toContain('fallbackPolicy: "Fallback policy"');
    expect(labels).toContain('providerStatus: "Provider status"');
    expect(labels).toContain("CAMERA_PRIVACY_NOTE");
  });

  it("batch 31 camera mode hides OCR internals unless developer mode", () => {
    const camera = readFileSync("components/translator/CameraTranslatorView.tsx", "utf8");
    const editor = readFileSync("components/translator/OcrResultEditor.tsx", "utf8");
    const capture = readFileSync("components/translator/ImageCaptureCard.tsx", "utf8");
    expect(camera).toContain("showDeveloperDetails={developerModeActive}");
    expect(editor).toContain("showDeveloperDetails");
    expect(editor).toContain('summary="Developer details"');
    expect(capture).toContain("PrivacyShieldButton");
    expect(capture).toContain("Open Camera");
    expect(capture).toContain("Upload Image");
    expect(capture).not.toContain("MVP");
  });

  it("batch 31 settings keeps developer diagnostics collapsed by default", () => {
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");
    expect(settings).toContain("ExpandableSection");
    expect(settings).toContain("DEV_LABELS.localAdminTools");
    expect(settings).toContain("DEV_LABELS.fallbackPolicy");
    expect(settings).toContain("DEV_LABELS.providerStatus");
    expect(settings).not.toMatch(/defaultOpen=\{true\}/);
  });

  it("batch 31 offline layout preserves banner search tabs and phrase cards", () => {
    const offline = readFileSync("components/offline/OfflineView.tsx", "utf8");
    const banner = readFileSync("components/offline/OfflineStatusBanner.tsx", "utf8");
    const tabs = readFileSync("components/offline/OfflineCategoryTabs.tsx", "utf8");
    const card = readFileSync("components/offline/OfflinePhraseCard.tsx", "utf8");
    expect(offline).toContain("OfflineStatusBanner");
    expect(offline).toContain("OfflineCategoryTabs");
    expect(offline).toContain("OfflinePhraseCard");
    expect(offline).toContain("getRecentPhrases");
    expect(banner).toContain("StatusChip");
    expect(tabs).toContain("Emergency");
    expect(card).toContain("Large Text");
    expect(card).toContain("Favorite");
  });

  it("batch 31 sqlite schema docs include required tables", () => {
    const schema = readFileSync("docs/offline-sqlite-schema.md", "utf8");
    for (const table of [
      "languages",
      "entries",
      "examples",
      "favorites",
      "missing_requests",
    ]) {
      expect(schema).toContain(`### \`${table}\``);
    }
  });

  it("batch 31 mobile shell prevents horizontal overflow", () => {
    const globals = readFileSync("app/globals.css", "utf8");
    expect(globals).toContain("overflow-x: hidden");
    expect(globals).toContain("safe-bottom");
  });

  it("batch 32 seed data source has no prototype phrase markers", () => {
    const packs = readFileSync("lib/mock/phrase-packs.ts", "utf8");
    const entries = readFileSync("lib/mock/dictionary-entries.ts", "utf8");
    const local = readFileSync("lib/offline/localResponses.ts", "utf8");
    const notice = readFileSync("lib/mock/constants.ts", "utf8");
    expect(packs).not.toMatch(/MVP mock/i);
    expect(entries).not.toMatch(/MVP mock/i);
    expect(local).not.toMatch(/MVP mock/i);
    expect(notice).toContain("SEED_DATA_NOTICE");
    expect(notice).not.toMatch(/MVP mock/i);
  });

  it("batch 32 developer mode gated by NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", () => {
    const envExample = readFileSync(".env.example", "utf8");
    const publicEnv = readFileSync("lib/config/publicEnv.ts", "utf8");
    const prefs = readFileSync("lib/settings/userPreferences.ts", "utf8");
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");
    const debug = readFileSync("lib/debug/shouldShowInternalDebugUi.ts", "utf8");
    expect(envExample).toContain("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false");
    expect(publicEnv).toContain("isDeveloperModeFeatureEnabled");
    expect(prefs).toContain("isDeveloperModeFeatureEnabled");
    expect(prefs).toContain("developer_mode_enabled: false");
    expect(settings).toContain("isDeveloperModeFeatureEnabled");
    expect(settings).toContain("developerModeAvailable");
    expect(debug).toContain("isDeveloperModeFeatureEnabled");
  });

  it("batch 32 mobile QA checklist documents 360 390 430 widths", () => {
    const checklist = readFileSync("docs/mobile-qa-checklist.md", "utf8");
    expect(checklist).toContain("360px");
    expect(checklist).toContain("390px");
    expect(checklist).toContain("430px");
    expect(checklist).toContain("overflow");
    expect(checklist.toLowerCase()).toContain("bottom nav");
  });

  it("batch 32 offline-first architecture docs remain present", () => {
    const arch = readFileSync("docs/offline-first-architecture.md", "utf8");
    expect(arch).toMatch(/local|offline|pack/i);
    expect(arch).not.toMatch(/native SQLite is implemented/i);
  });

  it("batch 33 offline pack stores schema and content version fields", () => {
    const schema = readFileSync("lib/offline/offlinePackSchemas.ts", "utf8");
    const versions = readFileSync("lib/offline/offlinePackVersions.ts", "utf8");
    const generator = readFileSync("lib/offline/offlinePackGenerator.ts", "utf8");
    expect(schema).toContain("schema_version");
    expect(schema).toContain("content_version");
    expect(schema).toContain("generated_by_app_version");
    expect(versions).toContain("OFFLINE_PACK_SCHEMA_VERSION = 2");
    expect(versions).toContain("OFFLINE_PACK_CONTENT_VERSION = 2");
    expect(generator).toContain("schema_version: OFFLINE_PACK_SCHEMA_VERSION");
  });

  it("batch 33 settings provides confirmed offline storage reset actions", () => {
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");
    const actions = readFileSync("components/settings/OfflineStorageActions.tsx", "utf8");
    const reset = readFileSync("lib/storage/localDataReset.ts", "utf8");
    expect(settings).toContain("OfflineStorageActions");
    expect(actions).toContain("ConfirmSheet");
    expect(actions).toContain("Clear downloaded packs");
    expect(actions).toContain("Reset Lexienn local data");
    expect(reset).toContain("clearDownloadedOfflinePacks");
    expect(reset).toContain("resetLexiennLocalData");
  });

  it("batch 33 offline migration and outdated detection wired on load", () => {
    const migration = readFileSync("lib/offline/offlinePackMigration.ts", "utf8");
    const store = readFileSync("lib/offline/localOfflineStore.ts", "utf8");
    const service = readFileSync("lib/offline/offlinePackService.ts", "utf8");
    const banner = readFileSync("components/offline/OfflineStatusBanner.tsx", "utf8");
    expect(migration).toContain("migrateOfflinePack");
    expect(migration).toContain("PROTOTYPE_WORDING_PATTERN");
    expect(store).toContain("migrateOfflinePack");
    expect(service).toContain("resolveOfflinePackStatus");
    expect(service).toContain("outdatedWarning");
    expect(banner).toContain("Update available");
  });

  it("batch 33 sqlite schema docs include pack version fields", () => {
    const schema = readFileSync("docs/offline-sqlite-schema.md", "utf8");
    expect(schema).toContain("schema_version");
    expect(schema).toContain("content_version");
    expect(schema).toContain("generated_by_app_version");
    for (const table of [
      "languages",
      "entries",
      "examples",
      "favorites",
      "missing_requests",
    ]) {
      expect(schema).toContain(`### \`${table}\``);
    }
  });

  it("batch 35 vercel deployment doc exists with env and security guidance", () => {
    const doc = readFileSync("docs/vercel-deployment.md", "utf8");
    expect(doc).toContain("lexienn");
    expect(doc).toContain("Next.js");
    expect(doc).toContain("Environment Variables");
    expect(doc).toContain("AI_API_KEY");
    expect(doc).toContain("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE");
    expect(doc).toMatch(/NEXT_PUBLIC_.*secret|Never prefix secret|never prefix secret/i);
    expect(doc).toContain("vercel --prod");
  });

  it("batch 35 ventraip dns doc adds domain in Vercel before VentraIP", () => {
    const doc = readFileSync("docs/ventraip-dns.md", "utf8");
    expect(doc).toContain("Add domain in Vercel");
    expect(doc).toContain("VIPControl");
    expect(doc).toContain("| `@` | A |");
    expect(doc).toContain("| `www` | CNAME |");
    expect(doc).toMatch(/paste Vercel|exact values from Vercel/i);
    expect(doc).not.toMatch(/76\.76\.21\.21.*required|must use 76\.76\.21\.21/i);
  });

  it("batch 35 production deployment checklist covers verify and domain steps", () => {
    const checklist = readFileSync("docs/production-deployment-checklist.md", "utf8");
    expect(checklist).toContain("npm run lint");
    expect(checklist).toContain("npm run typecheck");
    expect(checklist).toContain("npm run build");
    expect(checklist).toContain("npm run verify:lexienn");
    expect(checklist).toContain(".env.local");
    expect(checklist).toContain("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false");
    expect(checklist).toContain("360px");
    expect(checklist).toContain("390px");
    expect(checklist).toContain("430px");
    expect(checklist).toContain("ventraip-dns.md");
  });

  it("batch 35 env example lists deployment variables without committing secrets", () => {
    const envExample = readFileSync(".env.example", "utf8");
    expect(envExample).toContain("AI_ENABLED");
    expect(envExample).toContain("AI_BASE_URL");
    expect(envExample).toContain("SPEECH_INPUT_TIMEOUT_MS");
    expect(envExample).toContain("Never commit");
  });

  it("batch 35 vercel readiness next config and gitignore env", () => {
    const pkg = readFileSync("package.json", "utf8");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(pkg).toContain('"build": "next build"');
    expect(pkg).toContain('"typecheck"');
    expect(nextConfig).toContain("NextConfig");
    expect(gitignore).toContain(".env*.local");
  });

  it("batch 36 PWA manifest exists with Lexienn install metadata", () => {
    const manifest = readFileSync("app/manifest.ts", "utf8");
    expect(manifest).toContain('name: "Lexienn"');
    expect(manifest).toContain('short_name: "Lexienn"');
    expect(manifest).toContain('start_url: "/"');
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain("theme_color");
    expect(manifest).toContain("icon-192x192.png");
    expect(manifest).toContain("icon-512x512.png");
    expect(manifest).toContain("maskable");
    expect(manifest).not.toContain("AI_API_KEY");
  });

  it("batch 36 mobile metadata and PWA icons present", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("Lexienn");
    expect(layout).toContain("themeColor");
    expect(layout).toContain("appleWebApp");
    expect(layout).toContain("viewport");
    for (const icon of [
      "public/icons/icon-192x192.png",
      "public/icons/icon-512x512.png",
      "public/icons/maskable-icon-192x192.png",
      "public/icons/maskable-icon-512x512.png",
    ]) {
      expect(existsSync(icon)).toBe(true);
    }
  });

  it("batch 36 PWA installability docs cover platforms and offline limits", () => {
    const doc = readFileSync("docs/pwa-installability.md", "utf8");
    expect(doc).toContain("Android");
    expect(doc).toContain("iOS");
    expect(doc).toContain("IndexedDB");
    expect(doc).toMatch(/service worker/i);
    expect(doc).toMatch(/Spotlight|AppSearch/i);
    expect(doc).not.toContain("AI_API_KEY");
  });

  it("batch 36 offline UI layout unchanged", () => {
    const offline = readFileSync("components/offline/OfflineView.tsx", "utf8");
    expect(offline).toContain("OfflineStatusBanner");
    expect(offline).toContain("search");
    expect(offline).toContain("OfflineCategoryTabs");
    expect(offline).toContain("OfflinePhraseCard");
  });

  it("batch 37 curated fallback resolves house and name question without AI", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const dict = await generateDictionaryEntry({
      input_text: "house",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    });
    expect(dict.source).toBe("curated_dictionary");
    expect(dict.entry.target_meaning).toContain("bahay");

    const { translateSentence } = await import("@/lib/translator/translateSentence");
    const translated = await translateSentence({
      input_text: "What's your name?",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      translation_mode: "natural",
      ai_translation_enabled: false,
      rule_fallback_enabled: true,
    });
    expect(translated.source).toBe("curated_phrase");
    expect(translated.translated_text).toBe("Ano ang pangalan mo?");
  });

  it("batch 37 normalize lookup utility exists", () => {
    const mod = readFileSync("lib/text/normalizeLookupText.ts", "utf8");
    expect(mod).toContain("normalizeLookupText");
    expect(mod).toContain("normalizeLookupCandidates");
    expect(mod).toContain("what is");
  });

  it("batch 37 curated phrases data exists", () => {
    const mod = readFileSync("lib/translator/curatedPhrases.ts", "utf8");
    expect(mod).toContain("Ano ang pangalan mo?");
    expect(mod).toContain("CURATED_PHRASE_ENTRIES");
  });

  it("batch 38 tie beam resolves from engineering glossary file", () => {
    const ext = readFileSync("lib/dictionary/engineeringGlossaryExtended.ts", "utf8");
    expect(ext).toContain("tie beam");
    expect(ext).toContain("biga na pangtali");
    expect(ext).toContain("Ikinokonekta ng tie beam");
  });

  it("batch 38 dictionary generate route uses node runtime", () => {
    const route = readFileSync("app/api/dictionary/generate/route.ts", "utf8");
    expect(route).toContain('runtime = "nodejs"');
    expect(route).toContain("logDictionaryGenerate");
  });

  it("batch 39 microcracking glossary and AI self-test route exist", () => {
    const ext = readFileSync("lib/dictionary/engineeringGlossaryExtended.ts", "utf8");
    const selfTest = readFileSync("lib/ai/aiSelfTest.ts", "utf8");
    const route = readFileSync("app/api/ai/self-test/route.ts", "utf8");
    expect(ext).toContain("microcracking");
    expect(selfTest).toContain("AI_SELF_TEST_TOKEN");
    expect(route).toContain('runtime = "nodejs"');
  });

  it("batch 40 common seed dictionary and result page API fetch exist", () => {
    const seed = readFileSync("lib/dictionary/commonSeedDictionary.ts", "utf8");
    const params = readFileSync("lib/dictionary/buildDictionaryQueryFromParams.ts", "utf8");
    const resultView = readFileSync("components/dictionary/DictionaryResultView.tsx", "utf8");
    expect(seed).toContain("acceleration");
    expect(seed).toContain("resolveCommonSeedDictionaryEntry");
    expect(params).toContain("normalizeDictionaryLanguageCode");
    expect(resultView).toContain("generateDictionaryEntryViaApi");
    expect(resultView).toContain("buildDictionaryQueryFromSearchParams");
  });

  it("batch 41 OpenAI endpoint normalization exists", () => {
    const endpoint = readFileSync("lib/ai/openAiEndpoint.ts", "utf8");
    const client = readFileSync("lib/ai/openAiClient.ts", "utf8");
    const errors = readFileSync("lib/ai/aiErrors.ts", "utf8");
    expect(endpoint).toContain("https://api.openai.com/v1");
    expect(endpoint).toContain("/chat/completions");
    expect(client).not.toContain("/v1/chat/completions");
    expect(errors).toContain("provider_model_or_endpoint_not_found");
  });

  it("batch 43 PWA launch screen and installability wiring", () => {
    expect(existsSync("components/launch/LexiennLaunchScreen.tsx")).toBe(true);
    expect(existsSync("components/pwa/MobileInstallGate.tsx")).toBe(true);
    expect(existsSync("public/sw.js")).toBe(true);
    expect(existsSync("docs/mobile-launch-animation.md")).toBe(true);
    const manifest = readFileSync("app/manifest.ts", "utf8");
    expect(manifest).toContain("shortcuts");
    expect(manifest).toContain("#163a63");
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("AppShell");
    expect(readFileSync("components/layout/CompactHeader.tsx", "utf8")).toContain(
      "LexiennBrandLogo",
    );
    expect(existsSync("public/icons/icon-192x192.png")).toBe(true);
    expect(existsSync("public/apple-touch-icon.png")).toBe(true);
  });

  it("batch 44 mobile install gate blocks browser mode on mobile", () => {
    const gate = readFileSync("components/pwa/MobileInstallGate.tsx", "utf8");
    const shell = readFileSync("components/AppShell.tsx", "utf8");
    expect(gate).toContain("Add to Home Screen");
    expect(shell).toContain("shouldShowMobileInstallGate");
    expect(readFileSync("lib/pwa/shouldShowMobileInstallGate.ts", "utf8")).toContain(
      "isLocalhostDev",
    );
  });
});
