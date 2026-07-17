"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { SelectField } from "@/components/ui/SelectField";
import { trackAppEvent } from "@/lib/analytics/appEvents";
import { getReleaseMetadata } from "@/lib/app/releaseMetadata";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  saveFeedbackSubmission,
  type FeedbackCategory,
} from "@/lib/feedback/feedbackStorage";
import { isStandaloneApp } from "@/lib/pwa/isStandaloneApp";

function deviceSummary(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const mobile = /iPhone|iPad|Android/i.test(ua);
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : "Browser";
  return `${mobile ? "Mobile" : "Desktop"} · ${browser}`;
}

interface FeedbackFormProps {
  initialCategory?: FeedbackCategory;
}

export function FeedbackForm({ initialCategory = "send_feedback" }: FeedbackFormProps) {
  const pathname = usePathname();
  const release = useMemo(() => getReleaseMetadata(), []);
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (description.trim().length < 4) {
      setError("Please add a short description.");
      return;
    }

    saveFeedbackSubmission({
      category,
      description: description.trim().slice(0, 1000),
      contact: contact.trim() ? contact.trim().slice(0, 120) : undefined,
      route: pathname || "/",
      appVersion: release.appVersion,
      commitSha: release.commitSha,
      deviceSummary: deviceSummary(),
      standalone: isStandaloneApp(),
      includeDiagnostics: includeDiagnostics && isDeveloperModeFeatureEnabled(),
    });

    trackAppEvent("feedback_submitted", { category });
    setDescription("");
    setContact("");
    setMessage("Thanks — feedback saved on this device for review.");
  }

  return (
    <CompactCard className="enterprise-card">
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <SelectField
          id="feedback-category"
          label="Category"
          value={category}
          onChange={(value) => setCategory(value as FeedbackCategory)}
          options={FEEDBACK_CATEGORIES.map((item) => ({
            value: item,
            label: FEEDBACK_CATEGORY_LABELS[item],
          }))}
        />

        <div>
          <label htmlFor="feedback-description" className="block text-sm font-medium">
            Short description
          </label>
          <textarea
            id="feedback-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm"
            placeholder="What happened? What did you expect?"
          />
        </div>

        <div>
          <label htmlFor="feedback-contact" className="block text-sm font-medium">
            Optional contact
          </label>
          <input
            id="feedback-contact"
            type="email"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            className="mt-1 w-full min-h-11 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm"
            placeholder="Email if you want a reply (optional)"
            autoComplete="email"
          />
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
          <p>Route: {pathname || "/"}</p>
          <p className="mt-1">
            Version: {release.appVersion}
            {release.commitSha ? ` · ${release.commitSha}` : ""}
          </p>
          <p className="mt-1">Device: {deviceSummary()}</p>
          <p className="mt-1">Installed PWA: {isStandaloneApp() ? "Yes" : "No"}</p>
        </div>

        {isDeveloperModeFeatureEnabled() && (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={includeDiagnostics}
              onChange={(event) => setIncludeDiagnostics(event.target.checked)}
              className="h-4 w-4"
            />
            Include developer diagnostics flag
          </label>
        )}

        {error && <CompactAlert variant="warning">{error}</CompactAlert>}
        {message && <CompactAlert variant="success">{message}</CompactAlert>}

        <ActionButton type="submit" fullWidth>
          Submit feedback
        </ActionButton>
        <p className="text-xs text-[var(--muted)]">
          Feedback stays on this device. Do not include passwords, keys, or personal IDs.
        </p>
      </form>
    </CompactCard>
  );
}
