/** True when Lexienn runs as an installed PWA / home-screen web app. */
export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;

  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isDisplayModeBrowser(): boolean {
  if (typeof window === "undefined") return true;
  return !isStandaloneApp();
}
