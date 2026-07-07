"use client";

import { useRouter } from "next/navigation";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";

interface ResultPageHomeButtonProps {
  onBeforeNavigate?: () => void;
}

export function ResultPageHomeButton({ onBeforeNavigate }: ResultPageHomeButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        onBeforeNavigate?.();
        stopVoicePlayback();
        router.push("/dictionary");
      }}
      aria-label="Back to dictionary home"
      className="mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm touch-manipulation hover:bg-[var(--background)] md:hidden"
    >
      <svg
        aria-hidden
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Home
    </button>
  );
}
