"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="en">
      <body className="m-0 min-h-dvh bg-[#0b1f38] font-sans text-white antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <div className="max-w-sm rounded-xl border border-white/15 bg-white/5 p-6">
            <h1 className="text-xl font-semibold">Lexienn failed to load</h1>
            <p className="mt-3 text-sm text-slate-200">
              Lexienn failed to load. Please refresh once.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full rounded-lg bg-[#163a63] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Refresh Lexienn
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-3 w-full text-xs text-slate-400 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
