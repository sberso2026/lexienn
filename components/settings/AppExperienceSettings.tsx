"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { useLaunchAnimationPreference } from "@/components/launch/useLaunchAnimationPreference";
import { requestLaunchReplay } from "@/lib/launch/shouldShowLaunchScreen";

export function AppExperienceSettings() {
  const { preferences, updatePreferences } = useLaunchAnimationPreference();

  return (
    <CompactCard>
      <h2 className="mb-3 text-sm font-semibold">App Experience</h2>
      <div className="space-y-2">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] px-3 text-sm">
          <span>Launch animation</span>
          <input
            type="checkbox"
            checked={preferences.animationEnabled}
            onChange={(event) =>
              updatePreferences({ animationEnabled: event.target.checked })
            }
            className="h-4 w-4 rounded border-[var(--card-border)]"
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] px-3 text-sm">
          <span>Launch sound</span>
          <input
            type="checkbox"
            checked={preferences.soundEnabled}
            onChange={(event) => updatePreferences({ soundEnabled: event.target.checked })}
            className="h-4 w-4 rounded border-[var(--card-border)]"
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
