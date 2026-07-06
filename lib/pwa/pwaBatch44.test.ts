import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it, vi, afterEach } from "vitest";
import { setInstallGateBypassed } from "@/lib/pwa/installGateBypass";
import { shouldShowMobileInstallGate } from "@/lib/pwa/shouldShowMobileInstallGate";

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
    standalone: standalone,
  });
  vi.stubGlobal("window", {
    sessionStorage: session,
    location: { hostname },
    navigator: {
      userAgent: mobile
        ? ua
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      platform: mobile ? "iPhone" : "Win32",
      maxTouchPoints: mobile ? 5 : 0,
      standalone: standalone,
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

describe("PWA batch 44", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("manifest contains Lexienn standalone metadata", () => {
    const manifest = readFileSync("app/manifest.ts", "utf8");
    expect(manifest).toContain('name: "Lexienn"');
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain('start_url: "/"');
    expect(manifest).toContain("icon-192x192.png");
    expect(manifest).toContain("maskable-icon-512x512.png");
  });

  it("layout contains Apple touch icon and manifest links", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("apple-touch-icon.png");
    expect(layout).toContain("manifest.webmanifest");
    expect(layout).toContain("applicationName");
  });

  it("header renders Lexienn logo", () => {
    const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
    expect(header).toContain("LexiennBrandLogo");
    expect(header).toContain("Lexienn");
  });

  it("MobileInstallGate uses custom step grid for iOS Safari instructions", () => {
    const gate = readFileSync("components/pwa/MobileInstallGate.tsx", "utf8");
    const safariBlock = gate.slice(
      gate.indexOf('iosGuideMode === "safari"'),
      gate.indexOf('iosGuideMode === "open-in-safari"'),
    );
    expect(gate).toContain("square-with-up-arrow icon at the bottom center of Safari");
    expect(gate).not.toContain("Tap the Share button.");
    expect(gate).toContain('aria-label="Safari share icon"');
    expect(safariBlock).toContain("install-steps");
    expect(gate).toContain("step-number");
    expect(gate).toContain("step-content");
    expect(safariBlock).not.toContain("list-decimal");
    expect(safariBlock).toContain("SafariShareIcon");
    expect(safariBlock).toContain("InstallStep number={1}");
    expect(gate).toContain('className="sr-only"');
    expect(gate).toContain("Can&apos;t see the icon?");
  });

  it("AppShell blocks app content behind install gate", () => {
    const shell = readFileSync("components/AppShell.tsx", "utf8");
    expect(shell).toContain("MobileInstallGate");
    expect(shell).toContain("shouldShowMobileInstallGate");
    expect(shell).not.toContain("InstallAppPrompt");
  });

  it("launch screen only runs in standalone mode", () => {
    const launch = readFileSync("lib/launch/shouldShowLaunchScreen.ts", "utf8");
    const fn = launch.slice(
      launch.indexOf("export function shouldShowLaunchScreen"),
      launch.indexOf("export function shouldUseReducedMotionLaunch"),
    );
    expect(fn).toContain("!isStandaloneApp()");
    expect(fn).not.toContain("hasSeenLaunchEver");
  });

  it("service worker does not cache /api/*", () => {
    const sw = readFileSync("public/sw.js", "utf8");
    expect(sw).toContain('url.pathname.startsWith("/api/")');
    expect(sw).toContain("return;");
  });

  it("PWA diagnostics only in developer settings panel file", () => {
    const settings = readFileSync("components/settings/SettingsView.tsx", "utf8");
    const panel = readFileSync("components/settings/PwaDiagnosticsPanel.tsx", "utf8");
    expect(settings).toContain("PwaDiagnosticsPanel");
    expect(settings).toContain("developerModeActive");
    expect(panel).toContain("isStandalone");
    expect(panel).toContain("apple-touch-icon.png");
  });

  it("MobileInstallGate shows on iPhone browser mode", () => {
    installWindow({ mobile: true, standalone: false });
    expect(shouldShowMobileInstallGate()).toBe(true);
  });

  it("MobileInstallGate hides in standalone mode", () => {
    installWindow({ mobile: true, standalone: true });
    expect(shouldShowMobileInstallGate()).toBe(false);
  });

  it("desktop is not blocked by install gate", () => {
    installWindow({ mobile: false, standalone: false });
    expect(shouldShowMobileInstallGate()).toBe(false);
  });

  it("localhost is not blocked by install gate", () => {
    installWindow({ mobile: true, standalone: false, hostname: "localhost" });
    expect(shouldShowMobileInstallGate()).toBe(false);
  });

  it("developer bypass skips install gate", () => {
    installWindow({ mobile: true, standalone: false });
    setInstallGateBypassed();
    expect(shouldShowMobileInstallGate()).toBe(false);
  });

  it("brand icon assets exist after generation", () => {
    for (const asset of [
      "public/brand/lexienn-logo-transparent.png",
      "public/brand/lexienn-logo-icon.png",
      "public/brand/lexienn-logo-mark.png",
      "public/apple-touch-icon.png",
    ]) {
      expect(existsSync(asset)).toBe(true);
    }
  });

  it("home route redirects to translator", () => {
    const home = readFileSync("app/page.tsx", "utf8");
    expect(home).toContain('redirect("/translator")');
  });

  it("Android install button calls beforeinstallprompt prompt", () => {
    const gate = readFileSync("components/pwa/MobileInstallGate.tsx", "utf8");
    expect(gate).toContain("deferredPrompt.prompt()");
  });
});
