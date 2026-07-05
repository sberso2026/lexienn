"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[50dvh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center"
    >
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Try again
        </button>
        <Link
          href="/dictionary"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card)]"
        >
          Back to dictionary
        </Link>
      </div>
    </main>
  );
}
