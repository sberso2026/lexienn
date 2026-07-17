import { getAiConfig } from "@/lib/ai/config";
import { resolveLanguageSelection } from "@/lib/languages/languageOptions";
import { cacheOfflinePackAudio } from "@/lib/offline/cacheOfflinePackAudio";
import { cacheSingleOfflineEntryAudio } from "@/lib/offline/cacheOfflinePackAudio";
import type { PackDownloadSnapshot } from "@/lib/offline/offlinePackDownloadTypes";
import {
  downloadOfflineLanguagePairPackBrowser,
  retryOfflinePackAudioDownload,
  type PackDownloadRuntime,
} from "@/lib/offline/offlinePackDownload";
import {
  getOfflinePackDownloadProgress,
  removeOfflinePackDownloadProgress,
} from "@/lib/offline/offlinePackDownloadProgress";
import {
  buildPackWithMissingPhraseEntry,
  copyMissingPhraseText,
  getMissingPhraseOfflineCacheKey,
  getMissingPhraseTranslation,
  type MissingPhraseTranslationResult,
} from "@/lib/offline/missingPhrasePackActions";
import { normalizeOfflineSearchText } from "@/lib/offline/offlinePhraseSearch";
import { removeOfflinePackAudio } from "@/lib/offline/offlineAudioCache";
import {
  buildOfflinePackKey,
  formatPackSize,
  getLanguagePairLabel,
} from "@/lib/offline/offlinePackKey";
import {
  canGenerateOfflinePackWithoutAi,
  generateOfflineLanguagePairPack,
} from "@/lib/offline/offlinePackGenerator";
import {
  getOutdatedPackWarning,
  isOfflinePackVersionOutdated,
  packContainsPrototypeWording,
  resolveOfflinePackStatus,
} from "@/lib/offline/offlinePackMigration";
import type {
  OfflineMissingRequest,
  OfflinePackGenerateRequest,
  OfflinePackStatus,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import {
  addOfflineFavorite,
  getOfflinePackByKey,
  getRecentPairs,
  getRecentPhrases,
  isOfflineFavorite,
  listOfflineFavoriteEntryIds,
  listOfflineMissingRequests,
  listOfflinePacks,
  recordRecentPhrase,
  removeOfflineFavorite,
  removeOfflinePack,
  saveOfflineMissingRequest,
  saveOfflinePack,
  updateOfflineMissingRequestStatus,
} from "@/lib/offline/localOfflineStore";
import type { SaveMissingRequestInput } from "@/lib/offline/offlinePackStore";
import { translateSentenceViaApi } from "@/lib/translator/translatorApiClient";

export type { MissingPhraseTranslationResult };

export type StorageEstimate = {
  supported: boolean;
  quotaBytes?: number;
  usageBytes?: number;
  warning?: string;
};

export type OfflinePackAvailability = {
  pairSelected: boolean;
  packKey: string;
  status: OfflinePackStatus;
  pack: OfflineStoredPack | null;
  canGenerate: boolean;
  canGenerateWithoutAi: boolean;
  aiConfigured: boolean;
  estimatedSizeLabel: string;
  pairLabel?: string;
  textCoverageLabel?: string;
  audioCoverageLabel?: string;
  packTierLabel?: string;
  availabilityMessage: string;
  isOutdated?: boolean;
  outdatedWarning?: string;
};

export const ACTIVE_PAIR_STORAGE_KEY = "lexienn_active_offline_pair";

export function isLanguagePairSelected(fromLanguage: string, toLanguage: string): boolean {
  return fromLanguage.trim().length > 0 && toLanguage.trim().length > 0;
}

export function buildPackAvailabilityMessage(
  availability: Pick<
    OfflinePackAvailability,
    "canGenerate" | "canGenerateWithoutAi" | "status" | "pairSelected"
  >,
  isOnline: boolean,
): string {
  if (!availability.pairSelected) {
    return "Select a From and To language pair to manage offline packs.";
  }
  if (availability.canGenerateWithoutAi) {
    return "Curated pack available.";
  }
  if (availability.canGenerate && isOnline) {
    return "This pack requires online generation before offline use.";
  }
  if (availability.status === "missing" && !isOnline) {
    return "No offline pack downloaded for this language pair.";
  }
  return "Pack unavailable. Try another language pair or check your connection.";
}

export function getActiveOfflinePairKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PAIR_STORAGE_KEY);
}

