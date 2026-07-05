import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { isDeveloperModeActive } from "@/lib/debug/developerMode";

/**
 * Internal diagnostics and debug UI are hidden unless Developer Mode is
 * enabled via NEXT_PUBLIC_ENABLE_DEVELOPER_MODE and the user toggle.
 */
export function shouldShowInternalDebugUi(): boolean {
  if (!isDeveloperModeFeatureEnabled()) return false;
  return isDeveloperModeActive();
}
