"use client";

import { useState } from "react";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import type { Dialect, ValidationStatus } from "@/lib/schemas";
import { validationStatusSchema } from "@/lib/schemas";
import { DEV_CONFIDENCE_LEGEND } from "@/lib/ui/developerLabels";

export type ConfidenceEditorValues = {
  confidence_level: number;
  validation_status: ValidationStatus;
  variant_label?: string;
  region?: string;
};

interface ConfidenceEditorProps {
  dialect: Dialect;
  onSave: (values: ConfidenceEditorValues) => void;
  onCancel?: () => void;
  showVariantFields?: boolean;
}

function fieldClassName() {
  return "mt-1 w-full min-h-11 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-base";
}

export function ConfidenceEditor({
  dialect,
  onSave,
  onCancel,
  showVariantFields = false,
}: ConfidenceEditorProps) {
  const [confidenceLevel, setConfidenceLevel] = useState(dialect.confidence_level);
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>(dialect.validation_status);
  const [variantLabel, setVariantLabel] = useState(dialect.variant_label);
  const [region, setRegion] = useState(dialect.region ?? "");

  return (
    <form
      className="space-y-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          confidence_level: confidenceLevel,
          validation_status: validationStatus,
          variant_label: showVariantFields ? variantLabel : undefined,
          region: showVariantFields ? region || undefined : undefined,
        });
      }}
    >
      <div>
        <label htmlFor={`confidence-${dialect.id}`} className="block text-sm font-medium">
          Confidence level ({Math.round(confidenceLevel * 100)}%)
        </label>
        <input
          id={`confidence-${dialect.id}`}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={confidenceLevel}
          onChange={(e) => setConfidenceLevel(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={confidenceLevel}
          onChange={(e) => setConfidenceLevel(Number(e.target.value))}
          className={fieldClassName()}
          aria-label="Confidence level numeric"
        />
      </div>

      <div>
        <label htmlFor={`status-${dialect.id}`} className="block text-sm font-medium">
          Data status
        </label>
        <select
          id={`status-${dialect.id}`}
          value={validationStatus}
          onChange={(e) =>
            setValidationStatus(e.target.value as ValidationStatus)
          }
          className={fieldClassName()}
        >
          {validationStatusSchema.options.map((status) => (
            <option key={status} value={status}>
              {formatEnumLabel(status)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {DEV_CONFIDENCE_LEGEND} (community_corrected), native speaker reviewed.
        </p>
      </div>

      {showVariantFields && (
        <>
          <div>
            <label htmlFor={`variant-${dialect.id}`} className="block text-sm font-medium">
              Variant label
            </label>
            <input
              id={`variant-${dialect.id}`}
              value={variantLabel}
              onChange={(e) => setVariantLabel(e.target.value)}
              className={fieldClassName()}
            />
          </div>
          <div>
            <label htmlFor={`region-${dialect.id}`} className="block text-sm font-medium">
              Region
            </label>
            <input
              id={`region-${dialect.id}`}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={fieldClassName()}
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Save changes locally
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card)]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
