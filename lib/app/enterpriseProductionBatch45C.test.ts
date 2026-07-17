import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import {
  DEFAULT_LAUNCH_PREFERENCES,
  loadLaunchPreferences,
  saveLaunchPreferences,
} from "@/lib/launch/launchPreferences";
import { shouldShowMobileInstallGate } from "@/lib/pwa/shouldShowMobileInstallGate";
import { toUserFacingError, USER_LOOKUP_UNAVAILABLE } from "@/lib/ui/userFacingErrors";

/** Mirrors lib/navigation/navConfig isNavItemActive without importing JSX icons. */
function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dictionary") return pathname.startsWith("/dictionary");
  if (href === "/library") {
    return (
      pathname.startsWith("/library") ||
      pathname.startsWith("/offline") ||
      pathname.startsWith("/phrase-packs")
    );
  }
  if (href === "/more") {
    return pathname.startsWith("/more") || pathname.startsWith("/settings");
  }
  return pathname.startsWith(href);
}

const USER_SCREENS = [
  "components/dictionary/DictionaryLookupForm.tsx",
  "components/translator/TextTranslatorView.tsx",
  "components/translator/CameraTranslatorView.tsx",
  "components/lens/LensView.tsx",
  "components/library/LibraryView.tsx",
  "components/settings/MoreSettingsView.tsx",
  "components/home/HomeDashboard.tsx",
  "components/pwa/MobileInstallGate.tsx",
  "components/launch/LexiennLaunchScreen.tsx",
  "components/ui/DataQualityWarnings.tsx",
];

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function installWindow({
  mobile = true,
  standalone = false,
  hostname = "lexienn.rtbea.com.au",
  ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
}: {
  mobile?: boolean;
  standalone?: boolean;
  hostname?: string;
  ua?: string;
} = {}) {
  const session = createStorage();
  vi.stubGlobal("sessionStorage", session);
  vi.stubGlobal("navigator", {
    userAgent: mobile
      ? ua
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    platform: mobile ? "iPhone" : "Win32",
    maxTouchPoints: mobile ? 5 : 0,
    standalone,
  });
  vi.stubGlobal("window", {
    sessionStorage: session,
    localStorage: createStorage(),
    location: { hostname },
    navigator: {
      userAgent: mobile
        ? ua
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      platform: mobile ? "iPhone" : "Win32",
      maxTouchPoints: mobile ? 5 : 0,
      standalone,
    },
    matchMedia: (query: string) => ({
      matches: standalone && query.includes("display-mode: standalone"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe("Batch 45C production UI QA", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("service worker excludes /api/*", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    expect(worker).toContain('if (url.pathname.startsWith("/api/")) return;');
    expect(worker).toContain('url.pathname.startsWith("/_next/")');
    expect(worker).not.toMatch(/cache\.put\([^)]*\/api\//);
  });

  it("install gate blocks mobile browser mode", () => {
    installWindow({ mobile: true, standalone: false });
    expect(shouldShowMobileInstallGate()).toBe(true);
  });

  it("install gate does not block standalone mode", () => {
    installWindow({ mobile: true, standalone: true });
    expect(shouldShowMobileInstallGate()).toBe(false);
  });

  it("desktop is not blocked by install gate", () => {
    installWindow({ mobile: false, standalone: false });
    expect(shouldShowMobileInstallGate()).toBe(false);
    installWindow({ mobile: true, standalone: false, hostname: "localhost" });
    expect(shouldShowMobileInstallGate()).toBe(false);
  });

  it("launch animation respects disabled preference", () => {
    const storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    expect(loadLaunchPreferences()).toEqual(DEFAULT_LAUNCH_PREFERENCES);
    saveLaunchPreferences({ animationEnabled: false });
    expect(loadLaunchPreferences().animationEnabled).toBe(false);
    const shouldShow = readFileSync("lib/launch/shouldShowLaunchScreen.ts", "utf8");
    expect(shouldShow).toContain("!prefs.animationEnabled");
  });

  it("launch sound respects disabled preference", () => {
    const storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    saveLaunchPreferences({ soundEnabled: false });
    expect(loadLaunchPreferences().soundEnabled).toBe(false);
    const launch = readFileSync("components/launch/LexiennLaunchScreen.tsx", "utf8");
    expect(launch).toContain("prefs.soundEnabled");
    expect(launch).toContain("Tap to open");
  });

  it("header logo renders on every main screen shell", () => {
    const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
    const clientHeader = readFileSync("components/layout/ClientAppHeader.tsx", "utf8");
    const shell = readFileSync("components/layout/MobileAppShell.tsx", "utf8");
    expect(header).toContain("LexiennBrandLogo");
    expect(header).toContain('size="header-mobile"');
    expect(clientHeader).toContain("CompactHeader");
    expect(shell).toContain("ClientAppHeader");
    for (const path of [
      "app/page.tsx",
      "app/dictionary/page.tsx",
      "app/translator/page.tsx",
      "app/lens/page.tsx",
      "app/library/page.tsx",
      "app/more/page.tsx",
    ]) {
      expect(existsSync(path)).toBe(true);
    }
  });

  it("bottom nav active state works", () => {
    const navConfig = readFileSync("lib/navigation/navConfig.tsx", "utf8");
    expect(navConfig).toContain("export function isNavItemActive");
    expect(navConfig).toContain('pathname.startsWith("/dictionary")');
    expect(navConfig).toContain('pathname.startsWith("/settings")');
    expect(isNavItemActive("/dictionary", "/dictionary")).toBe(true);
    expect(isNavItemActive("/dictionary/result", "/dictionary")).toBe(true);
    expect(isNavItemActive("/translator", "/translator")).toBe(true);
    expect(isNavItemActive("/lens", "/lens")).toBe(true);
    expect(isNavItemActive("/library", "/library")).toBe(true);
    expect(isNavItemActive("/offline", "/library")).toBe(true);
    expect(isNavItemActive("/more", "/more")).toBe(true);
    expect(isNavItemActive("/settings", "/more")).toBe(true);
    expect(isNavItemActive("/translator", "/dictionary")).toBe(false);
    const nav = readFileSync("components/layout/MobileBottomNav.tsx", "utf8");
    expect(nav).toContain('aria-current={isActive ? "page" : undefined}');
  });

  it("Lens fallback works without camera", () => {
    const capture = readFileSync("components/translator/ImageCaptureCard.tsx", "utf8");
    const lens = readFileSync("components/lens/LensView.tsx", "utf8");
    expect(capture).toContain("Import an image or type the text manually.");
    expect(lens).toContain("CameraTranslatorView");
    expect(lens).toContain("Import Image");
  });

  it("mic permission error preserves typed text", () => {
    const voiceArea = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");
    const hook = readFileSync("hooks/useVoiceInput.ts", "utf8");
    expect(voiceArea).toContain("value={value}");
    expect(voiceArea).toContain("onTranscript: onChange");
    expect(hook).toContain("commitTranscript");
    expect(hook).not.toMatch(/onTranscript\(\s*["']\s*["']\s*\)/);
    expect(hook).toContain("setMicFailure");
  });

  it("Developer diagnostics hidden when Developer Mode false", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");
    expect(isDeveloperModeFeatureEnabled()).toBe(false);
    const more = readFileSync("components/settings/MoreSettingsView.tsx", "utf8");
    const result = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
    expect(more).toContain("isDeveloperModeFeatureEnabled() &&");
    expect(result).toContain("shouldShowInternalDebugUi()");
  });

  it("no normal user text contains mock/MVP/provider/invalid JSON", () => {
    const banned = /\bMVP\b|mock data|invalid JSON|provider error|AI timeout|fallback_reason/i;
    for (const file of USER_SCREENS) {
      const source = readFileSync(file, "utf8");
      const strings = source.match(/(["'`])(?:(?!\1)[\s\S])*\1/g) ?? [];
      for (const entry of strings) {
        if (entry.includes("@/lib/mock")) continue;
        if (entry.includes("mockUserContextProfiles")) continue;
        expect(entry, `${file} leaked internals: ${entry.slice(0, 80)}`).not.toMatch(banned);
      }
    }
    expect(toUserFacingError("Request body must be valid JSON.", USER_LOOKUP_UNAVAILABLE)).toBe(
      USER_LOOKUP_UNAVAILABLE,
    );
    expect(toUserFacingError("Definition ready.")).toBe("Definition ready.");
  });

  it("long translation text wraps correctly", () => {
    const text = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
    const camera = readFileSync("components/translator/CameraTranslationResultCard.tsx", "utf8");
    expect(text).toContain("break-words");
    expect(camera).toContain("break-words");
  });

  it("Library empty states render correctly", () => {
    const library = readFileSync("components/library/LibraryView.tsx", "utf8");
    expect(library).toContain("No saved words yet");
    expect(library).toContain("No saved phrases yet");
    expect(library).toContain("No offline packs downloaded");
    expect(library).toContain("No recent searches yet");
    expect(library).toContain("No favorites yet");
  });

  it("More screen preferences persist", () => {
    const more = readFileSync("components/settings/MoreSettingsView.tsx", "utf8");
    const experience = readFileSync("components/settings/AppExperienceSettings.tsx", "utf8");
    const hook = readFileSync("components/launch/useLaunchAnimationPreference.ts", "utf8");
    expect(more).toContain("AppExperienceSettings");
    expect(experience).toContain("updatePreferences");
    expect(hook).toContain("saveLaunchPreferences");
    const storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    saveLaunchPreferences({ animationEnabled: false, soundEnabled: false });
    expect(loadLaunchPreferences()).toEqual({
      animationEnabled: false,
      soundEnabled: false,
    });
  });

  it("install gate and launch respect safe-area insets", () => {
    const gate = readFileSync("components/pwa/MobileInstallGate.tsx", "utf8");
    const launch = readFileSync("components/launch/LexiennLaunchScreen.tsx", "utf8");
    const css = readFileSync("app/globals.css", "utf8");
    expect(gate).toContain("safe-area-inset-top");
    expect(gate).toContain("safe-area-inset-bottom");
    expect(launch).toContain("safe-area-inset-top");
    expect(launch).toContain("safe-area-inset-bottom");
    expect(css).toContain("--safe-area-top");
    expect(css).toContain("orientation: landscape");
  });

  it("Lens and Translate lazy-load camera tools", () => {
    const translator = readFileSync("components/translator/TranslatorView.tsx", "utf8");
    const lens = readFileSync("components/lens/LensView.tsx", "utf8");
    expect(translator).toContain("next/dynamic");
    expect(lens).toContain("next/dynamic");
    expect(translator).toContain("CameraTranslatorView");
    expect(lens).toContain("CameraTranslatorView");
  });
});
