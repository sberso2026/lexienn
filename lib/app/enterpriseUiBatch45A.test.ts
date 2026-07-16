import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOME_ROUTE } from "@/lib/app/appBoot";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

describe("Batch 45A enterprise UI foundation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the Lexienn logo, brand name, and current page title in the header", () => {
    const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
    expect(header).toContain("LexiennBrandLogo");
    expect(header).toContain("Lexienn");
    expect(header).toContain("getPageTitle(pathname)");
    expect(header).toContain("{pageTitle}");
  });

  it("renders exactly Define, Translate, Lens, Library, and More in primary navigation", () => {
    const nav = readFileSync("lib/navigation/navConfig.tsx", "utf8");
    const labels = [...nav.matchAll(/shortLabel: "([^"]+)"/g)].map((match) => match[1]);
    expect(labels).toEqual([
      "Define",
      "Translate",
      "Lens",
      "Library",
      "More",
    ]);
    expect(labels).toHaveLength(5);
  });

  it("links the header brand to Home", () => {
    const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
    expect(HOME_ROUTE).toBe("/");
    expect(header).toContain("href={HOME_ROUTE}");
    expect(header).toContain('aria-label="Go to Lexienn home"');
  });

  it("routes every home quick action to an existing feature", () => {
    const dashboard = readFileSync("components/home/HomeDashboard.tsx", "utf8");
    for (const route of ["/dictionary", "/translator", "/lens", "/offline"]) {
      expect(dashboard).toContain(`href: "${route}"`);
    }
    for (const label of [
      "Define a word",
      "Translate speech",
      "Scan text",
      "Use offline pack",
    ]) {
      expect(dashboard).toContain(label);
    }
  });

  it.each([
    ["/lens", "app/lens/page.tsx", "Lens"],
    ["/library", "app/library/page.tsx", "Library"],
    ["/more", "app/more/page.tsx", "More"],
  ])("%s route shell renders", (_route, file, title) => {
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toContain(title);
  });

  it("hides developer diagnostics when the public Developer Mode flag is false", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");
    const morePage = readFileSync("app/more/page.tsx", "utf8");
    expect(isDeveloperModeFeatureEnabled()).toBe(false);
    expect(morePage).toContain("developerModeEnabled &&");
    expect(morePage).toContain("Developer Diagnostics");
  });

  it("preserves the mobile install gate and standalone launch flow", () => {
    const appShell = readFileSync("components/AppShell.tsx", "utf8");
    const launchRule = readFileSync("lib/launch/shouldShowLaunchScreen.ts", "utf8");
    expect(appShell).toContain("shouldShowMobileInstallGate");
    expect(appShell).toContain("MobileInstallGate");
    expect(appShell).toContain("LexiennLaunchScreen");
    expect(launchRule).toContain("isStandaloneApp()");
  });

  it("preserves existing dictionary and translator routes", () => {
    const dictionary = readFileSync("app/dictionary/page.tsx", "utf8");
    const translator = readFileSync("app/translator/page.tsx", "utf8");
    expect(dictionary).toContain("DictionaryPageContent");
    expect(translator).toContain("TranslatorView");
  });

  it("keeps camera OCR available in both Translator and Lens", () => {
    const translator = readFileSync("components/translator/TranslatorView.tsx", "utf8");
    const lens = readFileSync("app/lens/page.tsx", "utf8");
    expect(translator).toContain("CameraTranslatorView");
    expect(lens).toContain("CameraTranslatorView");
  });
});
