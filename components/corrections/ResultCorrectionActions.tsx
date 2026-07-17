"use client";

import { useState } from "react";
import { CorrectionForm } from "@/components/corrections/CorrectionForm";
import type { CorrectionFormDefaults } from "@/components/corrections/CorrectionForm";

type CorrectionIntent =
  | "suggest_correction"
  | "report_wrong_meaning"
  | "report_wrong_translation";

const INTENT_LABELS: Record<CorrectionIntent, string> = {
  suggest_correction: "Suggest correction",
  report_wrong_meaning: "Report wrong meaning",
  report_wrong_translation: "Report wrong translation",
};

interface ResultCorrectionActionsProps {
  defaults: CorrectionFormDefaults;
}

export function ResultCorrectionActions({ defaults }: ResultCorrectionActionsProps) {
  const [intent, setIntent] = useState<CorrectionIntent | null>(null);

  const formDefaults: CorrectionFormDefaults = {
    ...defaults,
    correction_type:
      intent === "report_wrong_meaning"
        ? "meaning"
        : defaults.correction_type ?? "translation",
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(INTENT_LABELS) as CorrectionIntent[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${
              intent === key
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--accent)]"
            }`}
            aria-expanded={intent === key}
            onClick={() => setIntent((current) => (current === key ? null : key))}
          >
            {INTENT_LABELS[key]}
          </button>
        ))}
      </div>

      {intent && (
        <CorrectionForm
          title={INTENT_LABELS[intent]}
          defaults={formDefaults}
          onClose={() => setIntent(null)}
          onSubmitted={() => setIntent(null)}
        />
      )}
    </div>
  );
}
