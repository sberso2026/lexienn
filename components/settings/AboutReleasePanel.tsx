"use client";

import { CompactCard } from "@/components/ui/CompactCard";
import { formatReleaseLabel, getReleaseMetadata } from "@/lib/app/releaseMetadata";

export function AboutReleasePanel() {
  const release = getReleaseMetadata();

  return (
    <CompactCard className="enterprise-card">
      <h2 className="text-sm font-semibold">About Lexienn</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">Version</dt>
          <dd className="font-semibold">{formatReleaseLabel(release)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">Package</dt>
          <dd className="font-semibold">{release.packageVersion}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">Environment</dt>
          <dd className="font-semibold capitalize">{release.deployEnv}</dd>
        </div>
        {release.commitSha && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Commit</dt>
            <dd className="font-semibold">{release.commitSha}</dd>
          </div>
        )}
        {release.buildTimestamp && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Build</dt>
            <dd className="font-semibold">{release.buildTimestamp}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Set NEXT_PUBLIC_APP_VERSION, NEXT_PUBLIC_COMMIT_SHA, and NEXT_PUBLIC_DEPLOY_ENV on
        Vercel for release labeling.
      </p>
    </CompactCard>
  );
}
