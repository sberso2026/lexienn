import type { ConversationSession, ConversationTurn } from "@/lib/conversation/conversationTypes";

export const CONVERSATION_STORAGE_KEY = "lexienn_saved_conversations";
export const CONVERSATION_SAVED_EVENT = "lexienn:saved-conversations-updated";

export function loadSavedConversations(): ConversationSession[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CONVERSATION_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as ConversationSession[]) : [];
  } catch {
    return [];
  }
}

/**
 * Explicit user action only — never auto-save conversations.
 */
export function saveConversationSession(input: {
  personALanguage: string;
  personBLanguage: string;
  turns: ConversationTurn[];
  title?: string;
}): "saved" | "empty" | "error" {
  if (input.turns.length === 0) return "empty";
  if (typeof window === "undefined") return "error";
  try {
    const next: ConversationSession = {
      id: `conversation-${Date.now()}`,
      personALanguage: input.personALanguage,
      personBLanguage: input.personBLanguage,
      turns: input.turns,
      savedAt: new Date().toISOString(),
      title: input.title,
    };
    const existing = loadSavedConversations();
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify([next, ...existing]));
    window.dispatchEvent(new Event(CONVERSATION_SAVED_EVENT));
    return "saved";
  } catch {
    return "error";
  }
}
