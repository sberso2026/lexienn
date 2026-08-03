"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { isAdvancedLearningEnabled } from "@/lib/config/featureFlags";
import {
  applyReviewGrade,
  buildReviewQueue,
  getLearningProgressStats,
  isReviewFavorite,
  shouldShowDailyReviewPrompt,
  toggleReviewFavorite,
  type LearningSource,
  type PracticeMode,
  type ReviewCardItem,
  type ReviewGrade,
  VOCABULARY_REVIEW_UPDATED_EVENT,
} from "@/lib/storage/vocabularyReviewStorage";

const SOURCE_FILTERS: Array<{ id: LearningSource | "all"; label: string }> = [
  { id: "all", label: "Review queue" },
  { id: "define", label: "Define" },
  { id: "translate", label: "Translate" },
  { id: "lens", label: "Lens" },
  { id: "conversation", label: "Conversation" },
  { id: "offline", label: "Offline" },
];

const PRACTICE_MODES: Array<{ id: PracticeMode; label: string }> = [
  { id: "flashcard", label: "Flashcard" },
  { id: "choose_translation", label: "Choose translation" },
  { id: "listen_type", label: "Listen then type" },
  { id: "read_speak", label: "Read then speak" },
  { id: "recall_context", label: "Recall from context" },
];

const GRADES: Array<{ id: ReviewGrade; label: string }> = [
  { id: "again", label: "Again" },
  { id: "hard", label: "Hard" },
  { id: "good", label: "Good" },
  { id: "easy", label: "Easy" },
];

