import { buildOfflinePackKey, getLanguagePairLabel } from "@/lib/offline/offlinePackKey";
import { canGenerateOfflinePackWithoutAi } from "@/lib/offline/offlinePackGenerator";
import type { OfflinePackStatus, OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import { listOfflinePacks } from "@/lib/offline/localOfflineStore";

export type OfflinePackCatalogKind =
  | "curated"
  | "generated"
  | "downloaded"
  | "missing";

export type OfflinePackCatalogEntry = {
  id: string;
  from_language_id: string;
  to_language_id: string;
  pair_label: string;
  kind: OfflinePackCatalogKind;
  status: OfflinePackStatus;
  source?: OfflineStoredPack["source"];
  message: string;
};

export const CURATED_OFFLINE_LANGUAGE_PAIRS: Array<{ from: string; to: string }> = [
  { from: "en", to: "tl" },
  { from: "en", to: "tl::dialect-tl-manila" },
  { from: "en", to: "ceb" },
  { from: "en", to: "ceb::dialect-ceb-cebu" },
  { from: "en", to: "hil" },
  { from: "en", to: "hil::dialect-hil-iloilo" },
];

export function buildCuratedCatalogEntries(): OfflinePackCatalogEntry[] {
  return CURATED_OFFLINE_LANGUAGE_PAIRS.map((pair) => ({
    id: buildOfflinePackKey(pair.from, pair.to),
    from_language_id: pair.from,
    to_language_id: pair.to,
    pair_label: getLanguagePairLabel(pair.from, pair.to),
    kind: "curated" as const,
    status: "missing" as const,
    source: "curated",
    message: "Curated pack available.",
  }));
}

export async function buildOfflinePackCatalog(): Promise<{
  curated: OfflinePackCatalogEntry[];
  downloaded: OfflinePackCatalogEntry[];
  generated: OfflinePackCatalogEntry[];
  missing: OfflinePackCatalogEntry[];
}> {
  const downloadedPacks = await listOfflinePacks();
  const curated = buildCuratedCatalogEntries();

  const downloaded: OfflinePackCatalogEntry[] = downloadedPacks.map((pack) => ({
    id: pack.pack_key,
    from_language_id: pack.from_language_id,
    to_language_id: pack.to_language_id,
    pair_label: `${pack.from_display_name} → ${pack.to_display_name}`,
    kind: pack.source === "curated" ? "curated" : "downloaded",
    status: "downloaded",
    source: pack.source,
    message:
      pack.source === "curated"
        ? "Curated pack available."
        : "Downloaded for offline use on this device.",
  }));

  const generated: OfflinePackCatalogEntry[] = downloadedPacks
    .filter((pack) => pack.source === "ai_generated")
    .map((pack) => ({
      id: pack.pack_key,
      from_language_id: pack.from_language_id,
      to_language_id: pack.to_language_id,
      pair_label: `${pack.from_display_name} → ${pack.to_display_name}`,
      kind: "generated" as const,
      status: "downloaded" as const,
      source: "ai_generated",
      message: "AI-generated pack downloaded locally.",
    }));

  const downloadedKeys = new Set(downloadedPacks.map((pack) => pack.pack_key));
  const missing: OfflinePackCatalogEntry[] = curated
    .filter((entry) => !downloadedKeys.has(entry.id))
    .map((entry) => {
      const canCurate = canGenerateOfflinePackWithoutAi({
        from_language: entry.from_language_id,
        to_language: entry.to_language_id,
        user_context: "traveller",
        pack_tier: "lite",
        include_audio_manifest: true,
      });
      return {
        ...entry,
        kind: "missing" as const,
        message: canCurate
          ? "Curated pack available."
          : "This pack requires online generation before offline use.",
      };
    });

  return { curated, downloaded, generated, missing };
}

export function getOfflineCatalogLink(from: string, to: string): string {
  const params = new URLSearchParams({ from, to });
  return `/offline?${params.toString()}`;
}
