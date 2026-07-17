import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

export type DeployEnvironment = "local" | "preview" | "production" | "unknown";

export type ReleaseMetadata = {
  packageVersion: string;
  appVersion: string;
  commitSha: string | null;
  buildTimestamp: string | null;
  deployEnv: DeployEnvironment;
};

function normalizeEnv(value: string | undefined): DeployEnvironment {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw === "local" || raw === "development" || raw === "dev") return "local";
  if (raw === "preview" || raw === "staging") return "preview";
  if (raw === "production" || raw === "prod") return "production";
  if (process.env.NODE_ENV === "development") return "local";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  if (process.env.VERCEL_ENV === "production") return "production";
  return "unknown";
}

export function getReleaseMetadata(): ReleaseMetadata {
  const packageVersion = process.env.npm_package_version || "0.1.0";
  const appVersion =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() || packageVersion;
  const commitSha =
    process.env.NEXT_PUBLIC_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    null;
  const buildTimestamp =
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.trim() || null;

  return {
    packageVersion,
    appVersion,
    commitSha: commitSha ? commitSha.slice(0, 12) : null,
    buildTimestamp,
    deployEnv: normalizeEnv(
      process.env.NEXT_PUBLIC_DEPLOY_ENV || process.env.VERCEL_ENV,
    ),
  };
}

export function formatReleaseLabel(meta: ReleaseMetadata = getReleaseMetadata()): string {
  const parts = [`v${meta.appVersion}`, meta.deployEnv];
  if (meta.commitSha) parts.push(meta.commitSha);
  return parts.join(" · ");
}

export function shouldShowReleaseDetails(): boolean {
  return isDeveloperModeFeatureEnabled();
}
