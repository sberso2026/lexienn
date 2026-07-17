"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CompactCard } from "@/components/ui/CompactCard";
import { formatReleaseLabel, getReleaseMetadata } from "@/lib/app/releaseMetadata";
import { isStandaloneApp } from "@/lib/pwa/isStandaloneApp";

type SafeStatus = {
  label: string;
  detail: string;
};

export function ProductionDiagnosticsPanel() {
  const pathname = usePathname();
  const release = getReleaseMetadata();
  const [online, setOnline] = useState(true);
  const [swState, setSwState] = useState("Checking…");
  const [mic, setMic] = useState<SafeStatus>({ label: "Unknown", detail: "" });
  const [camera, setCamera] = useState<SafeStatus>({ label: "Unknown", detail: "" });
  const [aiStatus, setAiStatus] = useState("Checking…");
  const [voiceStatus, setVoiceStatus] = useState("Checking…");

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    void navigator.serviceWorker
      ?.getRegistration()
      .then((registration) => {
        if (!registration) {
          setSwState("Not registered");
          return;
        }
        setSwState(registration.active ? "Active" : "Registered");
      })
      .catch(() => setSwState("Unavailable"));

    const micOk = Boolean(navigator.mediaDevices?.getUserMedia);
    setMic({
      label: micOk ? "Supported" : "Limited",
      detail: micOk ? "getUserMedia available" : "Use typing fallback",
    });

    const cameraOk = Boolean(
      navigator.mediaDevices?.getUserMedia ||
        (typeof window !== "undefined" && "MediaRecorder" in window),
    );
    setCamera({
      label: cameraOk ? "Supported" : "Limited",
      detail: cameraOk ? "Camera APIs available" : "Import/manual fallback",
    });

    void fetch("/api/ai/status")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) {
          setAiStatus("Unavailable");
          return;
        }
        setAiStatus(
          `enabled=${String(Boolean(data.ai_enabled ?? data.aiEnabled))} · configured=${String(
            Boolean(data.provider_configured ?? data.providerConfigured),
          )}`,
        );
      })
      .catch(() => setAiStatus("Unavailable"));

    void fetch("/api/voice/status")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) {
          setVoiceStatus("Unavailable");
          return;
        }
        setVoiceStatus(
          `enabled=${String(Boolean(data.voice_enabled ?? data.voiceEnabled))}`,
        );
      })
      .catch(() => setVoiceStatus("Unavailable"));

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const rows: Array<{ label: string; value: string }> = [
    { label: "App version", value: formatReleaseLabel(release) },
    { label: "Route", value: pathname || "/" },
    { label: "PWA standalone", value: isStandaloneApp() ? "Yes" : "No" },
    { label: "Service worker", value: swState },
    { label: "Network", value: online ? "Online" : "Offline" },
    { label: "Microphone", value: `${mic.label}${mic.detail ? ` · ${mic.detail}` : ""}` },
    { label: "Camera", value: `${camera.label}${camera.detail ? ` · ${camera.detail}` : ""}` },
    { label: "AI status", value: aiStatus },
    { label: "Voice status", value: voiceStatus },
  ];

  return (
    <CompactCard className="enterprise-card">
      <h2 className="text-sm font-semibold">Production diagnostics</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Safe runtime details only. Secrets and API keys are never shown.
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-b-0"
          >
            <dt className="text-xs font-medium text-[var(--muted)]">{row.label}</dt>
            <dd className="max-w-[60%] break-words text-right text-xs font-semibold">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </CompactCard>
  );
}
