import type { OfflinePackEntry } from "@/lib/offline/offlinePackSchemas";
import type { OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";

export function normalizeOfflineSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function entrySearchHaystack(entry: OfflinePackEntry): string {
  return normalizeOfflineSearchText(
    [
      entry.source_text,
      entry.translated_text,
      entry.pronunciation_simple,
      entry.category,
      entry.usage_note,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function matchesOfflineSearchQuery(haystack: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (haystack.includes(normalizedQuery) || normalizedQuery.includes(haystack)) {
    return true;
  }

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export function searchOfflinePackEntries(
  pack: OfflineStoredPack,
  query: string,
): OfflinePackEntry[] {
  const normalized = normalizeOfflineSearchText(query);
  if (!normalized) return pack.entries;

  return pack.entries.filter((entry) =>
    matchesOfflineSearchQuery(entrySearchHaystack(entry), normalized),
  );
}

export function getOfflineEntriesByCategory(
  pack: OfflineStoredPack,
  category: string,
  favoriteEntryIds: string[] = [],
): OfflinePackEntry[] {
  if (category === "all") return pack.entries;
  if (category === "favorites") {
    return pack.entries.filter((entry) => favoriteEntryIds.includes(entry.id));
  }
  return pack.entries.filter((entry) => entry.category === category);
}
