/**
 * Public (browser-safe) feature flags. Never read secrets here.
 */
export function isDeveloperModeFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEVELOPER_MODE === "true";
}
