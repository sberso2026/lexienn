"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { mapSpeechRecognitionLocale } from "@/lib/speech/speechRecognitionLocale";
import {
  getMicDiagnosticsSnapshot,
  runMicDiagnosticsTest,
  type MicDiagnosticsSnapshot,
} from "@/lib/speech/micDiagnostics";
import { isBrowserSpeechRecognitionSupported } from "@/lib/speech/browserSpeechRecognition";

/** User-facing microphone readiness test (Batch 49). */
export function MicQualityTestPanel() {
  const { preferences } = useUserPreferences();
  const [snapshot, setSnapshot] = useState<MicDiagnosticsSnapshot | null>(null);
  const [testing, setTesting] = useState(false);
  const developerMode =
    isDeveloperModeFeatureEnabled() && preferences.developer_mode_enabled;

  const recognitionLocale = useMemo(
    () => mapSpeechRecognitionLocale(preferences.default_source_language || "en"),
    [preferences.default_source_language],
  );

  useEffect(() => {
    setSnapshot(getMicDiagnosticsSnapshot());
  }, []);

  const runTest = useCallback(async () => {
    setTesting(true);
    try {
      const result = await runMicDiagnosticsTest();
      setSnapshot(result);
    } finally {
      setTesting(false);
    }
  }, []);

  if (!snapshot) return null;

  const supportLabel = snapshot.mediaDevicesAvailable
    ? snapshot.speechRecognitionSupported || snapshot.mediaDevicesAvailable
      ? "Supported"
      : "Limited"
    : "Unavailable";

  return (
    <CompactCard className="enterprise-card space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Microphone test</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Check mic readiness and the recognition language for your default source language.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <StatusChip
          label={`Mic: ${supportLabel}`}
          variant={snapshot.mediaDevicesAvailable ? "success" : "warning"}
        />
        <StatusChip label={`Locale: ${recognitionLocale}`} variant="neutral" />
        <StatusChip
          label={snapshot.isSecureContext ? "Secure context" : "Needs HTTPS"}
          variant={snapshot.isSecureContext ? "success" : "warning"}
        />
      </div>

      <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
        <li>Speak clearly and hold the phone closer in noisy places.</li>
        <li>If recognition fails, typed text is preserved.</li>
        <li>
          Browser speech recognition:{" "}
          {isBrowserSpeechRecognitionSupported() ? "available" : "not available — typing still works"}
        </li>
      </ul>

      <ActionButton type="button" variant="secondary" onClick={() => void runTest()} disabled={testing}>
        {testing ? "Testing mic…" : "Run microphone test"}
      </ActionButton>

      {snapshot.getUserMediaResult !== "not_tested" && (
        <CompactAlert
          variant={snapshot.getUserMediaResult === "granted" ? "info" : "warning"}
        >
          {snapshot.getUserMediaResult === "granted"
            ? "Microphone permission looks good."
            : snapshot.getUserMediaResult === "denied"
              ? "Permission blocked. You can still type manually."
              : "Microphone unavailable. Try again or type manually."}
        </CompactAlert>
      )}

      {developerMode && (
        <details className="text-xs text-[var(--muted)]">
          <summary className="cursor-pointer font-medium text-[var(--foreground)]">
            Developer diagnostics
          </summary>
          <dl className="mt-2 space-y-1">
            <div>mediaDevices: {String(snapshot.mediaDevicesAvailable)}</div>
            <div>speechRecognition: {String(snapshot.speechRecognitionSupported)}</div>
            <div>getUserMedia: {snapshot.getUserMediaResult}</div>
            <div>lastErrorCode: {snapshot.lastErrorCode ?? "none"}</div>
            {snapshot.testedAt && <div>tested: {snapshot.testedAt}</div>}
          </dl>
        </details>
      )}
    </CompactCard>
  );
}
