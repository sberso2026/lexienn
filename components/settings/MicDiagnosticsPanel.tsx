"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  getMicDiagnosticsSnapshot,
  runMicDiagnosticsTest,
  type MicDiagnosticsSnapshot,
} from "@/lib/speech/micDiagnostics";

export function MicDiagnosticsPanel() {
  const [snapshot, setSnapshot] = useState<MicDiagnosticsSnapshot | null>(null);
  const [testing, setTesting] = useState(false);

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

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1.5">
        <StatusChip
          label={`mediaDevices: ${snapshot.mediaDevicesAvailable ? "yes" : "no"}`}
          variant={snapshot.mediaDevicesAvailable ? "success" : "neutral"}
        />
        <StatusChip
          label={`secure: ${snapshot.isSecureContext ? "yes" : "no"}`}
          variant={snapshot.isSecureContext ? "success" : "warning"}
        />
        <StatusChip
          label={`speech API: ${snapshot.speechRecognitionSupported ? "yes" : "no"}`}
          variant="neutral"
        />
        {snapshot.platform.isIos && (
          <StatusChip label="iOS" variant="neutral" />
        )}
        {snapshot.platform.isStandalonePwa && (
          <StatusChip label="standalone PWA" variant="neutral" />
        )}
      </div>

      <dl className="grid gap-1 text-[var(--muted)]">
        <div>Safari: {snapshot.platform.isSafari ? "yes" : "no"}</div>
        <div>getUserMedia test: {snapshot.getUserMediaResult}</div>
        <div>lastErrorCode: {snapshot.lastErrorCode ?? "none"}</div>
        {snapshot.testedAt && <div>tested: {snapshot.testedAt}</div>}
      </dl>

      <ActionButton type="button" variant="secondary" onClick={() => void runTest()} disabled={testing}>
        {testing ? "Testing mic…" : "Test microphone permission"}
      </ActionButton>

      {!snapshot.isSecureContext && (
        <CompactAlert variant="warning">
          Microphone requires HTTPS (secure context).
        </CompactAlert>
      )}
    </div>
  );
}