export function setActiveOfflinePairKey(packKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_PAIR_STORAGE_KEY, packKey);
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return {
      supported: false,
      warning:
        "Make sure your device has enough storage before downloading offline packs.",
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quotaBytes = estimate.quota ?? undefined;
    const usageBytes = estimate.usage ?? undefined;
    let warning: string | undefined;

    if (quotaBytes && usageBytes && quotaBytes - usageBytes < 2 * 1024 * 1024) {
      warning = "Device storage is nearly full. Free space before downloading offline packs.";
    }

    return { supported: true, quotaBytes, usageBytes, warning };
  } catch {
    return {
      supported: false,
      warning:
        "Make sure your device has enough storage before downloading offline packs.",
    };
  }
}

export async function inspectOfflinePackAvailability(
  fromLanguage: string,
  toLanguage: string,
): Promise<OfflinePackAvailability> {
  const pairSelected = isLanguagePairSelected(fromLanguage, toLanguage);

  if (!pairSelected) {
    return {
      pairSelected: false,
      packKey: "",
      status: "missing",
      pack: null,
      canGenerate: false,
      canGenerateWithoutAi: false,
      aiConfigured: false,
      estimatedSizeLabel: formatPackSize(40 * 420 + 2048),
      availabilityMessage: buildPackAvailabilityMessage(
        { pairSelected: false, canGenerate: false, canGenerateWithoutAi: false, status: "missing" },
        isBrowserOnline(),
      ),
    };
  }

  const packKey = buildOfflinePackKey(fromLanguage, toLanguage);
  const pack = await getOfflinePackByKey(packKey);
  const request: OfflinePackGenerateRequest = {
    from_language: fromLanguage,
    to_language: toLanguage,
    target_language_selection: toLanguage,
    from_display_name: resolveLanguageSelection(fromLanguage).display_label,
    target_display_name: resolveLanguageSelection(toLanguage).display_label,
    user_context: "traveller",
    pack_tier: "lite",
    include_audio_manifest: true,
  };

  const canGenerateWithoutAi = canGenerateOfflinePackWithoutAi(request);
  const isOnline = isBrowserOnline();
  const canGenerate =
    canGenerateWithoutAi ||
    (typeof window !== "undefined" ? isOnline : getAiConfig().isConfigured);

  let status: OfflinePackStatus = "missing";
  if (pack) {
    status = resolveOfflinePackStatus(pack);
  }

  const isOutdated = pack
    ? status === "update_available" ||
      isOfflinePackVersionOutdated(pack) ||
      packContainsPrototypeWording(pack)
    : false;
  const outdatedWarning = getOutdatedPackWarning(isOnline, isOutdated);

  const availability: OfflinePackAvailability = {
    pairSelected: true,
    packKey,
    status,
    pack,
    canGenerate,
    canGenerateWithoutAi,
    aiConfigured: typeof window === "undefined" ? getAiConfig().isConfigured : isOnline,
    estimatedSizeLabel: formatPackSize(pack?.estimated_size_bytes ?? 150 * 420 + 2048),
    pairLabel: getLanguagePairLabel(fromLanguage, toLanguage),
    textCoverageLabel: pack ? `${pack.text_coverage_percent}% text` : undefined,
    audioCoverageLabel: pack ? `${pack.audio_coverage_percent}% audio` : undefined,
    packTierLabel: pack?.pack_tier ? `${pack.pack_tier[0].toUpperCase()}${pack.pack_tier.slice(1)} tier` : "Lite tier",
    availabilityMessage: "",
    isOutdated,
    outdatedWarning,
  };

  availability.availabilityMessage = buildPackAvailabilityMessage(availability, isOnline);
  return availability;
}

