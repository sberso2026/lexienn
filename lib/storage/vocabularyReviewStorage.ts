import type { SavedWord } from "@/lib/schemas";
import type {
  LearningSource,
  ReviewGrade,
  ReviewItemKind,
} from "@/lib/storage/learningTypes";
import { loadSavedWords } from "@/lib/storage/savedWordsStorage";
import { loadSavedPhrases, type SavedPhrase } from "@/lib/storage/savedPhrasesStorage";

export type {
  LearningSource,
  PracticeMode,
  ReviewGrade,
  ReviewItemKind,
} from "@/lib/storage/learningTypes";

export const VOCABULARY_REVIEW_STORAGE_KEY = "lexienn_vocabulary_review";
export const VOCABULARY_REVIEW_ITEMS_KEY = "lexienn_vocabulary_review_items";
export const VOCABULARY_REVIEW_UPDATED_EVENT = "lexienn:vocabulary-review-updated";
export type ReviewProgress = {
  favorites: string[];
  known: string[];
  reviewAgain: string[];
  lastReviewedAt?: string;
};

export type ReviewItemRecord = {
  key: string;
  kind: ReviewItemKind;
  id: string;
  front: string;
  back: string;
  source: LearningSource;
  userContext?: string;
  firstSeenAt: string;
  lastReviewedAt?: string;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  difficulty: number;
  nextReviewAt: string;
  workspaceId?: string;
};

const DEFAULT_PROGRESS: ReviewProgress = {
  favorites: [],
  known: [],
  reviewAgain: [],
};

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

export function reviewKey(kind: ReviewItemKind, id: string): string {
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

function persistProgress(progress: ReviewProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOCABULARY_REVIEW_STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event(VOCABULARY_REVIEW_UPDATED_EVENT));
}

export function loadReviewItemRecords(): ReviewItemRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VOCABULARY_REVIEW_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ReviewItemRecord =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as ReviewItemRecord).key === "string" &&
        typeof (item as ReviewItemRecord).front === "string" &&
        typeof (item as ReviewItemRecord).back === "string",
    );
  } catch {
    return [];
  }
}

function persistReviewItems(items: ReviewItemRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOCABULARY_REVIEW_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(VOCABULARY_REVIEW_UPDATED_EVENT));
}

function scheduleNextReview(grade: ReviewGrade, difficulty: number, reviewCount: number): {
  nextReviewAt: string;
  difficulty: number;
} {
  const now = Date.now();
  let nextDifficulty = difficulty;
  let delay = MS_HOUR;

  switch (grade) {
    case "again":
      nextDifficulty = Math.min(5, difficulty + 1);
      delay = 10 * 60 * 1000;
      break;
    case "hard":
      nextDifficulty = Math.min(5, difficulty + 0.5);
      delay = 12 * MS_HOUR;
      break;
    case "good":
      nextDifficulty = Math.max(1, difficulty - 0.25);
      delay = (reviewCount <= 1 ? 1 : Math.min(7, reviewCount)) * MS_DAY;
      break;
    case "easy":
      nextDifficulty = Math.max(1, difficulty - 0.75);
      delay = Math.min(21, Math.max(2, reviewCount + 1)) * MS_DAY;
      break;
  }

  return {
    difficulty: Number(nextDifficulty.toFixed(2)),
    nextReviewAt: new Date(now + delay).toISOString(),
  };
}

