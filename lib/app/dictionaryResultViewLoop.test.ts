import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("dictionary result view render loop regression", () => {
  const dictionaryResult = readFileSync("components/dictionary/DictionaryResultView.tsx", "utf8");
  const activeRequest = readFileSync("hooks/useActiveRequest.ts", "utf8");
  const resultChromeHook = readFileSync("hooks/useResultPageChrome.ts", "utf8");

  it("builds a stable request key from primitive URL and preference values", () => {
    expect(dictionaryResult).toContain("buildResultRequestKey");
    expect(dictionaryResult).toContain("buildDictionaryRequestKey");
    expect(dictionaryResult).toContain("const requestKey = useMemo");
    expect(dictionaryResult).toContain("inputFromUrl");
    expect(dictionaryResult).toContain("preferences.default_source_language");
    expect(dictionaryResult).not.toMatch(/useEffect\([\s\S]*?\],\s*\[[^\]]*searchParams[^\]]*\]\)/);
  });

  it("runs the load effect only when requestKey changes", () => {
    const requestKeyEffect = dictionaryResult.slice(
      dictionaryResult.indexOf("if (!requestKey)"),
      dictionaryResult.indexOf("}, [requestKey]);") + "}, [requestKey]);".length,
    );
    expect(requestKeyEffect).toContain("if (!requestKey)");
    expect(requestKeyEffect).toContain("[requestKey]");
    expect(requestKeyEffect).toContain("searchParamsRef.current");
    expect(requestKeyEffect).toContain("preferencesRef.current");
    expect(requestKeyEffect).not.toMatch(/},\s*\[[^\]]*searchParams[^\]]*\]\)/);
    expect(requestKeyEffect).not.toMatch(/},\s*\[[^\]]*preferences[^\]]*\]\)/);
  });

  it("does not call setLoading on unmount cleanup", () => {
    const unmountCleanup = dictionaryResult.slice(
      dictionaryResult.indexOf("useEffect(() => {"),
      dictionaryResult.indexOf("if (!requestKey)"),
    );
    expect(unmountCleanup).toContain("loadGenerationRef.current += 1");
    expect(unmountCleanup).not.toContain("setLoading");
    expect(unmountCleanup).not.toContain("usePathname");
  });

  it("reads search params and preferences from refs inside the load effect", () => {
    expect(dictionaryResult).toContain("searchParamsRef");
    expect(dictionaryResult).toContain("preferencesRef");
    expect(dictionaryResult).toContain("activeRequestRef");
    expect(dictionaryResult).toContain("searchParamsRef.current");
    expect(dictionaryResult).toContain("preferencesRef.current");
    expect(dictionaryResult).toContain("activeRequestRef.current");
  });

  it("guards state updates with equality checks to avoid redundant renders", () => {
    expect(dictionaryResult).toContain("areDictionaryResultsEquivalent");
    expect(dictionaryResult).toContain("setLoading((previous) => (previous ? previous : true))");
    expect(dictionaryResult).toContain("setFetchError((previous) => (previous === message ? previous : message))");
    expect(dictionaryResult).toContain(
      "areDictionaryResultsEquivalent(previous, next) ? previous : next",
    );
  });

  it("hydrates session storage once per request key inside the load effect", () => {
    expect(dictionaryResult).toContain("hydratedRequestKeyRef");
    expect(dictionaryResult).toContain("loadDictionaryResult()");
    expect(dictionaryResult).not.toMatch(/loadDictionaryResult\(\)[\s\S]*?useState/);
    const hydrationBlock = dictionaryResult.slice(
      dictionaryResult.indexOf("hydratedRequestKeyRef"),
      dictionaryResult.indexOf("const apiRequestKey"),
    );
    expect(hydrationBlock).toContain("if (hydratedRequestKeyRef.current !== requestKey)");
    expect(hydrationBlock).toContain("hydratedRequestKeyRef.current = requestKey");
  });

  it("exposes stable active request helpers for effect consumers", () => {
    expect(activeRequest).toContain("const abortActiveRequest = useCallback");
    expect(activeRequest).toContain("const beginRequest = useCallback");
    expect(activeRequest).toContain("const finishRequest = useCallback");
    expect(activeRequest).toContain("const isActiveRequest = useCallback");
    expect(activeRequest).toContain("const isAbortError = useCallback");
  });

  it("keeps result page chrome registration DOM-only without React state loops", () => {
    expect(resultChromeHook).not.toContain("useState");
    expect(resultChromeHook).toContain("classList.add");
    expect(resultChromeHook).toContain("classList.remove");
    expect(resultChromeHook).toContain("[enabled]");
  });

  it("releases result interactions without pathname-driven state churn", () => {
    expect(dictionaryResult).toContain("releaseResultInteractions");
    expect(dictionaryResult).toContain("setLoading((previous) => (previous ? false : previous))");
    expect(dictionaryResult).not.toContain("usePathname");
  });

  it("preserves result page tap-freeze architecture hooks", () => {
    expect(dictionaryResult).toContain("useResultPageChrome");
    expect(dictionaryResult).toContain("ResultPageHomeButton");
    expect(dictionaryResult).toContain("abortActiveRequest");
    expect(dictionaryResult).toContain("stopVoicePlayback");
  });
});
