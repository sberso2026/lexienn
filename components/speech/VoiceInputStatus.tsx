"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import type { MicUserMessage } from "@/lib/speech/micPermissionMessages";
import type { VoiceInputState } from "@/lib/speech/speechInputSchemas";

interface VoiceInputStatusProps {
  state: VoiceInputState;
  pendingTranscript?: string;
  interimTranscript?: string;
  statusMessage?: MicUserMessage | null;
  onApplyTranscript?: () => void;
  onTryAgain?: () => void;
  onDismiss?: () => void;
  onStop?: () => void;
  showPrivacyNote?: boolean;
}

const ACTIVE_STATES: VoiceInputState[] = [
  "requesting_permission",
  "listening",
  "processing_speech",
];

export function VoiceInputStatus({
  state,
  pendingTranscript = "",
  interimTranscript = "",
  statusMessage,
  onApplyTranscript,
  onTryAgain,
  onDismiss,
  onStop,
  showPrivacyNote = false,
}: VoiceInputStatusProps) {
  const [showSpeakPrompt, setShowSpeakPrompt] = useState(false);

  useEffect(() => {
    if (!ACTIVE_STATES.includes(state)) {
      setShowSpeakPrompt(false);
      return;
    }

    setShowSpeakPrompt(false);
    const timer = window.setTimeout(() => setShowSpeakPrompt(true), 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === "idle") {
    if (!showPrivacyNote) return null;

    return (
      <p className="text-xs text-[var(--muted)]" role="note">
        Voice is used only to create the transcript and is not saved by default.
      </p>
    );
  }

  const isActive = ACTIVE_STATES.includes(state);
  const liveTranscript = interimTranscript.trim() || pendingTranscript.trim();
  const showFinalTranscript = state === "speech_ready" && pendingTranscript.trim().length > 0;
  const showLiveTranscript = isActive && liveTranscript.length > 0;
  const showMessage =
    Boolean(statusMessage?.body) &&
    (isActive ||
      state === "speech_error" ||
      state === "permission_denied" ||
      state === "unsupported");

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {isActive && (
        <p className="text-xs font-medium text-[var(--foreground)]">
          {showSpeakPrompt ? "Listening… speak now" : "Listening…"}
        </p>
      )}

      {state === "processing_speech" && (
        <p className="text-xs font-medium text-[var(--foreground)]">Processing voice…</p>
      )}

      {(showLiveTranscript || showFinalTranscript) && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
          {showLiveTranscript && !showFinalTranscript && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Live transcript
            </p>
          )}
          {showFinalTranscript && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Captured speech
            </p>
          )}
          <p
            className={`mt-1 text-sm leading-relaxed ${
              showLiveTranscript && !showFinalTranscript ? "text-[var(--muted)]" : ""
            }`}
          >
            {showFinalTranscript ? pendingTranscript : liveTranscript}
          </p>
        </div>
      )}

      {showMessage && statusMessage && (
        <CompactAlert
          variant={
            state === "unsupported"
              ? "warning"
              : isActive
                ? "info"
                : "error"
          }
        >
          {statusMessage.title && <p className="mb-1 font-medium">{statusMessage.title}</p>}
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
        {isActive && onStop && (
          <ActionButton type="button" variant="secondary" onClick={onStop}>
            Stop
          </ActionButton>
        )}

        {state === "speech_ready" && (
          <ActionButton type="button" onClick={onApplyTranscript}>
            Use transcript
          </ActionButton>
        )}

        {(state === "speech_error" || state === "permission_denied") && (
          <ActionButton type="button" variant="secondary" onClick={onTryAgain}>
            Try again
          </ActionButton>
        )}

        {(state === "speech_ready" ||
          state === "speech_error" ||
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
