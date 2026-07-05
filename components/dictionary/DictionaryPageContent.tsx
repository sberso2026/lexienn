"use client";

import { useState } from "react";
import { DictionaryLookupForm } from "@/components/dictionary/DictionaryLookupForm";

const sampleLookups = ["load", "stress", "deep beam", "I need a doctor"];

export function DictionaryPageContent() {
  const [prefillText, setPrefillText] = useState("");

  return (
    <div className="space-y-3">
      <DictionaryLookupForm
        prefillText={prefillText}
        onPrefillApplied={() => setPrefillText("")}
      />

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex gap-2 whitespace-nowrap">
          {sampleLookups.map((sample) => (
            <li key={sample}>
              <button
                type="button"
                onClick={() => setPrefillText(sample)}
                aria-label={`Sample: ${sample}`}
                className="inline-flex min-h-9 items-center rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 text-xs font-medium touch-manipulation"
              >
                {sample}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
