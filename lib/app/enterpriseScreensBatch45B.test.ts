import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

describe("Batch 45B enterprise screen polish", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Define renders an enterprise input card with voice and compact options", () => {
    const form = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    expect(form).toContain("enterprise-card");
    expect(form).toContain("Search a word or phrase…");
    expect(form).toContain("VoiceInputTextArea");
    expect(form).toContain("Options ·");
    expect(form).toContain('disabled={isSubmitting || form.input_text.trim().length === 0}');
  });

  it("Define result renders a Meaning card for resolved entries", () => {
    const result = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
    expect(result).toContain('<SectionCard title="Meaning"');
    expect(result).toContain("enrichedEntry.general_meaning_en");
    expect(result).toContain("source !== \"unavailable\"");
  });

  it("English-to-English does not require a translation section", () => {
    const result = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
    expect(result).toContain("isEnglishToEnglishQuery(query)");
    expect(result).toContain("!isDefinitionRequest && enrichedEntry.target_meaning");
  });

  it("Translate disables submit with empty input", () => {
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(translator).toContain('disabled={isSubmitting || sentence.trim().length === 0}');
    expect(translator).toContain("Speak or type sentence…");
  });

  it("Translate renders translated text and enterprise actions", () => {
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(translator).toContain("result.translated_text");
    for (const action of [
      "Play translation audio",
      "Copy translation",
      "Save translation",
      "Explain translation",
    ]) {
      expect(translator).toContain(action);
    }
  });

  it("Lens renders Scan Text, Import Image, and History", () => {
    const lens = readFileSync("components/lens/LensView.tsx", "utf8");
    expect(lens).toContain("Scan Text");
    expect(lens).toContain("Import Image");
    expect(lens).toContain("History");
  });

  it("Lens provides a graceful camera and OCR fallback", () => {
    const capture = readFileSync("components/translator/ImageCaptureCard.tsx", "utf8");
    const camera = readFileSync("components/translator/CameraTranslatorView.tsx", "utf8");
    expect(capture).toContain("Import an image or type the text manually.");
    expect(camera).toContain("type the text manually");
  });

  it("Library renders all memory sections with counts and empty states", () => {
    const library = readFileSync("components/library/LibraryView.tsx", "utf8");
    for (const section of [
      "Saved Words",
      "Saved Phrases",
      "Offline Packs",
      "Profession Packs",
      "Recent Searches",
      "Favorites",
    ]) {
      expect(library).toContain(section);
    }
    expect(library).toContain("No saved words yet");
    expect(library).toContain("No saved phrases yet");
    expect(library).toContain("No offline packs downloaded");
  });

  it("Offline pack cards expose downloaded, available, and update states", () => {
    const library = readFileSync("components/library/LibraryView.tsx", "utf8");
    expect(library).toContain("Downloaded");
    expect(library).toContain("Available");
    expect(library).toContain("Update available");
    expect(library).toContain("audio clips");
  });

  it("More hides Developer Diagnostics when Developer Mode is false", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");
    const more = readFileSync("components/settings/MoreSettingsView.tsx", "utf8");
    expect(isDeveloperModeFeatureEnabled()).toBe(false);
    expect(more).toContain("isDeveloperModeFeatureEnabled() &&");
  });

  it("More exposes App Experience and Voice & Microphone", () => {
    const more = readFileSync("components/settings/MoreSettingsView.tsx", "utf8");
    expect(more).toContain("AppExperienceSettings");
    expect(more).toContain('title="Voice & Microphone"');
    expect(more).toContain("Microphone test");
  });

  it("bottom navigation retains the five enterprise routes", () => {
    const nav = readFileSync("lib/navigation/navConfig.tsx", "utf8");
    for (const href of ["/dictionary", "/translator", "/lens", "/library", "/more"]) {
      expect(nav).toContain(`href: "${href}"`);
    }
  });

  it("keeps the mobile install gate blocking flow", () => {
    const shell = readFileSync("components/AppShell.tsx", "utf8");
    expect(shell).toContain("shouldShowMobileInstallGate");
    expect(shell).toContain("<MobileInstallGate");
  });

  it("keeps launch animation limited to standalone mode", () => {
    const launch = readFileSync("lib/launch/shouldShowLaunchScreen.ts", "utf8");
    expect(launch).toContain("!isStandaloneApp()");
  });

  it("keeps service worker API and Next asset cache exclusions", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('url.pathname.startsWith("/_next/")');
  });
});
