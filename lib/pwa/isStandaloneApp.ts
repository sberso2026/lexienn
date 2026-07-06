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

export function isLocalhostDev(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isSafariIOS(): boolean {
  if (typeof window === "undefined") return false;
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

/** Facebook, Instagram, WeChat, TikTok, in-app browsers, etc. */
export function isLikelyInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line\/|Messenger|MicroMessenger|TikTok|GSA|ChatGPT/i.test(
    ua,
  );
}

export type IOSInstallGuideMode = "safari" | "open-in-safari";

export function getIOSInstallGuideMode(): IOSInstallGuideMode | null {
  if (!isIOS()) return null;
  if (isLikelyInAppBrowser() || !isSafariIOS()) return "open-in-safari";
  return "safari";
}

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function getDisplayMode(): string {
  if (typeof window === "undefined") return "unknown";
  if (isStandaloneApp()) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}
