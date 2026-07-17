"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  icon: ReactNode;
};

const availablePacks = [
  { title: "Emergency Phrases", phrases: 48, audio: true },
  { title: "Engineering Terms", phrases: 86, audio: true },
  { title: "Travel Essentials", phrases: 72, audio: true },
  { title: "Business Communication", phrases: 64, audio: false },
  { title: "Healthcare Basics", phrases: 58, audio: true },
  { title: "Construction Field Terms", phrases: 94, audio: true },
];

function CollectionIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
    >
      {children}
    </span>
  );
}

const iconClass = "h-5 w-5";

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
        icon: (
          <CollectionIcon>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </CollectionIcon>
        ),
      },
      {
        title: "Saved Phrases",
        count: savedPhraseCount,
        unit: "phrases",
        subtitle: "Translations saved for quick reuse",
        emptySubtitle: "No saved phrases yet — save one after translating.",
        href: "/translator",
        icon: (
          <CollectionIcon>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </CollectionIcon>
        ),
      },
      {
        title: "Offline Packs",
        count: offlinePacks.length,
        unit: "packs",
        subtitle: "Downloaded language pairs",
        emptySubtitle: "No offline packs downloaded.",
        href: "/offline",
        icon: (
          <CollectionIcon>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" />
            </svg>
          </CollectionIcon>
        ),
      },
      {
        title: "Profession Packs",
        count: availablePacks.length,
        unit: "available",
        subtitle: "Focused terminology for work and travel",
        emptySubtitle: "Profession packs will appear here.",
        href: "/phrase-packs",
        icon: (
          <CollectionIcon>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </CollectionIcon>
        ),
      },
      {
        title: "Recent Searches",
        count: recentCount,
        unit: "recent",
        subtitle: "Continue your latest language work",
        emptySubtitle: "No recent searches yet.",
        href: "/dictionary",
        icon: (
          <CollectionIcon>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CollectionIcon>
        ),
      },
      {
        title: "Favorites",
        count: savedWordCount,
        unit: "items",
        subtitle: "Your most useful saved language",
        emptySubtitle: "No favorites yet.",
        href: "/dictionary",
        icon: (
          <CollectionIcon>
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </CollectionIcon>
        ),
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
            {item.icon}
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
            <span aria-hidden className="text-lg text-[var(--muted)]">
              ›
            </span>
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
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
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
                <svg
                  aria-hidden
                  className="h-5 w-5 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v12m0 0l-4-4m4 4l4-4M5 20h14"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
