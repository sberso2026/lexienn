import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { loadUserPreferences } from "@/lib/settings/userPreferences";

/** True when the build allows Developer Mode and the user has enabled it. */
export function isDeveloperModeActive(): boolean {
  if (!isDeveloperModeFeatureEnabled()) return false;
  if (typeof window === "undefined") return false;
  return loadUserPreferences().developer_mode_enabled;
}