export function VocabularyReviewCard() {
  const [queue, setQueue] = useState<ReviewCardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<LearningSource | "all">("all");
  const [listMode, setListMode] = useState<"queue" | "recent" | "difficult" | "favorites">(
    "queue",
  );
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("flashcard");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [choiceFeedback, setChoiceFeedback] = useState<string | null>(null);
  const [stats, setStats] = useState(() => getLearningProgressStats());

  const refresh = useCallback(() => {
    const next = buildReviewQueue({
      source: sourceFilter,
      onlyDue: listMode === "queue",
      onlyRecentlyLearned: listMode === "recent",
      onlyDifficult: listMode === "difficult",
      onlyFavorites: listMode === "favorites",
    });
    setQueue(next);
    setIndex(0);
    setFlipped(false);
    setTypedAnswer("");
    setChoiceFeedback(null);
    setShowPrompt(shouldShowDailyReviewPrompt());
    setStats(getLearningProgressStats());
    if (next[0]) {
      setFavorite(isReviewFavorite(next[0].kind, next[0].id));
    }
  }, [listMode, sourceFilter]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(VOCABULARY_REVIEW_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(VOCABULARY_REVIEW_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const current = queue[index];

  const choices = useMemo(() => {
    if (!current || practiceMode !== "choose_translation") return [];
    const distractors = queue
      .filter((item) => item.id !== current.id)
      .map((item) => item.back)
      .filter(Boolean)
      .slice(0, 3);
    const options = [...distractors, current.back];
    return [...new Set(options)].sort(() => Math.random() - 0.5).slice(0, 4);
  }, [current, practiceMode, queue]);

  const advance = () => {
    setFlipped(false);
    setTypedAnswer("");
    setChoiceFeedback(null);
    setIndex((value) => {
      const nextIndex = value + 1;
      if (nextIndex >= queue.length) {
        refresh();
        return 0;
      }
      const nextItem = queue[nextIndex];
      if (nextItem) setFavorite(isReviewFavorite(nextItem.kind, nextItem.id));
      return nextIndex;
    });
  };

  const gradeCurrent = (grade: ReviewGrade) => {
    if (!current) return;
    applyReviewGrade(current.kind, current.id, grade);
    advance();
  };

  if (!isAdvancedLearningEnabled()) {
    return null;
  }

  if (!current) {
    return (
      <CompactCard className="enterprise-card space-y-3">
        <p className="text-sm font-semibold">Learning practice</p>
        <p className="text-xs text-[var(--muted)]">
          Save words or phrases from Define, Translate, Lens, Conversation, or Offline to build a
          review queue.
        </p>
        <LearningStatsStrip stats={stats} />
      </CompactCard>
    );
  }

  return (
    <CompactCard className="enterprise-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Learning practice</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {showPrompt
              ? "A short local review is ready when you are."
              : `${index + 1} of ${queue.length} · spaced review stays on-device`}
          </p>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          {current.source ?? current.kind}
        </span>
      </div>

      <LearningStatsStrip stats={stats} />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["queue", "Due"],
            ["recent", "Recently learned"],
            ["difficult", "Difficult"],
            ["favorites", "Favorites"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setListMode(id)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-semibold touch-manipulation ${
              listMode === id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--card-border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SOURCE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setSourceFilter(filter.id)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-semibold touch-manipulation ${
              sourceFilter === filter.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--card-border)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PRACTICE_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => {
              setPracticeMode(mode.id);
              setFlipped(false);
              setTypedAnswer("");
              setChoiceFeedback(null);
            }}
            className={`min-h-11 rounded-xl border px-3 text-xs font-semibold touch-manipulation ${
              practiceMode === mode.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--card-border)]"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {practiceMode === "flashcard" || practiceMode === "recall_context" ? (
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-5 text-center touch-manipulation active:scale-[0.99]"
          aria-label={flipped ? "Hide meaning" : "Reveal meaning"}
        >
          <p className="text-base font-semibold leading-relaxed">
            {flipped
              ? current.back
              : practiceMode === "recall_context"
                ? `In context: how do you say “${current.front}”?`
                : current.front}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {flipped ? "Meaning" : "Tap to reveal"}
          </p>
        </button>
      ) : null}

      {practiceMode === "choose_translation" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{current.front}</p>
          <div className="grid gap-2">
            {choices.map((choice) => (
              <ActionButton
                key={choice}
                type="button"
                variant="secondary"
                className="!min-h-12 !justify-start"
                onClick={() => {
                  const correct = choice === current.back;
                  setChoiceFeedback(correct ? "Correct" : "Try again");
                  applyReviewGrade(current.kind, current.id, correct ? "good" : "again");
                  if (correct) window.setTimeout(advance, 450);
                }}
              >
                {choice}
              </ActionButton>
            ))}
          </div>
          {choiceFeedback && (
            <p className="text-xs text-[var(--muted)]" role="status">
              {choiceFeedback}
            </p>
          )}
        </div>
      ) : null}

      {practiceMode === "listen_type" || practiceMode === "read_speak" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {practiceMode === "listen_type"
              ? `Listen in your mind, then type: ${current.front}`
              : `Read aloud, then confirm: ${current.front}`}
          </p>
          {practiceMode === "listen_type" ? (
            <input
              value={typedAnswer}
              onChange={(event) => setTypedAnswer(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 text-sm"
              placeholder="Type the translation"
              aria-label="Type translation"
            />
          ) : (
            <p className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-3 text-sm">
              Target: {current.back}
            </p>
          )}
          <ActionButton
            type="button"
            variant="secondary"
            className="!min-h-12"
            onClick={() => {
              if (practiceMode === "listen_type") {
                const ok =
                  typedAnswer.trim().toLowerCase() === current.back.trim().toLowerCase();
                applyReviewGrade(current.kind, current.id, ok ? "good" : "again");
              } else {
                applyReviewGrade(current.kind, current.id, "good");
              }
              advance();
            }}
          >
            Check / continue
          </ActionButton>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GRADES.map((grade) => (
          <ActionButton
            key={grade.id}
            type="button"
            variant="secondary"
            className="!min-h-12 text-xs"
            onClick={() => gradeCurrent(grade.id)}
          >
            {grade.label}
          </ActionButton>
        ))}
      </div>

      <ActionButton
        type="button"
        variant={favorite ? "primary" : "secondary"}
        className="!min-h-12"
        onClick={() => {
          const next = toggleReviewFavorite(current.kind, current.id);
          setFavorite(next);
        }}
      >
        {favorite ? "Favorited" : "Favorite"}
      </ActionButton>
    </CompactCard>
  );
}

function LearningStatsStrip({
  stats,
}: {
  stats: ReturnType<typeof getLearningProgressStats>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--muted)] sm:grid-cols-4">
      <Stat label="Retained" value={stats.vocabularyRetained} />
      <Stat label="Phrases reviewed" value={stats.phrasesReviewed} />
      <Stat label="Practice attempts" value={stats.pronunciationAttempts} />
      <Stat label="Professional terms" value={stats.professionalTermsLearned} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-2 py-2">
      <p className="font-semibold text-[var(--foreground)]">{value}</p>
      <p>{label}</p>
    </div>
  );
}
