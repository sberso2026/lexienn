"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppExperienceSettings } from "@/components/settings/AppExperienceSettings";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { isAndroid, isIOS, isStandaloneApp } from "@/lib/pwa/isStandaloneApp";

type SettingsRow = {
  title: string;
  description: string;
  href: string;
  status?: string;
};

function SettingsSection({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: SettingsRow[];
}) {
  return (
    <section aria-labelledby={`more-${title.replace(/\W+/g, "-").toLowerCase()}`}>
      <div className="mb-2">
        <h2
          id={`more-${title.replace(/\W+/g, "-").toLowerCase()}`}
          className="text-sm font-semibold"
        >
          {title}
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      </div>
      <div className="card-surface enterprise-card overflow-hidden">
        {rows.map((row) => (
          <Link
            key={row.title}
            href={row.href}
            className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--background)]"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{row.title}</span>
              <span className="mt-1 block text-xs leading-4 text-[var(--muted)]">
                {row.description}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {row.status && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {row.status}
                </span>
              )}
              <span aria-hidden className="text-lg text-[var(--muted)]">›</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MoreSettingsView() {
  const [installed, setInstalled] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("Checking");

  useEffect(() => {
    setInstalled(isStandaloneApp());
    void fetch("/api/speech/status")
      .then((response) => (response.ok ? response.json() : null))
      .then((status) => {
        const ready = Boolean(status?.speech_enabled ?? status?.available ?? status);
        setSpeechStatus(ready ? "Ready" : "Manual typing available");
      })
      .catch(() => setSpeechStatus("Manual typing available"));
  }, []);

  const installInstructions = installed
    ? "Lexienn is installed and ready from your home screen."
    : isIOS()
      ? "In Safari, use Share, then Add to Home Screen."
      : isAndroid()
        ? "Open the browser menu and choose Install app."
        : "Use your browser’s install option when available.";

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Personalize Lexienn
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">More</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Manage app behavior, voice, offline resources, and language preferences.
        </p>
      </section>

      <AppExperienceSettings />

      <SettingsSection
        title="Voice & Microphone"
        description="Keep speech input reliable without blocking manual typing."
        rows={[
          {
            title: "Voice settings",
            description: "Playback language and voice preferences",
            href: "/settings",
          },
          {
            title: "Microphone test",
            description: "Open Translate and test live speech capture",
            href: "/translator",
          },
          {
            title: "Speech input status",
            description: "Typing remains available if voice cannot start",
            href: "/settings",
            status: speechStatus,
          },
        ]}
      />

      <SettingsSection
        title="Offline"
        description="Control storage and downloaded language packs."
        rows={[
          {
            title: "Offline storage",
            description: "Review local pack and audio usage",
            href: "/settings",
          },
          {
            title: "Manage packs",
            description: "Download, update, or remove language pairs",
            href: "/offline",
          },
          {
            title: "Clear downloaded packs",
            description: "Available with confirmation in storage settings",
            href: "/settings",
          },
        ]}
      />

      <SettingsSection
        title="Preferences"
        description="Set defaults for definitions and translations."
        rows={[
          {
            title: "Language preferences",
            description: "Default source and target languages",
            href: "/settings",
          },
          {
            title: "Translation preferences",
            description: "Default translation style and dictionary level",
            href: "/settings",
          },
          {
            title: "Profession / context default",
            description: "General, engineering, travel, business, and more",
            href: "/settings",
          },
        ]}
      />

      <section aria-labelledby="install-app-title">
        <h2 id="install-app-title" className="mb-2 text-sm font-semibold">Install App</h2>
        <div className="card-surface enterprise-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {installed ? "Installed app" : "Install Lexienn"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{installInstructions}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              installed ? "bg-green-50 text-green-800" : "bg-[var(--accent-soft)] text-[var(--accent)]"
            }`}>
              {installed ? "Installed" : "Browser"}
            </span>
          </div>
        </div>
      </section>

      <SettingsSection
        title="Feedback"
        description="Help improve Lexienn during real-device testing."
        rows={[
          {
            title: "Send feedback",
            description: "General comments and ideas",
            href: "/more/feedback?category=send_feedback",
          },
          {
            title: "Report issue",
            description: "Something didn’t work as expected",
            href: "/more/feedback?category=report_issue",
          },
          {
            title: "Suggest language or phrase",
            description: "Request a language or common phrase",
            href: "/more/feedback?category=suggest_language_or_phrase",
          },
          {
            title: "Report wrong translation",
            description: "Flag an inaccurate translation",
            href: "/more/feedback?category=report_wrong_translation",
          },
          {
            title: "Report microphone issue",
            description: "Voice input or permission problems",
            href: "/more/feedback?category=report_microphone_issue",
          },
          {
            title: "Report camera/Lens issue",
            description: "Scan, import, or OCR problems",
            href: "/more/feedback?category=report_camera_lens_issue",
          },
        ]}
      />

      <SettingsSection
        title="About"
        description="Release metadata for support and verification."
        rows={[
          {
            title: "About Lexienn",
            description: "Version, environment, and commit label",
            href: "/more/about",
          },
        ]}
      />

      {isDeveloperModeFeatureEnabled() && (
        <SettingsSection
          title="Developer Diagnostics"
          description="Internal runtime and QA tools."
          rows={[
            {
              title: "Open diagnostics",
              description: "PWA, microphone, provider, and local data tools",
              href: "/settings",
            },
            {
              title: "Production diagnostics",
              description: "Safe status panel for field testing",
              href: "/more/qa",
            },
            {
              title: "QA checklist",
              description: "Pass/fail real-device checks with export",
              href: "/more/qa",
            },
          ]}
        />
      )}
    </div>
  );
}
