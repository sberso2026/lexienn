import { isInstallGateBypassed } from "@/lib/pwa/installGateBypass";
import {
  isLocalhostDev,
  isMobileDevice,
  isStandaloneApp,
} from "@/lib/pwa/isStandaloneApp";

/** Block normal mobile browser use until the app is installed (standalone). */
export function shouldShowMobileInstallGate(): boolean {
  if (typeof window === "undefined") return false;
  if (!isMobileDevice()) return false;
  if (isStandaloneApp()) return false;
  if (isLocalhostDev()) return false;
  if (isInstallGateBypassed()) return false;
  return true;
}
