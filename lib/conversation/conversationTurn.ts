import type { ConversationSpeaker, ConversationTurn } from "@/lib/conversation/conversationTypes";
import { isAutoDetectLanguage } from "@/lib/languages/spokenLanguageDetection";

export type ConversationLanguagePair = {
  personALanguage: string;
  personBLanguage: string;
};

/** Source language for the speaking side; target is the other side. */
export function resolveLanguagesForSpeaker(
  speaker: ConversationSpeaker,
  pair: ConversationLanguagePair,
): { sourceLanguage: string; targetLanguage: string } {
  if (speaker === "a") {
    return {
      sourceLanguage: pair.personALanguage,
      targetLanguage: pair.personBLanguage,
    };
  }
  return {
    sourceLanguage: pair.personBLanguage,
    targetLanguage: pair.personALanguage,
  };
}

/** Auto Detect / spoken detection must update only the active speaker side. */
export function applyDetectedLanguageToSide(
  speaker: ConversationSpeaker,
  pair: ConversationLanguagePair,
  detectedCatalogValue: string,
): ConversationLanguagePair {
  if (speaker === "a") {
    return { ...pair, personALanguage: detectedCatalogValue };
  }
  return { ...pair, personBLanguage: detectedCatalogValue };
}

export function swapConversationPair(pair: ConversationLanguagePair): ConversationLanguagePair {
  return {
    personALanguage: pair.personBLanguage,
    personBLanguage: pair.personALanguage,
  };
}

export function canTranslateSpeakerTurn(
  speaker: ConversationSpeaker,
  pair: ConversationLanguagePair,
): { ok: true } | { ok: false; reason: string } {
  const { sourceLanguage, targetLanguage } = resolveLanguagesForSpeaker(speaker, pair);
  if (isAutoDetectLanguage(sourceLanguage)) {
    return {
      ok: false,
      reason: "Select a language for the speaking side, or speak so Auto Detect can set it.",
    };
  }
  if (isAutoDetectLanguage(targetLanguage)) {
    return {
      ok: false,
      reason: "Select a language for the listening side before translating.",
    };
  }
  if (sourceLanguage === targetLanguage) {
    return { ok: false, reason: "Person A and Person B need different languages." };
  }
  return { ok: true };
}

export function createConversationTurn(input: {
  speaker: ConversationSpeaker;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  pronunciation?: string;
}): ConversationTurn {
  return {
    id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    speaker: input.speaker,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    sourceText: input.sourceText.trim(),
    translatedText: input.translatedText.trim(),
    pronunciation: input.pronunciation,
    createdAt: new Date().toISOString(),
  };
}

/** Playback locale is always the listener (target) side. */
export function voicePlaybackLanguageForTurn(turn: ConversationTurn): string {
  return turn.targetLanguage;
}
