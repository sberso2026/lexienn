"use client";

import Link from "next/link";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDetails = isDeveloperModeFeatureEnabled();

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[50dvh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center"
    >
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
        Lexienn hit an unexpected problem. You can try again or send a short report.
      </p>
      {showDetails && (
        <pre className="mt-4 max-h-40 w-full overflow-auto rounded-lg bg-[var(--background)] p-3 text-left text-[10px] text-red-700">
          {error.message}
          {error.digest ? `\ndigest: ${error.digest}` : ""}
          {error.stack ? `\n${error.stack}` : ""}
        </pre>
      )}
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Reload app
        </button>
        <Link
          href="/more/feedback?category=report_issue"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card)]"
        >
          Report issue
        </Link>
      </div>
    </main>
  );
}
