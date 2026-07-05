import { SAVED_WORDS_STORAGE_KEY } from "./constants";
import {
  createSavedWordFromResult,
  savedWordMatchKey,
} from "@/lib/dictionary/toSavedWord";
import type { DictionaryEntry, DictionaryQuery, SavedWord } from "@/lib/schemas";
import { savedWordSchema } from "@/lib/schemas";

export type SavedWordFilters = {
  search: string;
  target_language: string;
  user_context: string;
  entry_type: string;
};

export const DEFAULT_SAVED_WORD_FILTERS: SavedWordFilters = {
  search: "",
  target_language: "all",
  user_context: "all",
  entry_type: "all",
};

function parseSavedWords(raw: string | null): SavedWord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => savedWordSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
}

export function loadSavedWords(): SavedWord[] {
  if (typeof window === "undefined") return [];
  return parseSavedWords(localStorage.getItem(SAVED_WORDS_STORAGE_KEY));
}

function persistSavedWords(words: SavedWord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_WORDS_STORAGE_KEY, JSON.stringify(words));
}

export function isSavedWordDuplicate(
  word: Pick<
    SavedWord,
    "input_text" | "target_language" | "target_dialect" | "user_context"
  >,
  words: SavedWord[] = loadSavedWords(),
): boolean {
  const key = savedWordMatchKey(word);
  return words.some((existing) => savedWordMatchKey(existing) === key);
}

export type SaveWordResult =
  | { ok: true; word: SavedWord }
  | { ok: false; reason: "duplicate" }
  | { ok: false; reason: "error" };

export function saveWordFromDictionaryResult(
  entry: DictionaryEntry,
  query: DictionaryQuery,
): SaveWordResult {
  try {
    const word = createSavedWordFromResult(entry, query);
    const words = loadSavedWords();

    if (isSavedWordDuplicate(word, words)) {
      return { ok: false, reason: "duplicate" };
    }

    persistSavedWords([word, ...words]);
    return { ok: true, word };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function removeSavedWord(id: string): boolean {
  const words = loadSavedWords();
  const next = words.filter((word) => word.id !== id);

  if (next.length === words.length) {
    return false;
  }

  persistSavedWords(next);
  return true;
}

export function filterSavedWords(
  words: SavedWord[],
  filters: SavedWordFilters,
): SavedWord[] {
  const search = filters.search.trim().toLowerCase();

  return words.filter((word) => {
    if (
      filters.target_language !== "all" &&
      word.target_language !== filters.target_language
    ) {
      return false;
    }

    if (
      filters.user_context !== "all" &&
      word.user_context !== filters.user_context
    ) {
      return false;
    }

    if (filters.entry_type !== "all" && word.entry_type !== filters.entry_type) {
      return false;
    }

    if (!search) return true;

    const haystack = [
      word.input_text,
      word.short_meaning,
      word.target_meaning,
      word.pronunciation_simple,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function exportSavedWordsJson(words: SavedWord[] = loadSavedWords()): string {
  return JSON.stringify(words, null, 2);
}

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportSavedWordsCsv(words: SavedWord[] = loadSavedWords()): string {
  const headers = [
    "id",
    "input_text",
    "entry_type",
    "target_language",
    "target_dialect",
    "user_context",
    "short_meaning",
    "target_meaning",
    "pronunciation_simple",
    "saved_at",
    "validation_status",
    "confidence_score",
  ];

  const rows = words.map((word) =>
    [
      word.id,
      word.input_text,
      word.entry_type,
      word.target_language,
      word.target_dialect ?? "",
      word.user_context,
      word.short_meaning,
      word.target_meaning,
      word.pronunciation_simple,
      word.saved_at,
      word.validation_status,
      String(word.confidence_score),
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
