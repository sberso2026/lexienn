"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { ResultPageHomeButton } from "@/components/dictionary/ResultPageHomeButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { useActiveRequest } from "@/hooks/useActiveRequest";
import { useResultPageChrome } from "@/hooks/useResultPageChrome";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { buildDictionaryQueryFromSearchParams } from "@/lib/dictionary/buildDictionaryQueryFromParams";
import {
  DictionaryApiError,
  generateDictionaryEntryViaApi,
} from "@/lib/dictionary/dictionaryApiClient";
import {
  loadDictionaryResult,
  saveDictionaryResult,
  type StoredDictionaryResult,
} from "@/lib/dictionary/resultStorage";
import { buildDictionaryRequestKey, dictionaryQueriesMatch } from "@/lib/request/requestKeys";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";

function paramsMatchResult(
  searchParams: URLSearchParams,
  result: StoredDictionaryResult,
): boolean {
  const input = searchParams.get("input");
  const target = searchParams.get("target");
  const context = searchParams.get("context");

  if (!input && !target && !context) return true;

  return (
    (!input || input === result.query.input_text) &&
    (!target || target === result.query.target_language) &&
    (!context || context === result.query.user_context)
  );
}

export function DictionaryResultView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { preferences } = useUserPreferences();
  const { beginRequest, finishRequest, isActiveRequest, isAbortError, abortActiveRequest } =
    useActiveRequest();
  const [result, setResult] = useState<StoredDictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const loadGenerationRef = useRef(0);

  const inputFromUrl = searchParams.get("input")?.trim() ?? "";
  const showResultChrome = Boolean(result) && !loading && !fetchError;

  useResultPageChrome(showResultChrome);

  const releaseResultInteractions = useCallback(() => {
    loadGenerationRef.current += 1;
    abortActiveRequest();
    stopVoicePlayback();
    setLoading(false);
  }, [abortActiveRequest]);

  useEffect(() => {
    return () => {
      releaseResultInteractions();
    };
  }, [pathname, releaseResultInteractions]);

  useEffect(() => {
    const generation = ++loadGenerationRef.current;

    async function loadResult() {
      try {
        setFetchError(null);
        setFromCache(false);

        if (inputFromUrl) {
          setLoading(true);
          const query = buildDictionaryQueryFromSearchParams(searchParams, preferences);
          if (!query) {
            if (generation !== loadGenerationRef.current) return;
            setResult(null);
            setLoading(false);
            setFetchError("Invalid dictionary lookup parameters.");
            return;
          }

          const stored = loadDictionaryResult();
          if (stored && dictionaryQueriesMatch(stored.query, query)) {
            if (generation !== loadGenerationRef.current) return;
            setResult(stored);
            setLoading(false);
            return;
          }

          const requestKey = buildDictionaryRequestKey(query);
          const signal = beginRequest(requestKey);

          try {
            const { response, fromCache: cached } = await generateDictionaryEntryViaApi(
              query,
              { signal },
            );
            if (generation !== loadGenerationRef.current || !isActiveRequest(requestKey)) return;

            const next: StoredDictionaryResult = {
              query: response.query,
              entry: response.entry,
              source: response.source,
              diagnostics: response.diagnostics,
            };
            saveDictionaryResult(next);
            setResult(next);
            setFromCache(cached);
          } catch (error) {
            if (isAbortError(error) || generation !== loadGenerationRef.current) return;
            if (!isActiveRequest(requestKey)) return;
            setResult(null);
            setFetchError(
              error instanceof DictionaryApiError
                ? error.message
                : "Failed to load dictionary result.",
            );
          } finally {
            finishRequest(requestKey);
            if (generation === loadGenerationRef.current) {
              setLoading(false);
            }
          }
          return;
        }

        const stored = loadDictionaryResult();
        if (generation !== loadGenerationRef.current) return;
        if (stored && !paramsMatchResult(searchParams, stored)) {
          setResult(null);
        } else {
          setResult(stored);
        }
        setLoading(false);
      } catch (error) {
        console.error("[dictionary.result] unexpected_error", error);
        if (generation !== loadGenerationRef.current) return;
        setResult(null);
        setLoading(false);
        setFetchError("Failed to load dictionary result.");
      }
    }

    void loadResult();

    return () => {
      loadGenerationRef.current += 1;
      abortActiveRequest();
    };
  }, [inputFromUrl, searchParams, preferences, beginRequest, finishRequest, isActiveRequest, isAbortError, abortActiveRequest]);

  return (
    <>
      <ResultPageHomeButton onBeforeNavigate={releaseResultInteractions} />

      {loading && <LoadingState title="Looking up" label="Looking up…" />}

      {!loading && fetchError && (
        <div className="space-y-4">
          <CompactAlert variant="error">
            <strong>Lookup failed.</strong> {fetchError}
          </CompactAlert>
          <Link
            href="/dictionary"
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Try again
          </Link>
        </div>
      )}

      {!loading && !fetchError && !result && (
        <EmptyState
          title="No result found"
          description="Submit a lookup from the dictionary page to see a structured result here."
          action={
            <Link
              href="/dictionary"
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Back to search
            </Link>
          }
        />
      )}

      {!loading && !fetchError && result && (
        <>
          {fromCache && (
            <p className="mb-2 text-[10px] font-medium text-[var(--muted)]" role="status">
              Loaded from recent cache
            </p>
          )}
          <DictionaryResultCard
            query={result.query}
            entry={result.entry}
            source={result.source}
            diagnostics={result.diagnostics}
          />
        </>
      )}
    </>
  );
}