export function registerLearningItem(input: {
  kind: ReviewItemKind;
  id: string;
  front: string;
  back: string;
  source: LearningSource;
  userContext?: string;
}): ReviewItemRecord | null {
  if (typeof window === "undefined") return null;
  const front = input.front.trim();
  const back = input.back.trim();
  if (!front || !back) return null;

  const key = reviewKey(input.kind, input.id);
  const items = loadReviewItemRecords();
  const existing = items.find((item) => item.key === key);
  const now = new Date().toISOString();

  if (existing) {
    const next: ReviewItemRecord = {
      ...existing,
      front,
      back,
      source: input.source,
      userContext: input.userContext ?? existing.userContext,
    };
    persistReviewItems(items.map((item) => (item.key === key ? next : item)));
    return next;
  }

  const created: ReviewItemRecord = {
    key,
    kind: input.kind,
    id: input.id,
    front,
    back,
    source: input.source,
    userContext: input.userContext,
    firstSeenAt: now,
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    difficulty: 3,
    nextReviewAt: now,
  };
  persistReviewItems([created, ...items]);
  return created;
}

export function applyReviewGrade(
  kind: ReviewItemKind,
  id: string,
  grade: ReviewGrade,
): void {
  const key = reviewKey(kind, id);
  const progress = loadReviewProgress();
  const items = loadReviewItemRecords();
  const item = items.find((entry) => entry.key === key);
  const now = new Date().toISOString();

  if (grade === "again" || grade === "hard") {
    progress.reviewAgain = [...new Set([...progress.reviewAgain, key])];
    progress.known = progress.known.filter((entry) => entry !== key);
  } else {
    progress.known = [...new Set([...progress.known, key])];
    progress.reviewAgain = progress.reviewAgain.filter((entry) => entry !== key);
  }
  progress.lastReviewedAt = now;
  persistProgress(progress);

  if (!item) return;

  const reviewCount = item.reviewCount + 1;
  const schedule = scheduleNextReview(grade, item.difficulty, reviewCount);
  const next: ReviewItemRecord = {
    ...item,
    lastReviewedAt: now,
    reviewCount,
    correctCount: item.correctCount + (grade === "good" || grade === "easy" ? 1 : 0),
    incorrectCount: item.incorrectCount + (grade === "again" || grade === "hard" ? 1 : 0),
    difficulty: schedule.difficulty,
    nextReviewAt: schedule.nextReviewAt,
  };
  persistReviewItems(items.map((entry) => (entry.key === key ? next : entry)));
}

/** @deprecated Prefer applyReviewGrade("good") */
export function markReviewKnown(kind: ReviewItemKind, id: string): void {
  applyReviewGrade(kind, id, "good");
}

/** @deprecated Prefer applyReviewGrade("again") */
export function markReviewAgain(kind: ReviewItemKind, id: string): void {
  applyReviewGrade(kind, id, "again");
}

export function toggleReviewFavorite(kind: ReviewItemKind, id: string): boolean {
  const progress = loadReviewProgress();
  const key = reviewKey(kind, id);
  const isFavorite = progress.favorites.includes(key);
  progress.favorites = isFavorite
    ? progress.favorites.filter((item) => item !== key)
    : [...progress.favorites, key];
  persistProgress(progress);
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
  source?: LearningSource;
  userContext?: string;
  difficulty?: number;
};

function fromSavedLibraries(): ReviewCardItem[] {
  const words = loadSavedWords().map(
    (word: SavedWord): ReviewCardItem => ({
      id: word.id,
      kind: "word",
      front: word.input_text,
      back: word.target_meaning || word.short_meaning || "",
      source: "define",
      userContext: word.user_context,
    }),
  );
  const phrases = loadSavedPhrases().map(
    (phrase: SavedPhrase): ReviewCardItem => ({
      id: phrase.id,
      kind: "phrase",
      front: phrase.sourceText,
      back: phrase.translatedText,
      source: phrase.source ?? "translate",
      userContext: phrase.userContext,
    }),
  );
  return [...words, ...phrases].filter((item) => item.front.trim() && item.back.trim());
}

