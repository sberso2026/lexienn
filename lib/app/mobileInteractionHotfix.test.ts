import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile interaction hotfix", () => {
  const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
  const dictionaryForm = readFileSync("components/dictionary/DictionaryLookupForm.tsx", "utf8");
  const dictionaryResult = readFileSync("components/dictionary/DictionaryResultView.tsx", "utf8");
  const appShell = readFileSync("components/AppShell.tsx", "utf8");
  const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
  const voiceInput = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");

  it("resets translator loading state in finally after stale or aborted requests", () => {
    expect(translator).toContain("finally");
    expect(translator).toContain("submitGenerationRef");
    expect(translator).toContain("finishRequest");
    expect(translator).toContain('state === "translating" ? "ready" : state');
    expect(translator).not.toContain('"cancelled"');
  });

  it("resets dictionary submit loading state in finally", () => {
    expect(dictionaryForm).toContain("finally");
    expect(dictionaryForm).toContain("submitGenerationRef");
    expect(dictionaryForm).toContain("finishRequest");
    expect(dictionaryForm).toContain("setIsSubmitting(false)");
  });

  it("always clears dictionary result loading overlay in finally", () => {
    const finallyBlock = dictionaryResult.slice(dictionaryResult.indexOf("} finally {"));
    expect(finallyBlock).toMatch(/setLoading\(\(previous\) => \(previous \? false : previous\)\)/);
    expect(finallyBlock).not.toMatch(/if \(isActiveRequest\(requestKey\)\)/);
  });

  it("does not unmount navigation chrome when boot overlays are visible", () => {
    expect(appShell).toContain("{children}");
    expect(appShell).not.toContain("appContentVisible ? children : null");
    expect(appShell).not.toContain('className={appContentVisible ? "contents" : "hidden"}');
  });

  it("keeps hidden voice chip non-interactive", () => {
    expect(header).toContain("pointer-events-none");
    expect(header).toContain('aria-hidden={!voiceReady}');
  });

  it("clear button remains available on translator after result", () => {
    expect(translator).toContain("showClear={sentence.trim().length > 0 || Boolean(result)}");
    expect(translator).toContain("handleClear");
    expect(voiceInput).toContain('label="Clear previous entry"');
  });
});
