import { resolveLanguageSelection } from "@/lib/languages/languageOptions";

export type LanguagePairSelection = {
  from: string;
  to: string;
};

export function buildOfflinePackKey(from: string, to: string): string {
  return `${from.trim()}__${to.trim()}`;
}

export function parseOfflinePackKey(packKey: string): LanguagePairSelection | null {
  const separator = packKey.indexOf("__");
  if (separator <= 0) return null;
  return {
    from: packKey.slice(0, separator),
    to: packKey.slice(separator + 2),
  };
}

export function getLanguagePairLabel(from: string, to: string): string {
  const fromResolved = resolveLanguageSelection(from);
  const toResolved = resolveLanguageSelection(to);
  return `${fromResolved.display_label} → ${toResolved.display_label}`;
}

export function estimatePackSizeBytes(entryCount: number): number {
  const averageEntryBytes = 420;
  const overheadBytes = 2048;
  return entryCount * averageEntryBytes + overheadBytes;
}

export function formatPackSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
