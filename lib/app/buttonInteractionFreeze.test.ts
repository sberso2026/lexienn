import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("button interaction freeze regression", () => {
  const globals = readFileSync("app/globals.css", "utf8");
  const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
  const dictionaryForm = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
  const dictionaryResult = readFileSync("components/dictionary/DictionaryResultView.tsx", "utf8");
  const dictionaryResultCard = readFileSync("components/dictionary/DictionaryResultCard.tsx", "utf8");
  const appShell = readFileSync("components/AppShell.tsx", "utf8");
  const bootSplash = readFileSync("components/app/LexiennBootSplash.tsx", "utf8");
  const launchScreen = readFileSync("components/launch/LexiennLaunchScreen.tsx", "utf8");
  const activeRequest = readFileSync("hooks/useActiveRequest.ts", "utf8");
  const voiceInput = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");
  const voiceButton = readFileSync("components/speech/VoiceInputButton.tsx", "utf8");
  const iconButton = readFileSync("components/ui/IconButton.tsx", "utf8");
  const tapDiagnostics = readFileSync("lib/app/tapDiagnostics.ts", "utf8");
  const bottomNav = readFileSync("components/layout/MobileBottomNav.tsx", "utf8");

  it("uses fixed inset scroll area so content cannot cover header or bottom nav hit targets", () => {
    expect(globals).toContain("position: fixed");
    expect(globals).toContain("top: var(--mobile-content-top)");
    expect(globals).toContain("bottom: var(--mobile-content-bottom)");
    expect(globals).not.toMatch(/\.mobile-app-content\s*\{[^}]*height:\s*100dvh/s);
    expect(globals).not.toMatch(/\.mobile-app-content\s*\{[^}]*padding-top:/s);
  });

  it("avoids iOS scroll compositor blocking fixed chrome taps", () => {
    expect(globals).not.toContain("-webkit-overflow-scrolling: touch");
    expect(globals).toContain("touch-action: pan-y");
  });

  it("centralizes request completion cleanup in useActiveRequest", () => {
    expect(activeRequest).toContain("finishRequest");
    expect(translator).toContain("finishRequest");
    expect(dictionaryForm).toContain("finishRequest");
    expect(dictionaryResult).toContain("finishRequest");
  });

  it("guards translator state cleanup with submit generation", () => {
    expect(translator).toContain("submitGenerationRef");
    expect(translator).toContain("generation !== submitGenerationRef.current");
    expect(translator).toContain("finishRequest(requestKey)");
    expect(translator).toContain('state === "translating" ? "ready" : state');
  });

  it("guards dictionary form cleanup with submit generation", () => {
    expect(dictionaryForm).toContain("submitGenerationRef");
    expect(dictionaryForm).toContain("generation !== submitGenerationRef.current");
    expect(dictionaryForm).toContain("finishRequest(requestKey)");
    expect(dictionaryForm).toContain("setIsSubmitting(false)");
  });

  it("guards dictionary result loading cleanup with load generation", () => {
    expect(dictionaryResult).toContain("loadGenerationRef");
    expect(dictionaryResult).toContain("generation === loadGenerationRef.current");
    const finallyBlock = dictionaryResult.slice(dictionaryResult.indexOf("} finally {"));
    expect(finallyBlock).toContain("setLoading(false)");
    expect(finallyBlock).not.toMatch(/if \(isActiveRequest\(requestKey\)\)\s*\{\s*setLoading\(false\)/);
  });

  it("keeps clear available after translator results and clears generation on abort", () => {
    expect(translator).toContain("showClear={sentence.trim().length > 0 || Boolean(result)}");
    expect(translator).toContain("submitGenerationRef.current += 1");
    expect(voiceInput).toContain('label="Clear previous entry"');
  });

  it("does not keep hidden app shell children mounted after boot", () => {
    expect(appShell).toContain("bootOverlayVisible");
    expect(appShell).toContain("{children}");
    expect(appShell).not.toContain("appContentVisible ? children : null");
    expect(appShell).not.toContain('className={appContentVisible ? "contents" : "hidden"}');
  });

  it("layers boot overlays above app chrome without unmounting navigation", () => {
    expect(appShell).toContain("bootCompletedRef");
    expect(bootSplash).toContain("boot-overlay");
    expect(bootSplash).toContain("z-[200]");
    expect(launchScreen).toContain("boot-overlay");
  });

  it("unmounts launch screen after completion instead of leaving a hidden mounted overlay", () => {
    expect(appShell).toContain("{launchActive && <LexiennLaunchScreen");
    expect(launchScreen).toContain("pointer-events-none");
    expect(launchScreen).toContain("fadingOut");
  });

  it("uses type=button for non-submit controls in dictionary and translator flows", () => {
    expect(iconButton).toContain('type="button"');
    expect(voiceButton).toContain('type="button"');
    expect(dictionaryForm).toMatch(/type="submit"/);
    expect(translator).toMatch(/type="submit"/);
    expect(dictionaryForm).not.toContain("<Link href=\"/translator\"");
    expect(dictionaryResultCard).not.toContain("<Link href=\"/dictionary\">\n          <IconButton");
  });

  it("scopes translator disabled state to submit button only", () => {
    expect(translator).toContain('disabled={isSubmitting || sentence.trim().length === 0}');
    expect(translator).not.toContain("disabled={isSubmitting}");
    expect(translator).not.toMatch(/<form[^>]*disabled=/);
  });

  it("keeps bottom navigation links tappable after result views render", () => {
    expect(bottomNav).toContain("<Link");
    expect(bottomNav).toContain("touch-manipulation");
    expect(bottomNav).toContain('aria-label="Main navigation"');
  });

  it("exposes opt-in tap diagnostics without production logging of input text", () => {
    expect(tapDiagnostics).toContain("__lexiennDebugTap");
    expect(tapDiagnostics).toContain("isTapDiagnosticsEnabled");
    expect(tapDiagnostics).toContain("lexienn_debug_taps");
    expect(tapDiagnostics).not.toContain("input_text");
    expect(appShell).toContain("TapDiagnostics");
  });
});
