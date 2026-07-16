import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("result page interaction freeze regression", () => {
  const globals = readFileSync("app/globals.css", "utf8");
  const mobileShell = readFileSync("components/layout/MobileAppShell.tsx", "utf8");
  const bottomNav = readFileSync("components/layout/MobileBottomNav.tsx", "utf8");
  const bottomActionBar = readFileSync("components/ui/BottomActionBar.tsx", "utf8");
  const dictionaryResult = readFileSync("components/dictionary/DictionaryResultView.tsx", "utf8");
  const resultHomeButton = readFileSync("components/dictionary/ResultPageHomeButton.tsx", "utf8");
  const dictionaryResultCard = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
  const resultChromeHook = readFileSync("hooks/useResultPageChrome.ts", "utf8");
  const tapDiagnostics = readFileSync("lib/app/tapDiagnostics.ts", "utf8");
  const iconButton = readFileSync("components/ui/IconButton.tsx", "utf8");

  it("defines strict mobile layer order for header, action bar, nav, and content", () => {
    expect(globals).toContain(".mobile-app-header");
    expect(globals).toContain("z-index: 100");
    expect(globals).toContain(".result-action-bar-shell");
    expect(globals).toContain("z-index: 90");
    expect(globals).toContain(".mobile-bottom-nav");
    expect(globals).toContain("z-index: 80");
    expect(globals).toContain(".mobile-app-content");
    expect(globals).toContain("z-index: 1");
  });

  it("renders result action bar outside the scroll container via chrome root portal", () => {
    expect(mobileShell).toContain('id="mobile-app-chrome-root"');
    expect(bottomActionBar).toContain("createPortal");
    expect(bottomActionBar).toContain("mobile-app-chrome-root");
    expect(bottomActionBar).toContain("result-action-bar-shell");
  });

  it("uses pointer-events-none on action bar shell and pointer-events-auto on buttons", () => {
    expect(globals).toContain("pointer-events: none");
    expect(globals).toContain(".result-action-bar-buttons");
    expect(globals).toContain("pointer-events: auto");
    expect(globals).toContain(".result-action-bar-shell button");
  });

  it("insets scroll content for result action bar and bottom nav", () => {
    expect(globals).toContain("--result-action-bar-height");
    expect(globals).toContain(".mobile-app-content--with-result-actions");
    expect(resultChromeHook).toContain("mobile-app-content--with-result-actions");
    expect(dictionaryResult).toContain("useResultPageChrome");
  });

  it("provides an explicit Result page Home escape that routes to /dictionary", () => {
    expect(resultHomeButton).toContain('type="button"');
    expect(resultHomeButton).toContain('aria-label="Back to dictionary home"');
    expect(resultHomeButton).toContain('router.push("/dictionary")');
    expect(resultHomeButton).toContain("stopVoicePlayback");
    expect(dictionaryResult).toContain("ResultPageHomeButton");
    expect(dictionaryResult).toContain("releaseResultInteractions");
  });

  it("aborts active request and audio on route escape", () => {
    expect(dictionaryResult).toContain("abortActiveRequest");
    expect(dictionaryResult).toContain("stopVoicePlayback");
    expect(dictionaryResult).toContain("loadGenerationRef.current += 1");
    expect(dictionaryResult).toContain("releaseResultInteractions");
    expect(dictionaryResult).not.toContain("usePathname");
  });

  it("keeps bottom navigation outside the scroll layer and tappable", () => {
    expect(bottomNav).toContain("mobile-bottom-nav");
    expect(bottomNav).not.toContain("z-50");
    expect(bottomNav).toContain("<Link");
    expect(bottomNav).toContain("touch-manipulation");
  });

  it("keeps result action buttons as type=button without nested link/button markup", () => {
    expect(iconButton).toContain('type="button"');
    expect(dictionaryResultCard).not.toContain("<Link href=\"/dictionary\">\n          <IconButton");
    expect(dictionaryResultCard).toContain('label="Play audio"');
    expect(dictionaryResultCard).toContain('label={copied ? "Copied" : "Copy"}');
    expect(dictionaryResultCard).toContain('label="Save"');
    expect(dictionaryResultCard).toContain('label="Explain"');
    expect(dictionaryResultCard).toContain('label="Add to Library"');
    expect(dictionaryResultCard).toContain("Suggest a correction");
  });

  it("scopes audio disabled state to the play button only", () => {
    expect(dictionaryResultCard).toContain("disabled={source === \"unavailable\" || isPlaying}");
    expect(dictionaryResultCard).not.toMatch(/<BottomActionBar[^>]*disabled=/);
  });

  it("exposes opt-in tap diagnostics without logging user text", () => {
    expect(tapDiagnostics).toContain("__lexiennDebugTap");
    expect(tapDiagnostics).toContain("lexienn_debug_taps");
    expect(tapDiagnostics).toContain("debugTap");
    expect(tapDiagnostics).toContain("isTapDiagnosticsEnabled");
    expect(tapDiagnostics).not.toContain("input_text");
  });
});
