/** Server-side developer diagnostics (API routes, logs). */
export function isServerDeveloperDiagnosticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEVELOPER_MODE === "true";
}
