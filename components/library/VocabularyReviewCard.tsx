"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import {
  buildReviewQueue,
  isReviewFavorite,
  markReviewAgain,
  markReviewKnown,
  shouldShowDailyReviewPrompt,
  toggleReviewFavorite,
  type ReviewCardItem,
} from "@/lib/storage/vocabularyReviewStorage";

export function VocabularyReviewCard() {
  const [queue, setQueue] = useState<ReviewCardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const refresh = useCallback(() => {
    const next = buildReviewQueue();
    setQueue(next);
    setIndex(0);
    setFlipped(false);
    setShowPrompt(shouldShowDailyReviewPrompt());
    if (next[0]) {
      setFavorite(isReviewFavorite(next[0].kind, next[0].id));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const current = queue[index];

  const advance = () => {
    setFlipped(false);
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

  if (!current) {
    return (
      <CompactCard className="enterprise-card">
        <p className="text-sm font-semibold">Review practice</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Save words or phrases to start a light review session.
        </p>
      </CompactCard>
    );
  }

  return (
    <CompactCard className="enterprise-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Review practice</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {showPrompt
              ? "A short local review is ready when you are."
              : `${index + 1} of ${queue.length} · tap card to flip`}
          </p>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          {current.kind}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-5 text-center touch-manipulation active:scale-[0.99]"
        aria-label={flipped ? "Hide meaning" : "Reveal meaning"}
      >
        <p className="text-base font-semibold leading-relaxed">{flipped ? current.back : current.front}</p>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
          {flipped ? "Meaning" : "Word / phrase"}
        </p>
      </button>

      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          type="button"
          variant="secondary"
          className="!min-h-12 text-xs"
          onClick={() => {
            markReviewKnown(current.kind, current.id);
            advance();
          }}
        >
          I know this
        </ActionButton>
        <ActionButton
          type="button"
          variant="secondary"
          className="!min-h-12 text-xs"
          onClick={() => {
            markReviewAgain(current.kind, current.id);
            advance();
          }}
        >
          Review again
        </ActionButton>
        <ActionButton
          type="button"
          variant={favorite ? "primary" : "secondary"}
          className="!min-h-12 text-xs"
          onClick={() => {
            const next = toggleReviewFavorite(current.kind, current.id);
            setFavorite(next);
          }}
        >
          {favorite ? "Favorited" : "Favorite"}
        </ActionButton>
      </div>
    </CompactCard>
  );
}
