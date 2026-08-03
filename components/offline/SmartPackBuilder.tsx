"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import {
  SMART_PACK_THEMES,
  buildSmartPackPlan,
  type SmartPackThemeId,
} from "@/lib/offline/smartPackBuilder";
import type { OfflinePackTier } from "@/lib/schemas";
import { OFFLINE_RESOLUTION_ORDER } from "@/lib/capabilities/contracts";
import { isSmartOfflinePackEnabled } from "@/lib/config/featureFlags";

type SmartPackBuilderProps = {
  fromLanguage: string;
  toLanguage: string;
  pairSelected: boolean;
  isBusy: boolean;
  themeId: SmartPackThemeId;
  packTier: OfflinePackTier;
  onThemeChange: (themeId: SmartPackThemeId) => void;
  onTierChange: (tier: OfflinePackTier) => void;
  onDownload: () => void;
};

export function SmartPackBuilder({
  fromLanguage,
  toLanguage,
  pairSelected,
  isBusy,
  themeId,
  packTier,
  onThemeChange,
  onTierChange,
  onDownload,
}: SmartPackBuilderProps) {
  if (!isSmartOfflinePackEnabled()) return null;

  const plan = pairSelected
    ? buildSmartPackPlan({
        fromLanguageId: fromLanguage,
        toLanguageId: toLanguage,
        themeId,
        packTier,
      })
    : null;

  return (
    <CompactCard className="enterprise-card space-y-3">
      <div>
        <p className="text-sm font-semibold">Smart Pack builder</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Choose a focus, review honest offline capabilities, then download locally.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SMART_PACK_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            disabled={!pairSelected || isBusy}
            onClick={() => onThemeChange(theme.id)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-semibold touch-manipulation ${
              themeId === theme.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--card-border)] text-[var(--foreground)]"
            }`}
          >
            {theme.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["lite", "standard", "professional"] as OfflinePackTier[]).map((tier) => (
          <button
            key={tier}
            type="button"
            disabled={!pairSelected || isBusy}
            onClick={() => onTierChange(tier)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-semibold capitalize touch-manipulation ${
              packTier === tier
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--card-border)] text-[var(--foreground)]"
            }`}
          >
            {tier}
          </button>
        ))}
      </div>

      {plan && (
        <div className="space-y-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs">
          <p className="font-semibold text-[var(--foreground)]">{plan.theme.label}</p>
          <p className="text-[var(--muted)]">{plan.theme.description}</p>
          <p>
            Est. storage: <span className="font-semibold">{plan.estimatedSizeLabel}</span> · ~
            {plan.phraseTarget} phrases
          </p>
          <div>
            <p className="font-semibold">Included</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[var(--muted)]">
              {plan.includedCapabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Unavailable / not claimed</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[var(--muted)]">
              {plan.unavailableCapabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <details className="pt-1">
            <summary className="cursor-pointer font-semibold">Offline resolution order</summary>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[var(--muted)]">
              {OFFLINE_RESOLUTION_ORDER.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
        </div>
      )}

      <ActionButton
        type="button"
        variant="primary"
        fullWidth
        className="!min-h-12"
        disabled={!pairSelected || isBusy}
        onClick={onDownload}
      >
        {isBusy ? "Building pack…" : "Download Smart Pack"}
      </ActionButton>
    </CompactCard>
  );
}
