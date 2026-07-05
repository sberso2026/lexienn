"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocalResponseButtons } from "@/components/offline/LocalResponseButtons";
import { OfflinePhraseCard } from "@/components/offline/OfflinePhraseCard";
import { OfflineSentenceTranslator } from "@/components/offline/OfflineSentenceTranslator";
import { Badge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionCard } from "@/components/ui/SectionCard";
import { SelectField } from "@/components/ui/SelectField";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import {
  OFFLINE_MODE_CATEGORIES,
  PHRASE_CATEGORY_LABELS,
} from "@/lib/mock/phrase-categories";
import { getPhrasesByCategory } from "@/lib/mock/phrase-packs";
import { getDialectById, getLanguageById } from "@/lib/mock";
import type { PhraseCategory } from "@/lib/schemas";
import {
  getActiveOfflinePack,
  getDownloadedPhrasePacks,
  setActiveOfflinePackId,
} from "@/lib/storage/phrasePackStorage";

export function OfflineRemoteModeView() {
  const [loaded, setLoaded] = useState(false);
  const [packs, setPacks] = useState<ReturnType<typeof getDownloadedPhrasePacks>>(
    [],
  );
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<PhraseCategory>("emergency");

  const refresh = useCallback(() => {
    const downloaded = getDownloadedPhrasePacks();
    setPacks(downloaded);

    const active = getActiveOfflinePack();
    setActivePackId(active?.id ?? null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activePack = useMemo(
    () => packs.find((pack) => pack.id === activePackId) ?? packs[0] ?? null,
    [packs, activePackId],
  );

  const language = activePack
    ? getLanguageById(activePack.language_id)
    : undefined;
  const dialect = activePack ? getDialectById(activePack.dialect_id) : undefined;
  const languageCode = language?.code ?? "en";

  const availableCategories = useMemo(() => {
    if (!activePack) return [];
    return OFFLINE_MODE_CATEGORIES.filter((category) =>
      activePack.phrases.some((phrase) => phrase.category === category),
    );
  }, [activePack]);

  const categoryPhrases = useMemo(() => {
    if (!activePack) return [];
    return getPhrasesByCategory(activePack, selectedCategory);
  }, [activePack, selectedCategory]);

  const isEmergencyMode = selectedCategory === "emergency";

  useEffect(() => {
    if (
      availableCategories.length > 0 &&
      !availableCategories.includes(selectedCategory)
    ) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  function handlePackChange(packId: string) {
    setActiveOfflinePackId(packId);
    setActivePackId(packId);
    setSelectedCategory("emergency");
  }

  if (!loaded) {
    return <LoadingState title="Loading offline mode" label="Loading offline mode…" />;
  }

  if (packs.length === 0) {
    return (
      <EmptyState
        title="No offline pack downloaded"
        description="Download a phrase pack before travelling to use emergency and remote communication tools without internet."
        action={
          <Link
            href="/phrase-packs"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Browse phrase packs
          </Link>
        }
      />
    );
  }

  if (!activePack) {
    return (
      <EmptyState
        title="Could not load active pack"
        description="Try downloading a pack again from Phrase Packs."
        action={
          <Link
            href="/phrase-packs"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Browse phrase packs
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {isEmergencyMode && (
        <div
          className="rounded-xl border-2 border-red-600 bg-red-700 px-4 py-4 text-center text-white shadow-sm"
          role="alert"
        >
          <p className="text-lg font-bold">Emergency communication mode</p>
          <p className="mt-1 text-sm text-red-100">
            Large buttons · Speak slowly · Use gestures when needed
          </p>
        </div>
      )}

      <SectionCard title="Active offline pack">
        <div className="space-y-3">
          {packs.length > 1 ? (
            <SelectField
              id="active-pack"
              label="Switch pack"
              value={activePack.id}
              onChange={handlePackChange}
              options={packs.map((pack) => ({
                value: pack.id,
                label: pack.name,
              }))}
            />
          ) : (
            <p className="text-base font-semibold">{activePack.name}</p>
          )}

          <LanguageBadge
            language={language?.name ?? activePack.language_id}
            dialect={dialect?.variant_label}
          />
          <div className="flex flex-wrap gap-2">
            <Badge label="Offline ready" variant="success" />
            <Badge label="No internet required" variant="info" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            {activePack.phrase_count} phrases on this device
          </p>
        </div>
      </SectionCard>

      <OfflineSentenceTranslator pack={activePack} languageCode={languageCode} />

      <section aria-label="Phrase categories">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Categories
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {availableCategories.map((category) => {
            const isActive = selectedCategory === category;
            const isEmergency = category === "emergency";

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={isActive}
                className={`min-h-[3.25rem] rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? isEmergency
                      ? "bg-red-700 text-white shadow-sm"
                      : "bg-[var(--accent)] text-white shadow-sm"
                    : isEmergency
                      ? "border-2 border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                      : "border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--background)]"
                }`}
              >
                {PHRASE_CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Phrase cards">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {PHRASE_CATEGORY_LABELS[selectedCategory]}
        </h3>

        {categoryPhrases.length === 0 ? (
          <EmptyState
            title="No phrases in this category"
            description="This category is not included in the active offline pack."
          />
        ) : (
          <ul className="space-y-4">
            {categoryPhrases.map((phrase) => (
              <li key={phrase.id}>
                <OfflinePhraseCard
                  phrase={phrase}
                  languageCode={languageCode}
                  isEmergencyMode={isEmergencyMode}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <LocalResponseButtons
        languageCode={languageCode}
        isEmergencyMode={isEmergencyMode}
      />

      <p className="text-center text-sm text-[var(--muted)]">
        <Link
          href="/phrase-packs"
          className="font-semibold text-[var(--accent-indigo)] hover:underline"
        >
          Manage phrase packs
        </Link>
      </p>
    </div>
  );
}
