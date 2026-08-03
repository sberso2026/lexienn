import { describe, expect, it } from "vitest";
import {
  applyDetectedLanguageToSide,
  canTranslateSpeakerTurn,
  createConversationTurn,
  resolveLanguagesForSpeaker,
  swapConversationPair,
  voicePlaybackLanguageForTurn,
} from "@/lib/conversation/conversationTurn";
import { AUTO_DETECT_LANGUAGE } from "@/lib/languages/spokenLanguageDetection";
import { saveConversationSession } from "@/lib/conversation/conversationStorage";

describe("Batch 51D conversation turn logic", () => {
  it("keeps Person A and Person B languages separate", () => {
    const pair = { personALanguage: "en", personBLanguage: "mi" };
    expect(resolveLanguagesForSpeaker("a", pair)).toEqual({
      sourceLanguage: "en",
      targetLanguage: "mi",
    });
    expect(resolveLanguagesForSpeaker("b", pair)).toEqual({
      sourceLanguage: "mi",
      targetLanguage: "en",
    });
  });

  it("updates only the active speaker side on detection", () => {
    const pair = {
      personALanguage: AUTO_DETECT_LANGUAGE,
      personBLanguage: "tl",
    };
    const nextA = applyDetectedLanguageToSide("a", pair, "mi");
    expect(nextA.personALanguage).toBe("mi");
    expect(nextA.personBLanguage).toBe("tl");

    const nextB = applyDetectedLanguageToSide("b", pair, "en");
    expect(nextB.personALanguage).toBe(AUTO_DETECT_LANGUAGE);
    expect(nextB.personBLanguage).toBe("en");
  });

  it("plays voice using the listener (target) locale", () => {
    const turn = createConversationTurn({
      speaker: "a",
      sourceLanguage: "en",
      targetLanguage: "mi",
      sourceText: "Hello",
      translatedText: "Kia ora",
    });
    expect(voicePlaybackLanguageForTurn(turn)).toBe("mi");
  });

  it("operates without automatic turn detection (manual gate only)", () => {
    expect(
      canTranslateSpeakerTurn("a", {
        personALanguage: "en",
        personBLanguage: "mi",
      }).ok,
    ).toBe(true);
    expect(
      canTranslateSpeakerTurn("a", {
        personALanguage: AUTO_DETECT_LANGUAGE,
        personBLanguage: "mi",
      }).ok,
    ).toBe(false);
  });

  it("requires explicit save and rejects empty transcripts", () => {
    expect(
      saveConversationSession({
        personALanguage: "en",
        personBLanguage: "mi",
        turns: [],
      }),
    ).toBe("empty");
  });

  it("reverses the language pair without mixing speaker roles in storage keys", () => {
    const swapped = swapConversationPair({
      personALanguage: "en",
      personBLanguage: "mi",
    });
    expect(swapped).toEqual({ personALanguage: "mi", personBLanguage: "en" });
  });
});
