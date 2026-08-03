import { shouldShowInternalDebugUi } from "@/lib/debug/shouldShowInternalDebugUi";

export type MicSessionDebugLog = {
  side: string;
  selectedLanguage: string;
  resolvedLocale: string;
  path: "browser" | "server" | "hybrid";
  errorCode?: string | null;
  event: string;
};

/**
 * Safe Developer Mode mic logs — never include raw audio or secrets.
 */
export function logMicSessionDebug(entry: MicSessionDebugLog): void {
  if (!shouldShowInternalDebugUi()) return;
  console.info("[lexienn.mic]", {
    side: entry.side,
    selectedLanguage: entry.selectedLanguage,
    resolvedLocale: entry.resolvedLocale,
    path: entry.path,
    errorCode: entry.errorCode ?? null,
    event: entry.event,
  });
}
