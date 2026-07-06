"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import type { MicUserMessage } from "@/lib/speech/micPermissionMessages";
import type { VoiceInputState } from "@/lib/speech/speechInputSchemas";

interface VoiceInputStatusProps {
  state: VoiceInputState;
  pendingTranscript?: string;
  statusMessage?: MicUserMessage | null;
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
  const showMessage =
    Boolean(statusMessage?.body) &&
    (state === "listening" ||
      state === "error" ||
      state === "permission_denied" ||
      state === "unsupported");

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {state === "listening" && !statusMessage?.body && (
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

      {showMessage && statusMessage && (
        <CompactAlert variant={state === "unsupported" ? "warning" : state === "listening" ? "info" : "error"}>
          {statusMessage.title && (
            <p className="mb-1 font-medium">{statusMessage.title}</p>
          )}
          <p>{statusMessage.body}</p>
          {statusMessage.steps && statusMessage.steps.length > 0 && (
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              {statusMessage.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
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
            Continue typing
          </ActionButton>
        )}
      </div>
    </div>
  );
}
