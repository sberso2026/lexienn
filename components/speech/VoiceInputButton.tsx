"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import type { VoiceInputState } from "@/lib/speech/speechInputSchemas";

interface VoiceInputButtonProps {
  state: VoiceInputState;
  disabled?: boolean;
  onSpeak: () => void;
  className?: string;
}

const STATE_LABELS: Record<VoiceInputState, string> = {
  idle: "Speak",
  listening: "Listening…",
  processing: "Processing voice…",
  ready: "Use transcript",
  error: "Try again",
  permission_denied: "Try again",
  unsupported: "Type manually",
};

export function VoiceInputButton({
  state,
  disabled = false,
  onSpeak,
  className = "",
}: VoiceInputButtonProps) {
  const isBusy = state === "listening" || state === "processing";
  const label = STATE_LABELS[state];

  return (
    <ActionButton
      type="button"
      variant="secondary"
      disabled={disabled || isBusy}
      aria-busy={isBusy}
      aria-label={label}
      onClick={onSpeak}
      className={`min-h-11 shrink-0 px-3 sm:px-4 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <MicrophoneIcon active={isBusy} />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </ActionButton>
  );
}

function MicrophoneIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-5 w-5 ${active ? "animate-pulse text-[var(--accent)]" : ""}`}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 17 11Z" />
    </svg>
  );
}
