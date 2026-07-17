"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  toUserFacingError,
  USER_LOOKUP_UNAVAILABLE,
} from "@/lib/ui/userFacingErrors";
import { buildDictionaryRequestKey, dictionaryQueriesMatch } from "@/lib/request/requestKeys";
import type { DictionaryQuery } from "@/lib/schemas";
import type { UserPreferences } from "@/lib/settings/userPreferences";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";

function areDictionaryResultsEquivalent(
  previous: StoredDictionaryResult | null,
  next: StoredDictionaryResult | null,
): boolean {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return dictionaryQueriesMatch(previous.query, next.query);
}

function buildResultRequestKey(
  searchParams: URLSearchParams,
  preferences: UserPreferences,
): string {
  const query = buildDictionaryQueryFromSearchParams(searchParams, preferences);
  if (!query) return "";
  return buildDictionaryRequestKey(query);
}

export function DictionaryResultView() {
  const searchParams = useSearchParams();
  const { preferences } = useUserPreferences();
  const activeRequest = useActiveRequest();
  const [result, setResult] = useState<StoredDictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const loadGenerationRef = useRef(0);
  const hydratedRequestKeyRef = useRef<string | null>(null);

  const searchParamsRef = useRef(searchParams);
  const preferencesRef = useRef(preferences);
  const activeRequestRef = useRef(activeRequest);

  searchParamsRef.current = searchParams;
  preferencesRef.current = preferences;
  activeRequestRef.current = activeRequest;

  const inputFromUrl = searchParams.get("input")?.trim() ?? "";
  const sourceFromUrl = searchParams.get("source") ?? "";
  const targetFromUrl = searchParams.get("target") ?? "";
  const contextFromUrl = searchParams.get("context") ?? "";
  const levelFromUrl = searchParams.get("level") ?? "";
  const modeFromUrl = searchParams.get("mode") ?? "";

  const requestKey = useMemo(() => {
    const params = new URLSearchParams();
    if (inputFromUrl) params.set("input", inputFromUrl);
    if (sourceFromUrl) params.set("source", sourceFromUrl);
    if (targetFromUrl) params.set("target", targetFromUrl);
    if (contextFromUrl) params.set("context", contextFromUrl);
    if (levelFromUrl) params.set("level", levelFromUrl);
    if (modeFromUrl) params.set("mode", modeFromUrl);
    const preferenceDefaults: Pick<
      UserPreferences,
      | "default_source_language"
      | "default_target_language"
      | "default_user_context"
      | "default_explanation_level"
    > = {
      default_source_language: preferences.default_source_language,
      default_target_language: preferences.default_target_language,
      default_user_context: preferences.default_user_context,
      default_explanation_level: preferences.default_explanation_level,
    };
    return buildResultRequestKey(params, preferenceDefaults as UserPreferences);
  }, [
    inputFromUrl,
    sourceFromUrl,
    targetFromUrl,
    contextFromUrl,
    levelFromUrl,
    modeFromUrl,
    preferences.default_source_language,
    preferences.default_target_language,
    preferences.default_user_context,
    preferences.default_explanation_level,
  ]);

  const showResultChrome = Boolean(result) && !loading && !fetchError;
  useResultPageChrome(showResultChrome);

  const releaseResultInteractions = useCallback(() => {
    loadGenerationRef.current += 1;
    activeRequestRef.current.abortActiveRequest();
    stopVoicePlayback();
    setLoading((previous) => (previous ? false : previous));
  }, []);

  useEffect(() => {
    return () => {
      loadGenerationRef.current += 1;
      activeRequestRef.current.abortActiveRequest();
      stopVoicePlayback();
    };
  }, []);

  useEffect(() => {
    if (!requestKey) {
      setFetchError((previous) => (previous === null ? previous : null));
      setFromCache((previous) => (previous ? false : previous));
      setLoading((previous) => (previous ? false : previous));
      setResult((previous) => (previous === null ? previous : null));
      return;
    }

    let cancelled = false;
    const generation = ++loadGenerationRef.current;

    const query = buildDictionaryQueryFromSearchParams(
      searchParamsRef.current,
      preferencesRef.current,
    ) as DictionaryQuery | null;

    if (!query) {
      setResult((previous) => (previous === null ? previous : null));
      setLoading((previous) => (previous ? false : previous));
      setFetchError((previous) =>
        previous === "Invalid dictionary lookup parameters."
          ? previous
          : "Invalid dictionary lookup parameters.",
      );
      return;
    }

    const resolvedQuery = query;

    async function run() {
      const { beginRequest, finishRequest, isActiveRequest, isAbortError } =
        activeRequestRef.current;

      setLoading((previous) => (previous ? previous : true));
      setFetchError((previous) => (previous === null ? previous : null));
      setFromCache((previous) => (previous ? false : previous));

      if (hydratedRequestKeyRef.current !== requestKey) {
        const stored = loadDictionaryResult();
        if (stored && dictionaryQueriesMatch(stored.query, resolvedQuery)) {
          hydratedRequestKeyRef.current = requestKey;
          if (cancelled || generation !== loadGenerationRef.current) return;
          setResult((previous) =>
            areDictionaryResultsEquivalent(previous, stored) ? previous : stored,
          );
          setLoading((previous) => (previous ? false : previous));
          return;
        }
        hydratedRequestKeyRef.current = requestKey;
      }

      const apiRequestKey = buildDictionaryRequestKey(resolvedQuery);
      const signal = beginRequest(apiRequestKey);

      try {
        const { response, fromCache: cached } = await generateDictionaryEntryViaApi(resolvedQuery, {
          signal,
        });
        if (cancelled || generation !== loadGenerationRef.current) return;
        if (!isActiveRequest(apiRequestKey)) return;

        const next: StoredDictionaryResult = {
          query: response.query,
          entry: response.entry,
          source: response.source,
          diagnostics: response.diagnostics,
        };
        saveDictionaryResult(next);
        setResult((previous) =>
          areDictionaryResultsEquivalent(previous, next) ? previous : next,
        );
        setFromCache((previous) => (previous === cached ? previous : cached));
      } catch (error) {
        if (cancelled || generation !== loadGenerationRef.current) return;
        if (isAbortError(error) || !isActiveRequest(apiRequestKey)) return;
        setResult((previous) => (previous === null ? previous : null));
        const message =
          error instanceof DictionaryApiError
            ? toUserFacingError(error.message, USER_LOOKUP_UNAVAILABLE)
            : "Could not load this result. Please try again.";
        setFetchError((previous) => (previous === message ? previous : message));
        if (!(error instanceof DictionaryApiError)) {
          console.error("[dictionary.result] unexpected_error", error);
        }
      } finally {
        finishRequest(apiRequestKey);
        if (!cancelled && generation === loadGenerationRef.current) {
          setLoading((previous) => (previous ? false : previous));
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      loadGenerationRef.current += 1;
      activeRequestRef.current.abortActiveRequest();
    };
  }, [requestKey]);

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
