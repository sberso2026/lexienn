import type { SavedWord } from "@/lib/schemas";
import { loadSavedWords } from "@/lib/storage/savedWordsStorage";
import { loadSavedPhrases, type SavedPhrase } from "@/lib/storage/savedPhrasesStorage";

export const VOCABULARY_REVIEW_STORAGE_KEY = "lexienn_vocabulary_review";

export type ReviewItemKind = "word" | "phrase";

export type ReviewProgress = {
  favorites: string[];
  known: string[];
  reviewAgain: string[];
  lastReviewedAt?: string;
};

const DEFAULT_PROGRESS: ReviewProgress = {
  favorites: [],
  known: [],
  reviewAgain: [],
};

function reviewKey(kind: ReviewItemKind, id: string): string {
  return `${kind}:${id}`;
}

export function loadReviewProgress(): ReviewProgress {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = localStorage.getItem(VOCABULARY_REVIEW_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<ReviewProgress>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      known: Array.isArray(parsed.known) ? parsed.known : [],
      reviewAgain: Array.isArray(parsed.reviewAgain) ? parsed.reviewAgain : [],
      lastReviewedAt: typeof parsed.lastReviewedAt === "string" ? parsed.lastReviewedAt : undefined,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function persist(progress: ReviewProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOCABULARY_REVIEW_STORAGE_KEY, JSON.stringify(progress));
}

export function markReviewKnown(kind: ReviewItemKind, id: string): void {
  const progress = loadReviewProgress();
  const key = reviewKey(kind, id);
  progress.known = [...new Set([...progress.known, key])];
  progress.reviewAgain = progress.reviewAgain.filter((item) => item !== key);
  progress.lastReviewedAt = new Date().toISOString();
  persist(progress);
}

export function markReviewAgain(kind: ReviewItemKind, id: string): void {
  const progress = loadReviewProgress();
  const key = reviewKey(kind, id);
  progress.reviewAgain = [...new Set([...progress.reviewAgain, key])];
  progress.known = progress.known.filter((item) => item !== key);
  progress.lastReviewedAt = new Date().toISOString();
  persist(progress);
}

export function toggleReviewFavorite(kind: ReviewItemKind, id: string): boolean {
  const progress = loadReviewProgress();
  const key = reviewKey(kind, id);
  const isFavorite = progress.favorites.includes(key);
  progress.favorites = isFavorite
    ? progress.favorites.filter((item) => item !== key)
    : [...progress.favorites, key];
  persist(progress);
  return !isFavorite;
}

export function isReviewFavorite(kind: ReviewItemKind, id: string): boolean {
  return loadReviewProgress().favorites.includes(reviewKey(kind, id));
}

export type ReviewCardItem = {
  id: string;
  kind: ReviewItemKind;
  front: string;
  back: string;
};

export function buildReviewQueue(): ReviewCardItem[] {
  const progress = loadReviewProgress();
  const words = loadSavedWords().map(
    (word: SavedWord): ReviewCardItem => ({
      id: word.id,
      kind: "word",
      front: word.input_text,
      back: word.target_meaning || word.short_meaning || "",
    }),
  );
  const phrases = loadSavedPhrases().map(
    (phrase: SavedPhrase): ReviewCardItem => ({
      id: phrase.id,
      kind: "phrase",
      front: phrase.sourceText,
      back: phrase.translatedText,
    }),
  );

  const all = [...words, ...phrases].filter((item) => item.front.trim() && item.back.trim());
  const again = all.filter((item) =>
    progress.reviewAgain.includes(reviewKey(item.kind, item.id)),
  );
  const rest = all.filter(
    (item) =>
      !progress.known.includes(reviewKey(item.kind, item.id)) &&
      !progress.reviewAgain.includes(reviewKey(item.kind, item.id)),
  );
  const recent = [...all].reverse().slice(0, 8);

  const queue: ReviewCardItem[] = [];
  const seen = new Set<string>();
  for (const item of [...again, ...rest, ...recent]) {
    const key = reviewKey(item.kind, item.id);
    if (seen.has(key)) continue;
    seen.add(key);
    queue.push(item);
  }
  return queue;
}

export function shouldShowDailyReviewPrompt(): boolean {
  const progress = loadReviewProgress();
  const hasItems = buildReviewQueue().length > 0;
  if (!hasItems) return false;
  if (!progress.lastReviewedAt) return true;
  const last = Date.parse(progress.lastReviewedAt);
  if (Number.isNaN(last)) return true;
  return Date.now() - last > 20 * 60 * 60 * 1000;
}