export async function downloadOfflineLanguagePairPack(
  request: OfflinePackGenerateRequest,
  options?: {
    onSnapshot?: (snapshot: PackDownloadSnapshot) => void;
    runtime?: PackDownloadRuntime;
    resume?: boolean;
  },
): Promise<OfflineStoredPack> {
  if (typeof window !== "undefined") {
    return downloadOfflineLanguagePairPackBrowser(request, options);
  }

  const { downloadOfflineLanguagePairPackNode } = await import("@/lib/offline/offlinePackDownload");
  return downloadOfflineLanguagePairPackNode(request);
}

export async function retryOfflinePackAudio(
  request: OfflinePackGenerateRequest,
  options?: {
    onSnapshot?: (snapshot: PackDownloadSnapshot) => void;
    runtime?: PackDownloadRuntime;
  },
): Promise<OfflineStoredPack> {
  return retryOfflinePackAudioDownload(request, options);
}

export async function getOfflinePackDownloadState(packKey: string) {
  return getOfflinePackDownloadProgress(packKey);
}

export async function updateOfflineLanguagePairPack(
  request: OfflinePackGenerateRequest,
): Promise<OfflineStoredPack> {
  let generatedPack: OfflineStoredPack;

  if (typeof window !== "undefined") {
    const response = await fetch("/api/offline-packs/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Could not update pack online. Your existing local pack remains usable.");
    }

    const payload = (await response.json()) as { pack: OfflineStoredPack };
    generatedPack = payload.pack;
  } else {
    const generated = await generateOfflineLanguagePairPack(request, { forceAi: true });
    if (!generated) {
      throw new Error("Could not update pack online. Your existing local pack remains usable.");
    }
    generatedPack = generated.pack;
  }

  const nextPack = {
    ...generatedPack,
    downloaded_at:
      (await getOfflinePackByKey(generatedPack.pack_key))?.downloaded_at ??
      generatedPack.downloaded_at,
    updated_at: new Date().toISOString(),
    status: "downloaded" as const,
  };

  await saveOfflinePack(nextPack);

  if (typeof window !== "undefined") {
    await removeOfflinePackAudio(nextPack.pack_key);
    await cacheOfflinePackAudio(nextPack, request.to_language);
  }

  return nextPack;
}

export async function removeOfflineLanguagePairPack(packKey: string): Promise<void> {
  await removeOfflinePack(packKey);
  await removeOfflinePackDownloadProgress(packKey);
  if (typeof window !== "undefined") {
    await removeOfflinePackAudio(packKey);
  }
  if (getActiveOfflinePairKey() === packKey && typeof window !== "undefined") {
    localStorage.removeItem(ACTIVE_PAIR_STORAGE_KEY);
  }
}

export async function getActiveOfflinePack(): Promise<OfflineStoredPack | null> {
  const activeKey = getActiveOfflinePairKey();
  if (activeKey) {
    const active = await getOfflinePackByKey(activeKey);
    if (active) return active;
  }

  const packs = await listOfflinePacks();
  return packs[0] ?? null;
}

export async function trackOfflinePhraseUsage(
  pack: OfflineStoredPack,
  entryId: string,
): Promise<void> {
  const entry = pack.entries.find((item) => item.id === entryId);
  if (!entry) return;

  await recordRecentPhrase({
    pack_key: pack.pack_key,
    entry_id: entry.id,
    source_text: entry.source_text,
    translated_text: entry.translated_text,
    used_at: new Date().toISOString(),
  });
}

export async function toggleOfflineFavorite(
  entryId: string,
  packKey: string,
): Promise<boolean> {
  const favorited = await isOfflineFavorite(entryId);
  if (favorited) {
    await removeOfflineFavorite(entryId);
    return false;
  }
  await addOfflineFavorite(entryId, packKey);
  return true;
}

export async function recordOfflineMissingPhraseRequest(
  input: SaveMissingRequestInput,
): Promise<OfflineMissingRequest> {
  return saveOfflineMissingRequest(input);
}

