"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SavedWordCard } from "@/components/my-dictionary/SavedWordCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import { getLanguageSelectGroups, mockUserContextProfiles } from "@/lib/mock";
import { entryTypeSchema } from "@/lib/schemas";
import {
  DEFAULT_SAVED_WORD_FILTERS,
  downloadTextFile,
  exportSavedWordsCsv,
  exportSavedWordsJson,
  filterSavedWords,
  loadSavedWords,
  removeSavedWord,
  type SavedWordFilters,
} from "@/lib/storage/savedWordsStorage";

function fieldClassName() {
  return "mt-1 w-full min-h-11 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-base";
}

export function MyDictionaryView() {
  const [words, setWords] = useState<ReturnType<typeof loadSavedWords>>([]);
  const [filters, setFilters] = useState<SavedWordFilters>(
    DEFAULT_SAVED_WORD_FILTERS,
  );
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setWords(loadSavedWords());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredWords = useMemo(
    () => filterSavedWords(words, filters),
    [words, filters],
  );

  function updateFilter<K extends keyof SavedWordFilters>(
    key: K,
    value: SavedWordFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function handleRemove(id: string) {
    const removed = removeSavedWord(id);
    if (removed) {
      refresh();
      setMessage("Entry removed from My Dictionary.");
    }
  }

  function handleExportJson() {
    if (words.length === 0) {
      setMessage("Nothing to export yet.");
      return;
    }
    downloadTextFile(
      "lexienn-my-dictionary.json",
      exportSavedWordsJson(words),
      "application/json",
    );
    setMessage("Exported JSON download started.");
  }

  function handleExportCsv() {
    if (words.length === 0) {
      setMessage("Nothing to export yet.");
      return;
    }
    downloadTextFile(
      "lexienn-my-dictionary.csv",
      exportSavedWordsCsv(words),
      "text/csv",
    );
    setMessage("Exported CSV download started.");
  }

  if (!loaded) {
    return <LoadingState title="My Dictionary" label="Loading saved words…" />;
  }

  return (
    <div className="space-y-6">
      <FeatureCard title="Search and filter">
        <div className="space-y-4">
          <div>
            <label htmlFor="saved-search" className="block text-sm font-medium">
              Search saved words
            </label>
            <input
              id="saved-search"
              type="search"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search text, meanings, pronunciation"
              className={fieldClassName()}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="filter-language"
                className="block text-sm font-medium"
              >
                Target language
              </label>
              <select
                id="filter-language"
                value={filters.target_language}
                onChange={(e) => updateFilter("target_language", e.target.value)}
                className={fieldClassName()}
              >
                <option value="all">All languages</option>
                {getLanguageSelectGroups().map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-context"
                className="block text-sm font-medium"
              >
                Context / profile
              </label>
              <select
                id="filter-context"
                value={filters.user_context}
                onChange={(e) => updateFilter("user_context", e.target.value)}
                className={fieldClassName()}
              >
                <option value="all">All contexts</option>
                {mockUserContextProfiles.map((profile) => (
                  <option key={profile.context} value={profile.context}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-entry-type"
                className="block text-sm font-medium"
              >
                Entry type
              </label>
              <select
                id="filter-entry-type"
                value={filters.entry_type}
                onChange={(e) => updateFilter("entry_type", e.target.value)}
                className={fieldClassName()}
              >
                <option value="all">All types</option>
                {entryTypeSchema.options.map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleExportJson}
              aria-label={`Export ${words.length} saved entries as JSON`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)]"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              aria-label={`Export ${words.length} saved entries as CSV`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)]"
            >
              Export CSV
            </button>
            <Link
              href="/dictionary"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              New lookup
            </Link>
          </div>

          <p className="text-sm text-[var(--muted)]">
            {filteredWords.length} of {words.length} saved{" "}
            {words.length === 1 ? "entry" : "entries"} shown · Stored locally on
            this device
          </p>

          {message && (
            <p className="text-sm text-[var(--muted)]" role="status">
              {message}
            </p>
          )}
        </div>
      </FeatureCard>

      {words.length === 0 ? (
        <EmptyState
          title="No saved words"
          description="Save words from dictionary results to build your personal reference. Entries persist after reload."
          action={
            <Link
              href="/dictionary"
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Go to dictionary lookup
            </Link>
          }
        />
      ) : filteredWords.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search term or clear your filters."
          action={
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_SAVED_WORD_FILTERS)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)]"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {filteredWords.map((word) => (
            <li key={word.id}>
              <SavedWordCard word={word} onRemove={handleRemove} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
