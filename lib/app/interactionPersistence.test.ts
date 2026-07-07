import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("interaction persistence after entry creation", () => {
  const appShell = readFileSync("components/AppShell.tsx", "utf8");
  const mobileShell = readFileSync("components/layout/MobileAppShell.tsx", "utf8");
  const globals = readFileSync("app/globals.css", "utf8");
  const sw = readFileSync("public/sw.js", "utf8");
  const dictionaryForm = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
  const dictionaryResult = readFileSync("components/dictionary/DictionaryResultView.tsx", "utf8");
  const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
  const bottomActionBar = readFileSync("components/ui/BottomActionBar.tsx", "utf8");

  it("does not use innerHTML or full DOM replacement for entry UI", () => {
    const sources = [appShell, mobileShell, dictionaryForm, dictionaryResult, translator];
    for (const source of sources) {
      expect(source).not.toContain("innerHTML");
      expect(source).not.toContain("dangerouslySetInnerHTML");
      expect(source).not.toContain("replaceChildren");
    }
  });

  it("keeps navigation chrome mounted after install gate instead of unmounting children", () => {
    expect(appShell).toContain("{children}");
    expect(appShell).not.toContain("appContentVisible ? children : null");
    expect(appShell).toContain("bootOverlayVisible");
    expect(mobileShell).toContain("<ClientAppHeader />");
    expect(mobileShell).toContain("<MobileBottomNav />");
    expect(mobileShell).toContain('id="mobile-app-chrome-root"');
  });

  it("keeps header fixed and outside the scroll container", () => {
    expect(globals).toContain(".mobile-app-header");
    expect(globals).toContain("position: fixed");
    expect(globals).toContain("z-index: 100");
    expect(mobileShell.indexOf("<ClientAppHeader />")).toBeLessThan(
      mobileShell.indexOf('id="main-content"'),
    );
  });

  it("portals result action bar outside scroll content for iOS hit testing", () => {
    expect(bottomActionBar).toContain("createPortal");
    expect(bottomActionBar).toContain("useLayoutEffect");
    expect(bottomActionBar).toContain("result-action-bar-shell");
    expect(globals).toContain(".result-action-bar-shell");
    expect(globals).toContain("pointer-events: none");
    expect(globals).toContain("pointer-events: auto");
  });

  it("ensures bottom nav remains above scroll layer and receives pointer events", () => {
    expect(globals).toContain(".mobile-bottom-nav");
    expect(globals).toContain("z-index: 80");
    expect(globals).toContain("pointer-events: auto");
    expect(globals).toContain("touch-action: manipulation");
  });

  it("avoids iOS scroll compositor that blocks taps on fixed chrome", () => {
    expect(globals).not.toContain("-webkit-overflow-scrolling: touch");
    expect(globals).toContain("touch-action: pan-y");
  });

  it("wraps entry creation in try/catch so runtime errors do not freeze UI state", () => {
    expect(dictionaryForm).toContain("unexpected_error");
    expect(dictionaryResult).toContain("unexpected_error");
    expect(translator).toContain("unexpected_error");
    expect(dictionaryForm).toContain("finishRequest");
    expect(dictionaryResult).toContain("finishRequest");
    expect(translator).toContain("finishRequest");
  });

  it("does not cache HTML or dynamic routes in the service worker", () => {
    expect(sw).toContain('request.mode === "navigate"');
    expect(sw).toContain("return;");
    expect(sw).toContain('url.pathname.startsWith("/_next/")');
    expect(sw).toContain('url.pathname.startsWith("/api/")');
  });
});
