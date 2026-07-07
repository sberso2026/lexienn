import { readFileSync } from "node:fs";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  HOME_ROUTE,
  isAppBootChecking,
  resolveAppBootState,
  shouldRenderSignInPanel,
} from "@/lib/app/appBoot";

describe("app boot state", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolveAppBootState is checking when window is unavailable", () => {
    vi.stubGlobal("window", undefined);
    expect(resolveAppBootState()).toEqual({ auth: "checking", showSignIn: false });
    expect(isAppBootChecking(resolveAppBootState())).toBe(true);
  });

  it("defaults to local-first guest mode without sign-in on startup", () => {
    vi.stubGlobal("window", { location: { pathname: "/dictionary" } });
    const boot = resolveAppBootState();
    expect(boot.auth).toBe("local_guest");
    expect(boot.showSignIn).toBe(false);
    expect(shouldRenderSignInPanel(boot)).toBe(false);
  });
});

describe("PWA app shell layout and navigation", () => {
  const globals = readFileSync("app/globals.css", "utf8");
  const mobileShell = readFileSync("components/layout/MobileAppShell.tsx", "utf8");
  const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
  const appShell = readFileSync("components/AppShell.tsx", "utf8");
  const launch = readFileSync("components/launch/LexiennLaunchScreen.tsx", "utf8");
  const nav = readFileSync("lib/navigation/navConfig.tsx", "utf8");
  const home = readFileSync("app/page.tsx", "utf8");

  it("includes safe-area top and bottom handling in the app shell", () => {
    expect(globals).toContain("--safe-area-top");
    expect(globals).toContain("--safe-area-bottom");
    expect(globals).toContain(".safe-area-top");
    expect(globals).toContain(".mobile-app-content");
    expect(globals).toContain("--app-header-offset-mobile");
    expect(globals).toContain("100dvh");
    expect(mobileShell).toContain("mobile-app-shell");
    expect(mobileShell).toContain("mobile-app-content");
    expect(mobileShell).not.toContain("safe-bottom");
  });

  it("renders fixed mobile header outside scrollable main content", () => {
    expect(mobileShell).toContain("<ClientAppHeader />");
    expect(mobileShell).toContain('id="main-content"');
    expect(mobileShell).toContain("mobile-app-content");
    expect(globals).toContain(".mobile-app-header");
    expect(globals).toContain("position: fixed");
    expect(globals).toContain("top: var(--mobile-content-top)");
    expect(globals).toContain("bottom: var(--mobile-content-bottom)");
  });

  it("CompactHeader mobile layout avoids overlapping absolute title positioning", () => {
    const mobileBlock = header.slice(header.indexOf("md:hidden"), header.indexOf("hidden h-[var(--header-height)]"));
    expect(header).toContain("safe-area-top");
    expect(header).toContain("flex-col");
    expect(mobileBlock).not.toContain("absolute");
    expect(header).toContain("truncate");
    expect(header).toContain("min-w-0");
    expect(header).toContain("LEXIENN");
  });

  it("does not render sign-in before auth boot completes", () => {
    expect(appShell).toContain('auth: "checking"');
    expect(appShell).toContain("isAppBootChecking");
    expect(appShell).toContain("showSignIn: false");
    expect(appShell).toContain("LexiennBootSplash");
    expect(launch).not.toContain("Enter Lexienn");
    expect(launch).toContain("Opening Lexienn");
  });

  it("links header home action to the dictionary route", () => {
    expect(header).toContain('aria-label="Go to Lexienn home"');
    expect(header).toContain(`href={HOME_ROUTE}`);
    expect(HOME_ROUTE).toBe("/dictionary");
    expect(nav).toContain('href: "/dictionary"');
    expect(nav).toContain('shortLabel: "Home"');
    expect(home).toContain('redirect("/dictionary")');
  });

  it("hides app content behind boot overlays until launch completes in standalone PWA boot", () => {
    expect(appShell).toContain("appContentVisible");
    expect(appShell).toContain("bootOverlayVisible");
    expect(appShell).toContain("{children}");
    expect(appShell).not.toContain('aria-hidden={!appContentVisible}');
    expect(appShell).toContain("shouldShowMobileInstallGate");
    expect(appShell).toContain("shouldShowLaunchScreen");
  });
});
