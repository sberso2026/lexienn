"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_LAUNCH_PREFERENCES,
  loadLaunchPreferences,
  saveLaunchPreferences,
  type LaunchPreferences,
} from "@/lib/launch/launchPreferences";

export function useLaunchAnimationPreference() {
  const [preferences, setPreferences] = useState<LaunchPreferences>(DEFAULT_LAUNCH_PREFERENCES);

  useEffect(() => {
    setPreferences(loadLaunchPreferences());
  }, []);

  const updatePreferences = useCallback((patch: Partial<LaunchPreferences>) => {
    const next = saveLaunchPreferences(patch);
    setPreferences(next);
    return next;
  }, []);

  return { preferences, updatePreferences };
}