export function buildReviewQueue(filter?: {
  source?: LearningSource | "all";
  onlyDue?: boolean;
  onlyDifficult?: boolean;
  onlyFavorites?: boolean;
  onlyRecentlyLearned?: boolean;
}): ReviewCardItem[] {
  const progress = loadReviewProgress();
  const records = loadReviewItemRecords();
  const library = fromSavedLibraries();
  const now = Date.now();

  const byKey = new Map<string, ReviewCardItem>();
  for (const item of library) {
    byKey.set(reviewKey(item.kind, item.id), item);
  }
  for (const record of records) {
    byKey.set(record.key, {
      id: record.id,
      kind: record.kind,
      front: record.front,
      back: record.back,
      source: record.source,
      userContext: record.userContext,
      difficulty: record.difficulty,
    });
  }

  let items = [...byKey.values()];

  if (filter?.source && filter.source !== "all") {
    items = items.filter((item) => item.source === filter.source);
  }
  if (filter?.onlyFavorites) {
    items = items.filter((item) =>
      progress.favorites.includes(reviewKey(item.kind, item.id)),
    );
  }
  if (filter?.onlyDifficult) {
    items = items.filter((item) => {
      const key = reviewKey(item.kind, item.id);
      const record = records.find((entry) => entry.key === key);
      return (
        progress.reviewAgain.includes(key) ||
        (record != null && record.difficulty >= 3.5) ||
        (item.difficulty != null && item.difficulty >= 3.5)
      );
    });
  }
  if (filter?.onlyRecentlyLearned) {
    items = items
      .map((item) => {
        const record = records.find((entry) => entry.key === reviewKey(item.kind, item.id));
        return { item, firstSeenAt: record?.firstSeenAt };
      })
      .filter((entry) => entry.firstSeenAt)
      .sort((a, b) => String(b.firstSeenAt).localeCompare(String(a.firstSeenAt)))
      .slice(0, 12)
      .map((entry) => entry.item);
  }
  if (filter?.onlyDue) {
    items = items.filter((item) => {
      const record = records.find((entry) => entry.key === reviewKey(item.kind, item.id));
      if (!record) return true;
      return Date.parse(record.nextReviewAt) <= now;
    });
  }

  if (filter?.onlyRecentlyLearned || filter?.onlyDifficult || filter?.onlyFavorites) {
    return items;
  }

  const again = items.filter((item) =>
    progress.reviewAgain.includes(reviewKey(item.kind, item.id)),
  );
  const rest = items.filter(
    (item) =>
      !progress.known.includes(reviewKey(item.kind, item.id)) &&
      !progress.reviewAgain.includes(reviewKey(item.kind, item.id)),
  );
  const recent = [...items].reverse().slice(0, 8);

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
  const hasItems = buildReviewQueue({ onlyDue: true }).length > 0;
  if (!hasItems) return false;
  if (!progress.lastReviewedAt) return true;
  const last = Date.parse(progress.lastReviewedAt);
  if (Number.isNaN(last)) return true;
  return Date.now() - last > 20 * MS_HOUR;
}

export type LearningProgressStats = {
  vocabularyRetained: number;
  phrasesReviewed: number;
  pronunciationAttempts: number;
  professionalTermsLearned: number;
  dueCount: number;
  favoriteCount: number;
  difficultCount: number;
};

export function getLearningProgressStats(): LearningProgressStats {
  const progress = loadReviewProgress();
  const records = loadReviewItemRecords();
  const dueCount = buildReviewQueue({ onlyDue: true }).length;
  const difficultCount = buildReviewQueue({ onlyDifficult: true }).length;
  const professionalTermsLearned = records.filter((item) =>
    Boolean(
      item.userContext &&
        ["engineer", "construction_worker", "health_emergency", "business_owner"].includes(
          item.userContext,
        ),
    ),
  ).length;

  return {
    vocabularyRetained: progress.known.length,
    phrasesReviewed: records.filter((item) => item.kind === "phrase" && item.reviewCount > 0)
      .length,
    pronunciationAttempts: records.reduce((sum, item) => sum + item.reviewCount, 0),
    professionalTermsLearned,
    dueCount,
    favoriteCount: progress.favorites.length,
    difficultCount,
  };
}
