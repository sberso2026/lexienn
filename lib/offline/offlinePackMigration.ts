import { stripMockMarkers } from "@/lib/offline/offlinePackEntryUtils";
import type {
  OfflineLanguagePairPack,
  OfflinePackEntry,
  OfflinePackStatus,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import {
  LEXIENN_APP_VERSION,
  OFFLINE_PACK_CONTENT_VERSION,
  OFFLINE_PACK_SCHEMA_VERSION,
  OFFLINE_PACK_VERSION,
} from "@/lib/offline/offlinePackVersions";

export const PROTOTYPE_WORDING_PATTERN =
  /\b(mvp\b|mock seed|mock data|admin lite|rule fallback)\b|\(mvp mock/i;

export type OfflinePackMigrationResult = {
  pack: OfflineStoredPack;
  migrated: boolean;
  migrationApplied: boolean;
  stillOutdated: boolean;
  containsPrototypeWording: boolean;
};

export function textContainsPrototypeWording(text: string): boolean {
  return PROTOTYPE_WORDING_PATTERN.test(text);
}

export function cleanPrototypeWording(text: string): string {
  let result = stripMockMarkers(text);
  result = result.replace(/\s*\([^)]*\bmock\b[^)]*\)/gi, "");
  result = result.replace(/\bMVP mock\b/gi, "");
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}

export function entryContainsPrototypeWording(entry: OfflinePackEntry): boolean {
  return (
    textContainsPrototypeWording(entry.source_text) ||
    textContainsPrototypeWording(entry.translated_text) ||
    textContainsPrototypeWording(entry.pronunciation_simple) ||
    (entry.usage_note ? textContainsPrototypeWording(entry.usage_note) : false) ||
    (entry.literal_translation
      ? textContainsPrototypeWording(entry.literal_translation)
      : false)
  );
}

export function packContainsPrototypeWording(pack: OfflineStoredPack): boolean {
  return pack.entries.some(entryContainsPrototypeWording);
}

export function isOfflinePackVersionOutdated(
  pack: Pick<
    OfflineLanguagePairPack,
    "schema_version" | "content_version" | "version"
  >,
): boolean {
  const schemaVersion = pack.schema_version ?? 1;
  const contentVersion = pack.content_version ?? 1;
  return (
    schemaVersion < OFFLINE_PACK_SCHEMA_VERSION ||
    contentVersion < OFFLINE_PACK_CONTENT_VERSION ||
    pack.version !== OFFLINE_PACK_VERSION
  );
}

export function resolveOfflinePackStatus(
  pack: OfflineStoredPack,
  options?: { containsPrototypeWording?: boolean },
): OfflinePackStatus {
  const hasPrototype =
    options?.containsPrototypeWording ?? packContainsPrototypeWording(pack);

  if (hasPrototype || isOfflinePackVersionOutdated(pack)) {
    return "update_available";
  }

  if (pack.status === "audio_downloading" || pack.status === "text_ready") {
    return pack.status;
  }

  return "downloaded";
}

function migrateEntry(entry: OfflinePackEntry, timestamp: string): OfflinePackEntry {
  return {
    ...entry,
    source_text: cleanPrototypeWording(entry.source_text),
    translated_text: cleanPrototypeWording(entry.translated_text),
    pronunciation_simple: cleanPrototypeWording(entry.pronunciation_simple),
    literal_translation: entry.literal_translation
      ? cleanPrototypeWording(entry.literal_translation)
      : undefined,
    usage_note: entry.usage_note ? cleanPrototypeWording(entry.usage_note) : undefined,
    updated_at: timestamp,
  };
}

export function migrateOfflinePack(pack: OfflineStoredPack): OfflinePackMigrationResult {
  const timestamp = new Date().toISOString();
  const hadPrototype = packContainsPrototypeWording(pack);
  const hadVersionMismatch = isOfflinePackVersionOutdated(pack);
  const migratedEntries = pack.entries.map((entry) => migrateEntry(entry, timestamp));
  const stillHasPrototype = migratedEntries.some(entryContainsPrototypeWording);
  const migrationApplied = hadPrototype || hadVersionMismatch;

  const nextPack: OfflineStoredPack = {
    ...pack,
    entries: migratedEntries,
    schema_version: OFFLINE_PACK_SCHEMA_VERSION,
    content_version: stillHasPrototype
      ? Math.min(pack.content_version ?? 1, OFFLINE_PACK_CONTENT_VERSION - 1)
      : OFFLINE_PACK_CONTENT_VERSION,
    version: stillHasPrototype ? pack.version : OFFLINE_PACK_VERSION,
    generated_by_app_version: pack.generated_by_app_version ?? LEXIENN_APP_VERSION,
    updated_at: timestamp,
    status: resolveOfflinePackStatus(
      {
        ...pack,
        entries: migratedEntries,
        schema_version: OFFLINE_PACK_SCHEMA_VERSION,
        content_version: stillHasPrototype
          ? pack.content_version ?? 1
          : OFFLINE_PACK_CONTENT_VERSION,
        version: stillHasPrototype ? pack.version : OFFLINE_PACK_VERSION,
      },
      { containsPrototypeWording: stillHasPrototype },
    ),
  };

  return {
    pack: nextPack,
    migrated: migrationApplied,
    migrationApplied,
    stillOutdated: resolveOfflinePackStatus(nextPack) === "update_available",
    containsPrototypeWording: stillHasPrototype,
  };
}

export function getOutdatedPackWarning(isOnline: boolean, isOutdated: boolean): string | undefined {
  if (!isOutdated) return undefined;
  if (isOnline) return "Update available.";
  return "This pack may be outdated. Update when online.";
}
