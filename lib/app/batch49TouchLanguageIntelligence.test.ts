import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  getLanguageSelectGroups,
  LOCAL_DIALECTS_GROUP,
  NATIONAL_LANGUAGES_GROUP,
} from "@/lib/languages/languageOptions";
import { mapSpeechRecognitionLocale } from "@/lib/speech/speechRecognitionLocale";
import { PREFERRED_MIC_CONSTRAINTS } from "@/lib/speech/micAudioConstraints";
import { isRtlLanguageCode, languageTextDirection } from "@/lib/languages/languageDirection";

function isAlphabetized(labels: string[]): boolean {
  const sorted = [...labels].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  return labels.every((label, index) => label === sorted[index]);
}

describe("batch 49 mobile touch and language intelligence", () => {
  it("ActionButton and IconButton use ≥48px touch targets", () => {
    const action = readFileSync("components/ui/ActionButton.tsx", "utf8");
    const icon = readFileSync("components/ui/IconButton.tsx", "utf8");
    const nav = readFileSync("components/layout/MobileBottomNav.tsx", "utf8");
    const mic = readFileSync("components/speech/VoiceInputButton.tsx", "utf8");
    const capture = readFileSync("components/translator/ImageCaptureCard.tsx", "utf8");

    expect(action).toContain("min-h-12");
    expect(action).toContain("min-h-14");
    expect(icon).toContain("min-h-12");
    expect(nav).toContain("min-h-14");
    expect(mic).toContain("min-h-14");
    expect(capture).toContain("h-16 w-16");
  });

  it("mic capture uses quality constraints with safe fallback", () => {
    const constraints = readFileSync("lib/speech/micAudioConstraints.ts", "utf8");
    const preflight = readFileSync("lib/speech/requestMicPermission.ts", "utf8");
    const capture = readFileSync("lib/speech/audioCapture.ts", "utf8");
    expect(constraints).toContain("echoCancellation: true");
    expect(constraints).toContain("noiseSuppression: true");
    expect(constraints).toContain("autoGainControl: true");
    expect(PREFERRED_MIC_CONSTRAINTS.channelCount).toBe(1);
    expect(preflight).toContain("getMicrophoneStreamWithQuality");
    expect(capture).toContain("getMicrophoneStreamWithQuality");
  });

  it("speech recognition maps selected source locales", () => {
    expect(mapSpeechRecognitionLocale("en")).toBe("en-US");
    expect(mapSpeechRecognitionLocale("tl")).toBe("fil-PH");
    expect(mapSpeechRecognitionLocale("ga")).toBe("ga-IE");
    expect(mapSpeechRecognitionLocale("fa")).toBe("fa-IR");
    expect(mapSpeechRecognitionLocale("ur")).toBe("ur-PK");
    expect(mapSpeechRecognitionLocale("he")).toBe("he-IL");
    expect(mapSpeechRecognitionLocale("az")).toBe("az-AZ");
  });

  it("language selectors use exactly two alphabetized groups", () => {
    const groups = getLanguageSelectGroups();
    expect(groups.map((group) => group.label)).toEqual([
      NATIONAL_LANGUAGES_GROUP,
      LOCAL_DIALECTS_GROUP,
    ]);
    for (const group of groups) {
      expect(isAlphabetized(group.options.map((option) => option.label))).toBe(true);
    }
  });

  it("Irish and European nationals appear under National Languages", () => {
    const national = getLanguageSelectGroups().find(
      (group) => group.label === NATIONAL_LANGUAGES_GROUP,
    );
    const labels = national?.options.map((option) => option.label).join(" ") ?? "";
    for (const name of [
      "Irish",
      "Albanian",
      "Belarusian",
      "Bosnian",
      "Bulgarian",
      "Croatian",
      "Czech",
      "Danish",
      "Dutch",
      "Estonian",
      "Finnish",
      "Greek",
      "Hungarian",
      "Icelandic",
      "Latvian",
      "Lithuanian",
      "Macedonian",
      "Maltese",
      "Norwegian",
      "Polish",
      "Romanian",
      "Serbian",
      "Slovak",
      "Slovenian",
      "Swedish",
    ]) {
      expect(labels).toContain(name);
    }
  });

  it("local dialects group includes regional languages", () => {
    const local = getLanguageSelectGroups().find(
      (group) => group.label === LOCAL_DIALECTS_GROUP,
    );
    const labels = local?.options.map((option) => option.label).join(" ") ?? "";
    for (const name of ["Cebuano", "Catalan", "Welsh", "Basque", "Kapampangan"]) {
      expect(labels).toContain(name);
    }
  });

  it("language search works by native name and aliases", () => {
    const irish = getLanguageSelectGroups("Gaeilge");
    expect(irish.some((group) => group.options.some((option) => option.label.includes("Irish")))).toBe(
      true,
    );
    const farsi = getLanguageSelectGroups("Farsi");
    expect(
      farsi.some((group) => group.options.some((option) => /Persian|Farsi/i.test(option.label))),
    ).toBe(true);
    const azeri = getLanguageSelectGroups("Azeri");
    expect(
      azeri.some((group) => group.options.some((option) => /Azerbaijani|Azeri/i.test(option.label))),
    ).toBe(true);
    const bisaya = getLanguageSelectGroups("Bisaya");
    expect(bisaya.some((group) => group.options.some((option) => /Cebuano/i.test(option.label)))).toBe(
      true,
    );
  });

  it("RTL languages render with correct direction helpers", () => {
    expect(isRtlLanguageCode("fa")).toBe(true);
    expect(isRtlLanguageCode("ur")).toBe(true);
    expect(isRtlLanguageCode("he")).toBe(true);
    expect(isRtlLanguageCode("ar")).toBe(true);
    expect(languageTextDirection("en")).toBe("ltr");
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    const dictionary = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
    expect(translator).toContain("languageTextDirection");
    expect(dictionary).toContain("languageTextDirection");
  });

  it("Translate and Define prevent double-submit via busy/disabled controls", () => {
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    const dictionary = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
    expect(translator).toContain("disabled={isSubmitting");
    expect(translator).toContain("aria-busy={isSubmitting}");
    expect(dictionary).toContain("disabled={isSubmitting");
    expect(dictionary).toContain("aria-busy={isSubmitting}");
  });

  it("learning review card and vocabulary storage exist", () => {
    const card = readFileSync("components/library/VocabularyReviewCard.tsx", "utf8");
    const storage = readFileSync("lib/storage/vocabularyReviewStorage.ts", "utf8");
    const library = readFileSync("components/library/LibraryView.tsx", "utf8");
    expect(card).toContain("I know this");
    expect(card).toContain("Review again");
    expect(card).toContain("Favorite");
    expect(storage).toContain("buildReviewQueue");
    expect(library).toContain("VocabularyReviewCard");
  });

  it("translator shows quality details and literal note", () => {
    const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    expect(translator).toContain("Details");
    expect(translator).toContain("More natural");
    expect(translator).toContain("More literal");
    expect(translator).toContain(
      "Literal mode keeps closer phrase structure and may sound less natural.",
    );
  });

  it("define result collapses long example sets", () => {
    const card = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
    expect(card).toContain('summary="Examples"');
    expect(card).toContain("defaultOpen={enrichedEntry.examples.length <= 2}");
    expect(card).toContain('summary="Common mistakes"');
  });

  it("mic UX preserves typed text messaging and quality states", () => {
    const status = readFileSync("components/speech/VoiceInputStatus.tsx", "utf8");
    const hook = readFileSync("hooks/useVoiceInput.ts", "utf8");
    expect(status).toContain("Use typed text");
    expect(hook).toContain("No speech detected");
    expect(hook).toContain("Permission blocked");
  });
});
