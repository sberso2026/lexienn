"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import type { VoiceInputState } from "@/lib/speech/speechInputSchemas";

interface VoiceInputStatusProps {
  state: VoiceInputState;
  pendingTranscript?: string;
  statusMessage?: string | null;
  onApplyTranscript?: () => void;
  onTryAgain?: () => void;
  onDismiss?: () => void;
  showPrivacyNote?: boolean;
}

export function VoiceInputStatus({
  state,
  pendingTranscript = "",
  statusMessage,
  onApplyTranscript,
  onTryAgain,
  onDismiss,
  showPrivacyNote = false,
}: VoiceInputStatusProps) {
  if (state === "idle") {
    if (!showPrivacyNote) return null;
    return (
      <p className="text-xs text-[var(--muted)]" role="note">
        Voice is used only to create the transcript and is not saved by default.
      </p>
    );
  }

  const showTranscript = state === "ready" && pendingTranscript.trim().length > 0;
  const showError =
    state === "error" ||
    state === "permission_denied" ||
    state === "unsupported" ||
    Boolean(statusMessage);

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {state === "listening" && (
        <p className="text-xs font-medium text-[var(--foreground)]">Listening…</p>
      )}
      {state === "processing" && (
        <p className="text-xs font-medium text-[var(--foreground)]">Processing voice…</p>
      )}

      {showTranscript && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
          <p className="mt-1 text-sm leading-relaxed">{pendingTranscript}</p>
        </div>
      )}

      {showError && statusMessage && (
        <CompactAlert variant={state === "unsupported" ? "warning" : "error"}>
          {statusMessage}
        </CompactAlert>
      )}

      <div className="flex flex-wrap gap-2">
        {state === "ready" && (
          <ActionButton type="button" onClick={onApplyTranscript}>
            Use transcript
          </ActionButton>
        )}
        {(state === "error" || state === "permission_denied") && (
          <ActionButton type="button" variant="secondary" onClick={onTryAgain}>
            Try again
          </ActionButton>
        )}
        {(state === "ready" ||
          state === "error" ||
          state === "permission_denied" ||
          state === "unsupported") && (
          <ActionButton type="button" variant="ghost" onClick={onDismiss}>
            Type manually
          </ActionButton>
        )}
      </div>
    </div>
  );
}
