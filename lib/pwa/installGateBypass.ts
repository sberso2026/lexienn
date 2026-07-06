const DEV_BYPASS_KEY = "lexienn_install_gate_dev_bypass";

export function isInstallGateBypassed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DEV_BYPASS_KEY) === "true";
  } catch {
    return false;
  }
}

export function setInstallGateBypassed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DEV_BYPASS_KEY, "true");
  } catch {
    // ignore
  }
}

export function clearInstallGateBypass(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DEV_BYPASS_KEY);
  } catch {
    // ignore
  }
}
