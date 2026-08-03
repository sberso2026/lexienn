export type ConversationSpeaker = "a" | "b";

export type ConversationTurn = {
  id: string;
  speaker: ConversationSpeaker;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  pronunciation?: string;
  createdAt: string;
};

export type ConversationSession = {
  id: string;
  personALanguage: string;
  personBLanguage: string;
  turns: ConversationTurn[];
  savedAt: string;
  title?: string;
};

export type ConversationIntelligenceOffer =
  | "save_phrases"
  | "add_words_to_library"
  | "add_glossary_terms"
  | "bilingual_summary";

export const CONVERSATION_INTELLIGENCE_OFFERS: Array<{
  id: ConversationIntelligenceOffer;
  label: string;
  description: string;
}> = [
  {
    id: "save_phrases",
    label: "Save useful phrases",
    description: "Keep key bilingual lines in Library.",
  },
  {
    id: "add_words_to_library",
    label: "Add unfamiliar words",
    description: "Review words from this talk later.",
  },
  {
    id: "add_glossary_terms",
    label: "Add professional terms",
    description: "Capture work terms for your glossary.",
  },
  {
    id: "bilingual_summary",
    label: "Short bilingual summary",
    description: "Generate a brief A↔B summary of the talk.",
  },
];
