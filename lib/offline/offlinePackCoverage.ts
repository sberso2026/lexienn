import type { OfflinePackEntry, OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import {
  LITE_PACK_MIN_PHRASES,
  PROFESSIONAL_PACK_MIN_PHRASES,
  STANDARD_PACK_MIN_PHRASES,
} from "@/lib/offline/litePhrasePack";
import type { OfflinePackTier } from "@/lib/schemas/enums";

export function getTierPhraseTarget(tier: OfflinePackTier): number {
  if (tier === "professional") return PROFESSIONAL_PACK_MIN_PHRASES;
  if (tier === "standard") return STANDARD_PACK_MIN_PHRASES;
  return LITE_PACK_MIN_PHRASES;
}

export function countPlayableAudioEntries(entries: OfflinePackEntry[]): number {
  return entries.filter(
    (entry) =>
      entry.audio_type === "native_recorded" || entry.audio_type === "ai_generated",
  ).length;
}

export function calculateAudioCoveragePercent(entries: OfflinePackEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.round((countPlayableAudioEntries(entries) / entries.length) * 100);
}

export function calculateTextCoveragePercent(
  entries: OfflinePackEntry[],
  tier: OfflinePackTier,
): number {
  const target = getTierPhraseTarget(tier);
  if (target <= 0) return 100;
  return Math.min(100, Math.round((entries.length / target) * 100));
}

export function isFullAudioReady(entries: OfflinePackEntry[]): boolean {
  if (entries.length === 0) return false;
  return countPlayableAudioEntries(entries) === entries.length;
}

export function buildPackCoverageMetrics(
  pack: Pick<OfflineStoredPack, "entries" | "pack_tier">,
): {
  phrase_count: number;
  audio_count: number;
  audio_coverage_percent: number;
  text_coverage_percent: number;
  full_audio_ready: boolean;
} {
  const phrase_count = pack.entries.length;
  const audio_count = countPlayableAudioEntries(pack.entries);
  return {
    phrase_count,
    audio_count,
    audio_coverage_percent: calculateAudioCoveragePercent(pack.entries),
    text_coverage_percent: calculateTextCoveragePercent(pack.entries, pack.pack_tier),
    full_audio_ready: isFullAudioReady(pack.entries),
  };
}

export function applyCoverageMetricsToPack(pack: OfflineStoredPack): OfflineStoredPack {
  const metrics = buildPackCoverageMetrics(pack);
  return {
    ...pack,
    phrase_count: metrics.phrase_count,
    entry_count: metrics.phrase_count,
    audio_count: metrics.audio_count,
    audio_coverage_percent: metrics.audio_coverage_percent,
    text_coverage_percent: metrics.text_coverage_percent,
  };
}
