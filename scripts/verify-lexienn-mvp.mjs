#!/usr/bin/env node
/**
 * Lexienn MVP verification orchestrator (Batch 15).
 * Runs filesystem checks, Vitest integration checks, and optional API smoke tests.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const results = [];

function pass(id, message) {
  results.push({ id, ok: true, message });
  console.log(`  ✓ [${id}] ${message}`);
}

function fail(id, message) {
  results.push({ id, ok: false, message });
  console.error(`  ✗ [${id}] ${message}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
    server.on("error", reject);
  });
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { response, json, text };
}

async function waitForServer(baseUrl, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${baseUrl}/dictionary`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

function verifyFilesystem() {
  console.log("\n== Filesystem & route checks ==");

  const routes = [
    ["home dashboard", "app/page.tsx"],
    ["/dictionary", "app/dictionary/page.tsx"],
    ["/dictionary/result", "app/dictionary/result/page.tsx"],
    ["/translator", "app/translator/page.tsx"],
    ["/lens", "app/lens/page.tsx"],
    ["/library", "app/library/page.tsx"],
    ["/more", "app/more/page.tsx"],
    ["POST /api/translator/translate", "app/api/translator/translate/route.ts"],
    ["POST /api/ocr/extract", "app/api/ocr/extract/route.ts"],
    ["GET /api/ocr/status", "app/api/ocr/status/route.ts"],
    ["POST /api/speech/transcribe", "app/api/speech/transcribe/route.ts"],
    ["GET /api/speech/status", "app/api/speech/status/route.ts"],
    ["/offline", "app/offline/page.tsx"],
    ["/phrase-packs", "app/phrase-packs/page.tsx"],
    ["/settings", "app/settings/page.tsx"],
    ["POST /api/dictionary/generate", "app/api/dictionary/generate/route.ts"],
    ["GET /api/ai/status", "app/api/ai/status/route.ts"],
    ["POST /api/voice/speak", "app/api/voice/speak/route.ts"],
    ["GET /api/voice/status", "app/api/voice/status/route.ts"],
  ];

  for (const [route, file] of routes) {
    const fullPath = join(ROOT, file);
    if (existsSync(fullPath)) {
      pass("route", `${route} → ${file}`);
    } else {
      fail("route", `Missing route file for ${route}: ${file}`);
    }
  }

  const keyModules = [
    "components/dictionary/DictionaryLookupForm.tsx",
    "components/dictionary/DictionaryResultCard.tsx",
    "components/translator/TranslatorView.tsx",
    "components/translator/TextTranslatorView.tsx",
    "components/translator/CameraTranslatorView.tsx",
    "components/translator/TranslatorModeTabs.tsx",
    "components/translator/ImageCaptureCard.tsx",
    "components/translator/OcrResultEditor.tsx",
    "components/translator/CameraTranslationResultCard.tsx",
    "components/settings/SettingsView.tsx",
    "components/offline/OfflineView.tsx",
    "components/offline/OfflineLanguagePairSelector.tsx",
    "components/offline/OfflineStatusBanner.tsx",
    "components/offline/OfflineCategoryTabs.tsx",
    "components/offline/OfflinePhraseCard.tsx",
    "components/corrections/CorrectionsQueueView.tsx",
    "components/admin/AdminLanguagesView.tsx",
    "lib/audio/speechSynthesis.ts",
    "lib/voice/generateSpeech.ts",
    "lib/voice/voiceConfig.ts",
    "lib/languages/languageOptions.ts",
    "lib/settings/userPreferences.ts",
    "hooks/useUserPreferences.ts",
    "components/voice/VoiceButton.tsx",
    "lib/dictionary/generateDictionaryEntry.ts",
    "lib/translator/translateSentence.ts",
    "lib/translator/translatorSchemas.ts",
    "lib/ocr/ocrSchemas.ts",
    "lib/ocr/ocrClient.ts",
    "lib/ocr/ocrService.ts",
    "lib/ocr/ocrLanguageHints.ts",
    "lib/ocr/localOcrClient.ts",
    "lib/ocr/ocrOfflineBridge.ts",
    "lib/speech/speechInputSchemas.ts",
    "lib/speech/speechInputConfig.ts",
    "lib/speech/browserSpeechRecognition.ts",
    "lib/speech/speechToTextClient.ts",
    "lib/speech/speechToTextService.ts",
    "components/speech/VoiceInputButton.tsx",
    "components/speech/VoiceInputStatus.tsx",
    "components/speech/VoiceInputTextArea.tsx",
    "hooks/useVoiceInput.ts",
    "lib/navigation/navConfig.tsx",
    "components/layout/CompactHeader.tsx",
    "components/home/HomeDashboard.tsx",
    "components/library/LibraryView.tsx",
    "components/settings/MoreSettingsView.tsx",
    "components/ui/IconButton.tsx",
    "components/ui/CompactCard.tsx",
    "components/ui/StatusChip.tsx",
    "components/ui/BottomActionBar.tsx",
    "components/ui/ExpandableSection.tsx",
    "components/ui/PrivacyShieldButton.tsx",
    "lib/ui/developerLabels.ts",
    "lib/config/publicEnv.ts",
    "lib/debug/developerMode.ts",
    "docs/mobile-qa-checklist.md",
    "components/ui/CompactSegmentedControl.tsx",
    "lib/dictionary/aiDictionaryPrompt.ts",
    "lib/ai/config.ts",
    "lib/ai/aiDictionaryService.ts",
    "lib/offline/offlineTranslationResolver.ts",
    "lib/offline/offlinePackService.ts",
    "lib/offline/localOfflineStore.ts",
    "lib/offline/offlinePackStore.ts",
    "lib/offline/getOfflinePackStore.ts",
    "lib/offline/memoryOfflinePackStore.ts",
    "lib/offline/indexedDbOfflinePackStore.ts",
    "lib/offline/sqliteOfflinePackStore.ts",
    "lib/offline/offlinePackMigration.ts",
    "lib/offline/offlinePackVersions.ts",
    "lib/storage/localDataReset.ts",
    "components/settings/OfflineStorageActions.tsx",
    "components/ui/ConfirmSheet.tsx",
    "lib/offline/litePhrasePack.ts",
    "lib/offline/offlinePackCoverage.ts",
    "lib/offline/cacheOfflinePackAudio.ts",
    "lib/offline/offlineAudioCache.ts",
    "docs/offline-sqlite-schema.md",
    "docs/offline-first-architecture.md",
    "docs/vercel-deployment.md",
    "docs/ventraip-dns.md",
    "docs/production-deployment-checklist.md",
    "docs/pwa-installability.md",
    "app/manifest.ts",
    "lib/text/normalizeLookupText.ts",
    "lib/translator/curatedPhrases.ts",
    "lib/translator/curatedPhraseTranslation.ts",
    "lib/dictionary/engineeringGlossaryExtended.ts",
    "lib/api/safeRouteLog.ts",
    "app/api/dictionary/smoke-test/route.ts",
    "app/api/ai/self-test/route.ts",
    "lib/ai/aiSelfTest.ts",
    "lib/ai/aiErrors.ts",
    "lib/storage/savedWordsStorage.ts",
    "lib/storage/savedPhrasesStorage.ts",
    "lib/storage/phrasePackStorage.ts",
    "lib/storage/correctionsStorage.ts",
    "docs/personal-ai-dictionary-mvp-plan.md",
  ];

  for (const file of keyModules) {
    const fullPath = join(ROOT, file);
    if (existsSync(fullPath)) {
      pass("module", file);
    } else {
      fail("module", `Missing module: ${file}`);
    }
  }
}

async function verifyVitest() {
  console.log("\n== Programmatic MVP checks (Vitest) ==");
  try {
    await runCommand("npx", [
      "vitest",
      "run",
      "scripts/verify-lexienn-mvp.test.ts",
      "lib/dictionary/generateDictionaryEntry.test.ts",
      "lib/dictionary/dictionarySources.test.ts",
      "lib/ai/aiDictionaryGeneration.test.ts",
      "lib/ai/aiStatus.test.ts",
      "lib/voice/voiceStatus.test.ts",
      "lib/languages/languageOptions.test.ts",
      "lib/translator/translateSentence.test.ts",
      "lib/offline/offlinePackMigration.test.ts",
      "lib/dictionary/aiDictionaryPrompt.test.ts",
      "--reporter=dot",
    ]);
    pass("vitest", "All programmatic verification tests passed");
  } catch (error) {
    fail("vitest", error.message);
  }
}

async function verifyApi() {
  console.log("\n== API smoke tests ==");

  const buildIdPath = join(ROOT, ".next", "BUILD_ID");
  if (!existsSync(buildIdPath)) {
    console.log("  … no production build found; running next build");
    try {
      await runCommand("npm", ["run", "build"]);
      pass("build", "Production build completed for API smoke tests");
    } catch (error) {
      fail("build", `Build failed: ${error.message}`);
      return;
    }
  } else {
    pass("build", ".next build present");
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: ROOT,
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  try {
    const ready = await waitForServer(baseUrl);
    if (!ready) {
      fail("api", "Server did not become ready for API smoke tests");
      return;
    }

    const validBody = {
      input_text: "water",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    };

    const valid = await fetchJson(`${baseUrl}/api/dictionary/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    if (valid.response.ok && valid.json?.source === "curated_dictionary" && valid.json?.entry) {
      pass("api-curated", "POST /api/dictionary/generate returns curated_dictionary without AI key");
    } else {
      fail(
        "api-curated",
        `Unexpected API success response: ${valid.response.status} source=${valid.json?.source ?? "none"} ${valid.text.slice(0, 120)}`,
      );
    }

    const curate = await fetchJson(`${baseUrl}/api/dictionary/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, input_text: "curate" }),
    });

    if (
      curate.response.ok &&
      curate.json?.source === "curated_dictionary" &&
      curate.json?.entry?.general_meaning_en?.length > 20
    ) {
      pass("api-curate", "curate returns curated_dictionary with a real definition");
    } else {
      fail(
        "api-curate",
        `curate lookup failed: ${curate.response.status} source=${curate.json?.source ?? "none"}`,
      );
    }

    const aiStatus = await fetchJson(`${baseUrl}/api/ai/status`);
    if (
      aiStatus.response.ok &&
      typeof aiStatus.json?.ai_enabled === "boolean" &&
      typeof aiStatus.json?.aiEnabled === "boolean" &&
      typeof aiStatus.json?.provider_configured === "boolean" &&
      typeof aiStatus.json?.hasApiKey === "boolean" &&
      !aiStatus.text.includes("sk-")
    ) {
      pass("api-ai-status", "GET /api/ai/status returns config flags without secrets");
    } else {
      fail("api-ai-status", `Unexpected /api/ai/status response: ${aiStatus.text.slice(0, 120)}`);
    }

    const voiceStatus = await fetchJson(`${baseUrl}/api/voice/status`);
    if (
      voiceStatus.response.ok &&
      typeof voiceStatus.json?.voice_enabled === "boolean" &&
      typeof voiceStatus.json?.provider_configured === "boolean" &&
      !voiceStatus.text.includes("sk-")
    ) {
      pass("api-voice-status", "GET /api/voice/status returns config flags without secrets");
    } else {
      fail(
        "api-voice-status",
        `Unexpected /api/voice/status response: ${voiceStatus.text.slice(0, 120)}`,
      );
    }

    const speechStatus = await fetchJson(`${baseUrl}/api/speech/status`);
    if (
      speechStatus.response.ok &&
      typeof speechStatus.json?.speech_input_enabled === "boolean" &&
      typeof speechStatus.json?.provider_configured === "boolean" &&
      !speechStatus.text.includes("sk-")
    ) {
      pass(
        "api-speech-status",
        "GET /api/speech/status returns config flags without secrets",
      );
    } else {
      fail(
        "api-speech-status",
        `Unexpected /api/speech/status response: ${speechStatus.text.slice(0, 120)}`,
      );
    }

    const voiceSpeak = await fetchJson(`${baseUrl}/api/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Kumusta",
        language: "tl",
        speed: "normal",
        voice_mode: "ai",
      }),
    });

    if (
      voiceSpeak.response.ok &&
      ["browser_fallback", "ai_generated", "unavailable"].includes(voiceSpeak.json?.audio_type)
    ) {
      pass("api-voice-speak", "POST /api/voice/speak returns playable voice metadata or fallback");
    } else {
      fail(
        "api-voice-speak",
        `Unexpected /api/voice/speak response: ${voiceSpeak.response.status} ${voiceSpeak.text.slice(0, 120)}`,
      );
    }

    const invalid = await fetchJson(`${baseUrl}/api/dictionary/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_text: "", source_language: "en", target_language: "tl" }),
    });

    if (invalid.response.status === 400 && invalid.json?.error) {
      pass("api-validation", "Invalid API payload returns 400 validation error");
    } else {
      fail(
        "api-validation",
        `Expected 400 validation error, got ${invalid.response.status}`,
      );
    }
  } catch (error) {
    fail("api", error.message);
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }
}

function printManualChecklist() {
  console.log("\n== Manual test checklist (browser) ==");
  const items = [
    "Dictionary without AI: set AI_ENABLED=false; lookup curated word 'curate' → Curated dictionary badge",
    "Dictionary without AI: lookup unknown word 'xyzzyplugh999' → Unavailable (not fake definition)",
    "Dictionary with AI: set AI_ENABLED=true, AI_API_KEY, AI_MODEL; lookup unknown word → AI generated badge",
    "English→English: source and target English; result shows definition summary, not fake translation",
    "Engineer context: lookup 'dead load' and 'deep beam' → Domain glossary with engineering meaning",
    "Settings or devtools: GET /api/ai/status shows ai_enabled flags; response must not include API key",
    "Settings or devtools: GET /api/voice/status shows voice_enabled flags; response must not include API key",
    "Open /translator online with VOICE_ENABLED=true; Play Voice shows AI voice badge when configured",
    "Open /dictionary, tap sample chip, submit lookup, view result card",
    "Open /translator, enter a sentence, confirm translation UI",
    "Open /dictionary, tap Speak, confirm transcript fills input and can be edited before Define",
    "Open /translator Text mode, tap Speak, confirm transcript fills sentence before Translate",
    "Deny microphone permission and confirm permission-denied fallback message",
    "Open /translator → Camera tab, upload an image, extract text, translate",
    "Download language-pair packs on /offline (From + To selectors)",
    "Spanish → Vietnamese or German → Lao when online with AI configured",
    "Play voice on offline phrase card and local response buttons",
    "Tab through nav/forms; confirm focus ring and skip link",
  ];
  for (const item of items) {
    console.log(`  • ${item}`);
  }
}

async function main() {
  console.log("Lexienn MVP verification\n=======================");

  verifyFilesystem();
  await verifyVitest();
  await verifyApi();
  printManualChecklist();

  const failed = results.filter((r) => !r.ok);
  console.log("\n== Summary ==");
  console.log(`  Passed: ${results.length - failed.length}`);
  console.log(`  Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed checks:");
    for (const item of failed) {
      console.log(`  - [${item.id}] ${item.message}`);
    }
    process.exit(1);
  }

  console.log("\nAll automated Lexienn MVP verification checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
