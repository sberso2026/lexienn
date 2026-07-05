"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminLanguagesView } from "@/components/admin/AdminLanguagesView";
import { CorrectionsQueueView } from "@/components/corrections/CorrectionsQueueView";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { StatusChip } from "@/components/ui/StatusChip";
import { ActionButton } from "@/components/ui/ActionButton";
import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import { SelectField } from "@/components/ui/SelectField";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { DEV_LABELS } from "@/lib/ui/developerLabels";
import { mockUserContextProfiles } from "@/lib/mock";
import type { TranslationMode } from "@/lib/translator/translatorSchemas";
import { OfflineStorageActions } from "@/components/settings/OfflineStorageActions";
import {
  getActiveOfflinePackId,
  loadDownloadedPackIds,
} from "@/lib/storage/phrasePackStorage";

const explanationLevels = [
  { value: "simple", label: "Simple" },
  { value: "normal", label: "Normal" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
] as const;

const translationModes: Array<{ value: TranslationMode; label: string }> = [
  { value: "direct", label: "Direct" },
  { value: "natural", label: "Natural" },
  { value: "polite", label: "Polite" },
  { value: "simple", label: "Simple" },
  { value: "speak_to_local", label: "Speak to local" },
];

export function SettingsView() {
  const { preferences, updatePreferences } = useUserPreferences();
  const developerModeAvailable = isDeveloperModeFeatureEnabled();
  const developerModeActive = developerModeAvailable && preferences.developer_mode_enabled;
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [aiProviderConfigured, setAiProviderConfigured] = useState<boolean | null>(
    null,
  );

  const refreshProviderStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/translator/status");
      if (!response.ok) return;
      const payload = (await response.json()) as { ai_configured?: boolean };
      setAiProviderConfigured(Boolean(payload.ai_configured));
    } catch {
      setAiProviderConfigured(null);
    }
  }, []);

  const refreshStorageSummary = useCallback(async () => {
    setActivePackId(getActiveOfflinePackId());
    if (typeof window !== "undefined") {
      const { listOfflinePacks } = await import("@/lib/offline/localOfflineStore");
      const packs = await listOfflinePacks();
      setDownloadedCount(packs.length);
      return;
    }
    setDownloadedCount(loadDownloadedPackIds().length);
  }, []);

  useEffect(() => {
    void refreshStorageSummary();
    void refreshProviderStatus();
  }, [refreshProviderStatus, refreshStorageSummary]);

  return (
    <div className="space-y-3">
      <CompactCard>
        <h2 className="mb-3 text-sm font-semibold">Profile</h2>
        <SelectField
          id="settings_user_context"
          label="Default context"
          value={preferences.default_user_context}
          onChange={(value) =>
            updatePreferences({
              default_user_context:
                value as (typeof mockUserContextProfiles)[number]["context"],
            })
          }
          options={mockUserContextProfiles.map((profile) => ({
            value: profile.context,
            label: profile.label,
          }))}
        />
      </CompactCard>

      <CompactCard>
        <h2 className="mb-3 text-sm font-semibold">Languages</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SearchableLanguageSelectField
            id="settings_source_language"
            label="From"
            value={preferences.default_source_language}
            onChange={(value) => updatePreferences({ default_source_language: value })}
          />
          <SearchableLanguageSelectField
            id="settings_target_language"
            label="To"
            value={preferences.default_target_language}
            onChange={(value) => updatePreferences({ default_target_language: value })}
          />
        </div>
      </CompactCard>

      <CompactCard>
        <h2 className="mb-3 text-sm font-semibold">Voice</h2>
        <SelectField
          id="settings_explanation_level"
          label="Dictionary level"
          value={preferences.default_explanation_level}
          onChange={(value) =>
            updatePreferences({
              default_explanation_level:
                value as (typeof explanationLevels)[number]["value"],
            })
          }
          options={explanationLevels.map((level) => ({
            value: level.value,
            label: level.label,
          }))}
        />
        <div className="mt-2">
          <SelectField
            id="settings_translation_mode"
            label="Translation mode"
            value={preferences.default_translation_mode}
            onChange={(value) =>
              updatePreferences({ default_translation_mode: value as TranslationMode })
            }
            options={translationModes.map((mode) => ({
              value: mode.value,
              label: mode.label,
            }))}
          />
        </div>
      </CompactCard>

      <CompactCard>
        <h2 className="mb-3 text-sm font-semibold">Offline storage</h2>
        <div className="flex flex-wrap gap-1.5">
          <StatusChip
            label={`${downloadedCount} downloaded`}
            variant={downloadedCount > 0 ? "success" : "neutral"}
          />
          <StatusChip
            label={activePackId ? "Active pack" : "No active pack"}
            variant={activePackId ? "success" : "neutral"}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Link href="/phrase-packs" className="flex-1">
            <ActionButton variant="secondary" fullWidth>
              Packs
            </ActionButton>
          </Link>
          <Link href="/offline" className="flex-1">
            <ActionButton variant="secondary" fullWidth>
              Offline
            </ActionButton>
          </Link>
        </div>
        <OfflineStorageActions onChanged={() => void refreshStorageSummary()} />
      </CompactCard>

      <CompactCard>
        <h2 className="mb-2 text-sm font-semibold">Privacy</h2>
        <p className="text-xs text-[var(--muted)]">
          Voice and images are processed to produce text only. Nothing is saved unless you choose to
          save it.
        </p>
      </CompactCard>

      {developerModeAvailable && (
        <CompactCard>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
            <span className="text-sm font-semibold">Developer Mode</span>
            <input
              type="checkbox"
              checked={preferences.developer_mode_enabled}
              onChange={(event) =>
                updatePreferences({ developer_mode_enabled: event.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--card-border)]"
            />
          </label>
        </CompactCard>
      )}

      {developerModeActive && (
        <>
          <ExpandableSection summary="Translation engine">
            <div className="flex flex-wrap gap-1.5">
              <StatusChip
                label={
                  aiProviderConfigured === null
                    ? "Unknown"
                    : aiProviderConfigured
                      ? `${DEV_LABELS.providerStatus}: on`
                      : `${DEV_LABELS.providerStatus}: off`
                }
                variant={aiProviderConfigured ? "success" : "neutral"}
              />
              <StatusChip
                label={
                  preferences.rule_fallback_enabled
                    ? `${DEV_LABELS.fallbackPolicy}: on`
                    : `${DEV_LABELS.fallbackPolicy}: off`
                }
                variant="neutral"
              />
            </div>
            <div className="mt-3 space-y-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={preferences.ai_translation_enabled}
                  onChange={(event) =>
                    updatePreferences({ ai_translation_enabled: event.target.checked })
                  }
                  className="h-4 w-4"
                />
                AI translation
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={preferences.rule_fallback_enabled}
                  onChange={(event) =>
                    updatePreferences({ rule_fallback_enabled: event.target.checked })
                  }
                  className="h-4 w-4"
                />
                {DEV_LABELS.fallbackPolicy}
              </label>
            </div>
            {!aiProviderConfigured && preferences.ai_translation_enabled && (
              <div className="mt-2">
                <CompactAlert variant="warning">
                  AI translation is not configured on the server.
                </CompactAlert>
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection summary={DEV_LABELS.localAdminTools}>
            <AdminLanguagesView />
          </ExpandableSection>

          <ExpandableSection summary={DEV_LABELS.correctionsQueue}>
            <CorrectionsQueueView embedded />
          </ExpandableSection>
        </>
      )}
    </div>
  );
}
