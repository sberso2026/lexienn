"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_USER_PREFERENCES,
  loadUserPreferences,
  saveUserPreferences,
  USER_PREFERENCES_UPDATED_EVENT,
  type UserPreferences,
} from "@/lib/settings/userPreferences";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  useEffect(() => {
    setPreferences(loadUserPreferences());

    const refresh = () => setPreferences(loadUserPreferences());
    window.addEventListener(USER_PREFERENCES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(USER_PREFERENCES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    const next = saveUserPreferences(patch);
    setPreferences(next);
    return next;
  }, []);

  return { preferences, updatePreferences };
}