export async function generateMissingPhraseOnline(
  request: OfflineMissingRequest,
): Promise<MissingPhraseTranslationResult> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    throw new Error("Connect to the internet to generate a translation.");
  }

  await updateOfflineMissingRequestStatus(request.id, { status: "pending_sync" });

  try {
    const toResolved = resolveLanguageSelection(request.to_language_id);
    const { response } = await translateSentenceViaApi({
      input_text: request.requested_text,
      source_language: request.from_language_id,
      target_language: request.to_language_id,
      target_language_selection: request.to_language_id,
      target_dialect: toResolved.dialect_variant,
      target_locale_tag: toResolved.locale_tag,
      target_dialect_label: toResolved.dialect_label,
      target_display_name: toResolved.display_label,
      user_context: "traveller",
      translation_mode: "speak_to_local",
      ai_translation_enabled: true,
      rule_fallback_enabled: true,
    });

    if (!response.translated_text && !response.natural_translation) {
      throw new Error(response.unavailable_reason ?? "Translation unavailable.");
    }

    await updateOfflineMissingRequestStatus(request.id, {
      status: "synced",
      synced_at: new Date().toISOString(),
      translated_text: response.translated_text || response.natural_translation,
      pronunciation_simple: response.pronunciation_simple,
      usage_note: response.usage_note,
      translation_source: response.source,
    });

    return {
      translated_text: response.translated_text || response.natural_translation,
      pronunciation_simple: response.pronunciation_simple,
      usage_note: response.usage_note,
      source: response.source,
    };
  } catch (error) {
    await updateOfflineMissingRequestStatus(request.id, { status: "saved_locally" });
    throw error;
  }
}

export async function addMissingPhraseToOfflinePack(
  request: OfflineMissingRequest,
): Promise<OfflineStoredPack> {
  if (!getMissingPhraseTranslation(request)) {
    throw new Error("Generate a translation before adding this phrase to your offline pack.");
  }

  const existingPack = await getOfflinePackByKey(request.pack_key);
  const { pack, entry, createdPack } = await buildPackWithMissingPhraseEntry(
    existingPack,
    request,
    async (pack, entry) => {
      if (typeof window === "undefined" || !navigator.onLine) {
        return entry;
      }

      const cached = await cacheSingleOfflineEntryAudio(
        pack,
        entry,
        request.to_language_id,
      );
      return cached.entry;
    },
  );

  await saveOfflinePack(pack);
  await updateOfflineMissingRequestStatus(request.id, {
    pack_entry_id: entry.id,
  });

  const normalizedAdded = normalizeOfflineSearchText(request.requested_text);
  const relatedRequests = await listOfflineMissingRequests(request.pack_key);
  await Promise.all(
    relatedRequests
      .filter((item) => {
        if (item.pack_entry_id) return false;
        const normalizedItem = normalizeOfflineSearchText(item.requested_text);
        return (
          normalizedItem === normalizedAdded ||
          normalizedItem.includes(normalizedAdded) ||
          normalizedAdded.includes(normalizedItem)
        );
      })
      .map((item) =>
        updateOfflineMissingRequestStatus(item.id, { pack_entry_id: entry.id }),
      ),
  );

  if (createdPack && typeof window !== "undefined") {
    setActiveOfflinePairKey(pack.pack_key);
  }

  return pack;
}

export async function copyGeneratedMissingPhrase(
  request: OfflineMissingRequest,
): Promise<void> {
  const text = await copyMissingPhraseText(request);
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Copy is not supported in this browser.");
  }
  await navigator.clipboard.writeText(text);
}

export {
  getMissingPhraseOfflineCacheKey,
  getMissingPhraseTranslation,
};

export {
  getRecentPairs,
  getRecentPhrases,
  listOfflinePacks,
  listOfflineFavoriteEntryIds,
  listOfflineMissingRequests,
  isOfflineFavorite,
  updateOfflineMissingRequestStatus,
};
