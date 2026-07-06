const isDev = process.env.NODE_ENV === "development";

export function logPerf(
  event: string,
  detail?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isDev) return;
  console.debug("[lexienn:perf]", event, detail ?? {});
}
