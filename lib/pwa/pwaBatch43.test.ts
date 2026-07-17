import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  dismissInstallPrompt,
  isInstallPromptDismissed,
} from "@/lib/pwa/installPromptStorage";

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

describe("PWA batch 43", () => {
  it("manifest contains standalone display, icons, and shortcuts", () => {
    const manifest = readFileSync("app/manifest.ts", "utf8");
    expect(manifest).toContain('name: "Lexienn"');
    expect(manifest).toContain('short_name: "Lexienn"');
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain("icon-192x192.png");
    expect(manifest).toContain("icon-512x512.png");
    expect(manifest).toContain("maskable-icon-192x192.png");
    expect(manifest).toContain("maskable-icon-512x512.png");
    expect(manifest).toContain("shortcuts");
    expect(manifest).toContain("Offline Packs");
    expect(manifest).toContain("categories");
  });

  it("layout includes apple-touch-icon and manifest metadata", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("apple-touch-icon.png");
    expect(layout).toContain("applicationName");
    expect(layout).toContain("AppShell");
    expect(layout).toContain("themeColor");
  });

  it("PWA icon assets exist", () => {
    for (const icon of [
      "public/icons/icon-192x192.png",
      "public/icons/icon-512x512.png",
      "public/icons/maskable-icon-192x192.png",
      "public/icons/maskable-icon-512x512.png",
      "public/apple-touch-icon.png",
      "public/favicon.png",
      "public/brand/lexienn-logo-transparent.png",
      "public/brand/lexienn-logo-icon.png",
    ]) {
      expect(existsSync(icon)).toBe(true);
    }
  });

  it("service worker and registration files exist", () => {
    expect(existsSync("public/sw.js")).toBe(true);
    expect(existsSync("lib/pwa/registerServiceWorker.ts")).toBe(true);
    expect(existsSync("components/pwa/ServiceWorkerRegister.tsx")).toBe(true);
  });

  it("install prompt component includes iOS guidance", () => {
    const prompt = readFileSync("components/pwa/InstallAppPrompt.tsx", "utf8");
    expect(prompt).toContain("Add to Home Screen");
    expect(prompt).toContain("isStandaloneApp");
    expect(prompt).toContain("beforeinstallprompt");
  });

  it("launch screen supports tap-to-start and skip", () => {
    const launch = readFileSync("components/launch/LexiennLaunchScreen.tsx", "utf8");
    expect(launch).toContain("Tap to open");
    expect(launch).toContain("Skip");
    expect(launch).toContain("playLaunchSound");
    expect(launch).toContain("loadLaunchPreferences");
  });

  it("settings include App Experience toggles", () => {
    const settings = readFileSync("components/settings/AppExperienceSettings.tsx", "utf8");
    expect(settings).toContain("Launch animation");
    expect(settings).toContain("Launch sound");
    expect(settings).toContain("Replay launch animation");
  });

  it("install prompt dismissal persists in localStorage", () => {
    const storage = createStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
    expect(isInstallPromptDismissed()).toBe(false);
    dismissInstallPrompt();
    expect(isInstallPromptDismissed()).toBe(true);
    vi.unstubAllGlobals();
  });
});
