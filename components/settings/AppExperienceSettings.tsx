"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { useLaunchAnimationPreference } from "@/components/launch/useLaunchAnimationPreference";
import { requestLaunchReplay } from "@/lib/launch/shouldShowLaunchScreen";

export function AppExperienceSettings() {
  const { preferences, updatePreferences } = useLaunchAnimationPreference();

  return (
    <CompactCard className="enterprise-card">
      <h2 className="mb-3 text-sm font-semibold">App Experience</h2>
      <div className="space-y-2">
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
          <span>
            <span className="block font-medium">Launch animation</span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">Play when the installed app opens</span>
          </span>
          <input
            type="checkbox"
            checked={preferences.animationEnabled}
            onChange={(event) =>
              updatePreferences({ animationEnabled: event.target.checked })
            }
            className="h-5 w-5 rounded border-[var(--card-border)] accent-[var(--accent)]"
          />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
          <span>
            <span className="block font-medium">Launch sound</span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">Use a subtle sound during launch</span>
          </span>
          <input
            type="checkbox"
            checked={preferences.soundEnabled}
            onChange={(event) => updatePreferences({ soundEnabled: event.target.checked })}
            className="h-5 w-5 rounded border-[var(--card-border)] accent-[var(--accent)]"
          />
        </label>
      </div>
      <div className="mt-3">
        <ActionButton
          variant="secondary"
          fullWidth
          onClick={() => {
            requestLaunchReplay();
            window.location.reload();
          }}
        >
          Replay launch animation
        </ActionButton>
      </div>
    </CompactCard>
  );
}
