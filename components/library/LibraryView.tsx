"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDictionaryLookupForm } from "@/lib/dictionary/lookupFormStorage";
import { listOfflinePacks } from "@/lib/offline/localOfflineStore";
import type { OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import { loadSavedPhrases, SAVED_PHRASES_UPDATED_EVENT } from "@/lib/storage/savedPhrasesStorage";
import { loadSavedWords } from "@/lib/storage/savedWordsStorage";

type CollectionItem = {
  title: string;
  count: number;
  unit: string;
  subtitle: string;
  emptySubtitle: string;
  href: string;
  icon: string;
};

const availablePacks = [
  { title: "Emergency Phrases", phrases: 48, audio: true },
  { title: "Engineering Terms", phrases: 86, audio: true },
  { title: "Travel Essentials", phrases: 72, audio: true },
  { title: "Business Communication", phrases: 64, audio: false },
  { title: "Healthcare Basics", phrases: 58, audio: true },
  { title: "Construction Field Terms", phrases: 94, audio: true },
];

export function LibraryView() {
  const [savedWordCount, setSavedWordCount] = useState(0);
  const [savedPhraseCount, setSavedPhraseCount] = useState(0);
  const [offlinePacks, setOfflinePacks] = useState<OfflineStoredPack[]>([]);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setSavedWordCount(loadSavedWords().length);
      setSavedPhraseCount(loadSavedPhrases().length);
      setRecentCount(loadDictionaryLookupForm()?.input_text.trim() ? 1 : 0);
      void listOfflinePacks().then(setOfflinePacks);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(SAVED_PHRASES_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SAVED_PHRASES_UPDATED_EVENT, refresh);
    };
  }, []);

  const collections = useMemo<CollectionItem[]>(
    () => [
      {
        title: "Saved Words",
        count: savedWordCount,
        unit: "words",
        subtitle: "Definitions and professional context",
        emptySubtitle: "No saved words yet — save one from a Define result.",
        href: "/dictionary",
        icon: "W",
      },
      {
        title: "Saved Phrases",
        count: savedPhraseCount,
        unit: "phrases",
        subtitle: "Translations saved for quick reuse",
        emptySubtitle: "No saved phrases yet — save one after translating.",
        href: "/translator",
        icon: "P",
      },
      {
        title: "Offline Packs",
        count: offlinePacks.length,
        unit: "packs",
        subtitle: "Downloaded language pairs",
        emptySubtitle: "No offline packs downloaded.",
        href: "/offline",
        icon: "O",
      },
      {
        title: "Profession Packs",
        count: availablePacks.length,
        unit: "available",
        subtitle: "Focused terminology for work and travel",
        emptySubtitle: "Profession packs will appear here.",
        href: "/phrase-packs",
        icon: "Pr",
      },
      {
        title: "Recent Searches",
        count: recentCount,
        unit: "recent",
        subtitle: "Continue your latest language work",
        emptySubtitle: "No recent searches yet.",
        href: "/dictionary",
        icon: "R",
      },
      {
        title: "Favorites",
        count: savedWordCount,
        unit: "items",
        subtitle: "Your most useful saved language",
        emptySubtitle: "No favorites yet.",
        href: "/dictionary",
        icon: "F",
      },
    ],
    [offlinePacks.length, recentCount, savedPhraseCount, savedWordCount],
  );

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Your language memory
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Library</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Keep saved language, offline resources, and recent work together.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Library collections">
        {collections.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="card-surface enterprise-card flex min-h-24 items-center gap-3 p-4 transition-colors hover:border-[var(--accent)]"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]"
            >
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">{item.title}</span>
                <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">
                  {item.count} {item.unit}
                </span>
              </span>
              <span className="mt-1 block text-xs leading-4 text-[var(--muted)]">
                {item.count > 0 ? item.subtitle : item.emptySubtitle}
              </span>
            </span>
            <span aria-hidden className="text-lg text-[var(--muted)]">›</span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="downloaded-packs-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="downloaded-packs-title" className="text-lg font-semibold tracking-tight">
            Downloaded Packs
          </h2>
          <Link href="/offline" className="min-h-11 py-3 text-xs font-semibold text-[var(--accent)]">
            Manage
          </Link>
        </div>
        {offlinePacks.length === 0 ? (
          <div className="card-surface p-4">
            <p className="text-sm font-semibold">No offline packs downloaded</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Download a language pair to keep essential phrases available without internet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offlinePacks.map((pack) => (
              <Link
                key={pack.pack_key}
                href={`/offline?from=${encodeURIComponent(pack.from_language_id)}&to=${encodeURIComponent(pack.to_language_id)}`}
                className="card-surface enterprise-card block p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {pack.from_display_name} ↔ {pack.to_display_name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {pack.phrase_count} phrases · {pack.audio_count} audio clips
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Updated {new Date(pack.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                    {pack.status === "update_available" ? "Update available" : "Downloaded"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="available-packs-title">
        <h2 id="available-packs-title" className="mb-3 text-lg font-semibold tracking-tight">
          Available Packs
        </h2>
        <div className="card-surface overflow-hidden">
          {availablePacks.map((pack) => (
            <Link
              key={pack.title}
              href="/offline"
              className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--background)]"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{pack.title}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {pack.phrases} phrases · {pack.audio ? "Audio available" : "Text pack"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Available
                </span>
                <svg aria-hidden className="h-5 w-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 20h14" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
