"use client";

import { useState } from "react";
import { DictionaryLookupForm } from "@/components/dictionary/DictionaryLookupForm";

const recentSearches = ["acceleration", "tie beam", "what’s your name?", "microcracking"];
const suggestedExamples = ["acceleration", "tie beam", "microcracking", "copious"];

export function DictionaryPageContent() {
  const [prefillText, setPrefillText] = useState("");

  return (
    <div className="space-y-5">
      <DictionaryLookupForm
        prefillText={prefillText}
        onPrefillApplied={() => setPrefillText("")}
      />

      <section className="card-surface enterprise-card p-4" aria-labelledby="recent-searches-title">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="recent-searches-title" className="text-sm font-semibold">
            Recent searches
          </h2>
          <span className="text-xs text-[var(--muted)]">Tap to define again</span>
        </div>
        <ul className="divide-y divide-[var(--border-subtle)]">
          {recentSearches.map((search) => (
            <li key={search}>
              <button
                type="button"
                onClick={() => setPrefillText(search)}
                className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-medium"
              >
                <span className="truncate">{search}</span>
                <span aria-hidden className="text-[var(--muted)]">›</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="suggested-examples-title">
        <h2 id="suggested-examples-title" className="mb-2 text-sm font-semibold">
          Suggested examples
        </h2>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="flex gap-2 whitespace-nowrap">
            {suggestedExamples.map((sample) => (
              <li key={sample}>
                <button
                  type="button"
                  onClick={() => setPrefillText(sample)}
                  aria-label={`Define ${sample}`}
                  className="inline-flex min-h-11 items-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--accent)] touch-manipulation"
                >
                  {sample}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
