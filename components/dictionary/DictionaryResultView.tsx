"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  loadDictionaryResult,
  type StoredDictionaryResult,
} from "@/lib/dictionary/resultStorage";

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
  const searchParams = useSearchParams();
  const [result, setResult] = useState<StoredDictionaryResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mismatched, setMismatched] = useState(false);

  useEffect(() => {
    const stored = loadDictionaryResult();
    if (stored && !paramsMatchResult(searchParams, stored)) {
      setMismatched(true);
      setResult(null);
    } else {
      setMismatched(false);
      setResult(stored);
    }
    setLoaded(true);
  }, [searchParams]);

  if (!loaded) {
    return <LoadingState title="Loading result" label="Loading dictionary result…" />;
  }

  if (mismatched) {
    return (
      <EmptyState
        title="Result expired or mismatched"
        description="This result does not match the current link. Run a new lookup from the dictionary page."
        action={
          <Link
            href="/dictionary"
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Back to search
          </Link>
        }
      />
    );
  }

  if (!result) {
    return (
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
    );
  }

  return (
    <DictionaryResultCard
      query={result.query}
      entry={result.entry}
      source={result.source}
      diagnostics={result.diagnostics}
    />
  );
}
