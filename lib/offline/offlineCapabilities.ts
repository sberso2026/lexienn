import { formatPackSize } from "@/lib/offline/offlinePackKey";
import type { OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import {
  resolveLanguageCapabilities,
  type CapabilityState,
  type OfflineCapabilities,
} from "@/lib/capabilities/contracts";
import { getLanguageOptionByValue } from "@/lib/languages/languageOptions";

function packAudioState(pack: OfflineStoredPack | null): CapabilityState {
  if (!pack) return "unavailable";
  if (pack.audio_coverage_percent >= 80) return "available";
  if (pack.audio_count > 0 || pack.audio_coverage_percent > 0) return "partial";
  return "unavailable";
}

function packTextState(pack: OfflineStoredPack | null, languageAllowsPack: boolean): CapabilityState {
  if (!languageAllowsPack) return "unavailable";
  if (!pack) return "unavailable";
  if (pack.phrase_count > 0) return "available";
  return "partial";
}

/**
 * Honest per-language offline capability snapshot for UI labels.
 * Never claims full offline AI, voice, or OCR unless data proves it.
 */
export function buildOfflineCapabilities(input: {
  languageId: string;
  pack?: OfflineStoredPack | null;
  estimatedBytes?: number | null;
}): OfflineCapabilities {
  const option = getLanguageOptionByValue(input.languageId);
  const languageCaps = resolveLanguageCapabilities(input.languageId, option);
  const pack = input.pack ?? null;
  const allowsPack = languageCaps.offlinePack !== "unavailable";
  const limitations: string[] = [];

  if (!allowsPack) {
    limitations.push("No offline pack is offered for this language yet.");
  }
  if (pack && pack.audio_coverage_percent < 100) {
    limitations.push("Offline audio is partial — some phrases use device voice or stay silent.");
  }
  if (!pack) {
    limitations.push("Cloud AI, live voice, and OCR need a network unless a pack is downloaded.");
  }
  limitations.push("Fully offline AI is not claimed for every language.");
  limitations.push("Offline OCR packs are not claimed in this build.");
  limitations.push("Offline dictionary packs are not claimed beyond phrase/glossary coverage.");

  const size =
    input.estimatedBytes != null
      ? formatPackSize(input.estimatedBytes)
      : pack
        ? formatPackSize(pack.estimated_size_bytes)
        : null;

  return {
    languageId: input.languageId,
    offlineTextPack: packTextState(pack, allowsPack),
    offlinePhrasePack: packTextState(pack, allowsPack),
    offlineAudioPack: packAudioState(pack),
    offlineOcrPack: "unavailable",
    offlineDictionaryPack: pack && pack.phrase_count > 0 ? "partial" : "unavailable",
    estimatedSizeLabel: size,
    version: pack?.version ?? null,
    lastUpdated: pack?.updated_at ?? pack?.downloaded_at ?? null,
    honestLimitations: limitations,
  };
}

export function capabilityLabel(state: CapabilityState): string {
  switch (state) {
    case "available":
      return "Available";
    case "partial":
      return "Partial";
    case "experimental":
      return "Experimental";
    default:
      return "Unavailable";
  }
}
