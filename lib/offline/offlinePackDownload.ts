import { cacheOfflinePackAudio } from "@/lib/offline/cacheOfflinePackAudio";
import { applyCoverageMetricsToPack } from "@/lib/offline/offlinePackCoverage";
import { probeOfflineStorageWritable } from "@/lib/offline/offlineAudioCache";
import {
  buildPackDownloadSnapshot,
  MIN_FREE_STORAGE_BYTES,
  PACK_DOWNLOAD_ERROR_MESSAGES,
  PACK_FETCH_TIMEOUT_MS,
  TEXT_SAVE_BATCH_SIZE,
  type PackDownloadErrorCode,
  type PackDownloadSnapshot,
} from "@/lib/offline/offlinePackDownloadTypes";
import {
  clearOfflinePackDownloadBuffer,
  createInitialDownloadProgress,
  getOfflinePackDownloadBuffer,
  getOfflinePackDownloadProgress,
  patchOfflinePackDownloadProgress,
  removeOfflinePackDownloadProgress,
  saveOfflinePackDownloadBuffer,
  saveOfflinePackDownloadProgress,
  toDownloadErrorCode,
} from "@/lib/offline/offlinePackDownloadProgress";
import { generateOfflineLanguagePairPack } from "@/lib/offline/offlinePackGenerator";
import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import type {
  OfflinePackGenerateRequest,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import {
  getOfflinePackByKey,
  saveOfflinePack,
} from "@/lib/offline/localOfflineStore";
import {
  getStorageEstimate,
  isBrowserOnline,
  setActiveOfflinePairKey,
} from "@/lib/offline/offlinePackService";
import { recordRecentPair } from "@/lib/offline/localOfflineStore";
import { verifyOfflinePackReadable } from "@/lib/offline/offlinePackVerification";

export type PackDownloadRuntime = {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  isPaused: () => boolean;
  isCancelled: () => boolean;
};

export type RunOfflinePackDownloadOptions = {
  request: OfflinePackGenerateRequest;
  resume?: boolean;
  audioOnly?: boolean;
  onSnapshot?: (snapshot: PackDownloadSnapshot) => void;
  runtime?: PackDownloadRuntime;
};

class PackDownloadAbortError extends Error {
  code: PackDownloadErrorCode;

  constructor(code: PackDownloadErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function createRuntime(): PackDownloadRuntime {
  let paused = false;
  let cancelled = false;
  let resumeWaiters: Array<() => void> = [];

  const notifyResume = () => {
    const waiters = resumeWaiters;
    resumeWaiters = [];
    for (const waiter of waiters) waiter();
  };

  return {
    pause: () => {
      paused = true;
    },
    resume: () => {
      if (!paused) return;
      paused = false;
      notifyResume();
    },
    cancel: () => {
      cancelled = true;
      paused = false;
      notifyResume();
    },
    isPaused: () => paused,
    isCancelled: () => cancelled,
  };
}

async function waitUntilActive(runtime: PackDownloadRuntime): Promise<void> {
  while (runtime.isPaused() && !runtime.isCancelled()) {
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  if (runtime.isCancelled()) {
    throw new PackDownloadAbortError("cancelled", PACK_DOWNLOAD_ERROR_MESSAGES.cancelled);
  }
}

async function emitSnapshot(
  packKey: string,
  patch: Parameters<typeof patchOfflinePackDownloadProgress>[1],
  onSnapshot?: (snapshot: PackDownloadSnapshot) => void,
  message?: string,
): Promise<void> {
  const record = await patchOfflinePackDownloadProgress(packKey, patch);
  if (record && onSnapshot) {
    onSnapshot(buildPackDownloadSnapshot(record, message));
  }
}

async function assertStorageReady(estimatedBytes: number): Promise<void> {
  const estimate = await getStorageEstimate();
  if (!estimate.supported) {
    try {
      await probeOfflineStorageWritable();
    } catch {
      throw Object.assign(
        new Error(PACK_DOWNLOAD_ERROR_MESSAGES.unsupported_storage),
        { code: "unsupported_storage" satisfies PackDownloadErrorCode },
      );
    }
    return;
  }

  const quota = estimate.quotaBytes ?? 0;
  const usage = estimate.usageBytes ?? 0;
  const freeBytes = quota > 0 ? quota - usage : Number.POSITIVE_INFINITY;
  const requiredBytes = Math.max(estimatedBytes, MIN_FREE_STORAGE_BYTES);

  if (freeBytes < requiredBytes) {
    throw Object.assign(
      new Error(PACK_DOWNLOAD_ERROR_MESSAGES.storage_quota_exceeded),
      { code: "storage_quota_exceeded" satisfies PackDownloadErrorCode },
    );
  }

  try {
    await probeOfflineStorageWritable();
  } catch {
    throw Object.assign(
      new Error(PACK_DOWNLOAD_ERROR_MESSAGES.unsupported_storage),
      { code: "unsupported_storage" satisfies PackDownloadErrorCode },
    );
  }
}

async function fetchGeneratedPack(
  request: OfflinePackGenerateRequest,
): Promise<OfflineStoredPack> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), PACK_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch("/api/offline-packs/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        details?: string;
      } | null;
      const message = payload?.details
        ? `${payload.error ?? "Could not download offline pack."} ${payload.details}`
        : payload?.error ?? "Could not download offline pack.";
      throw Object.assign(new Error(message), {
        code: response.status >= 500 ? "server_timeout" : "network_error",
      });
    }

    const payload = (await response.json()) as { pack: OfflineStoredPack };
    return payload.pack;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw Object.assign(new Error(PACK_DOWNLOAD_ERROR_MESSAGES.server_timeout), {
        code: "server_timeout" satisfies PackDownloadErrorCode,
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function savePackEntriesInBatches(input: {
  packKey: string;
  sourcePack: OfflineStoredPack;
  startIndex: number;
  runtime: PackDownloadRuntime;
  onSnapshot?: (snapshot: PackDownloadSnapshot) => void;
}): Promise<OfflineStoredPack> {
  const total = input.sourcePack.entries.length;
  let savedEntries = input.sourcePack.entries.slice(0, input.startIndex);

  for (let index = input.startIndex; index < total; index += TEXT_SAVE_BATCH_SIZE) {
    await waitUntilActive(input.runtime);
    if (!isBrowserOnline()) {
      throw Object.assign(new Error(PACK_DOWNLOAD_ERROR_MESSAGES.network_error), {
        code: "network_error" satisfies PackDownloadErrorCode,
      });
    }

    const nextSlice = input.sourcePack.entries.slice(index, index + TEXT_SAVE_BATCH_SIZE);
    savedEntries = [...savedEntries, ...nextSlice];
    const partialPack = applyCoverageMetricsToPack({
      ...input.sourcePack,
      entries: savedEntries,
      status: "text_ready",
      downloaded_at: input.sourcePack.downloaded_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    try {
      await saveOfflinePack(partialPack);
    } catch (error) {
      throw Object.assign(
        new Error(PACK_DOWNLOAD_ERROR_MESSAGES.indexeddb_write_failed),
        { code: "indexeddb_write_failed" satisfies PackDownloadErrorCode, cause: error },
      );
    }

    await emitSnapshot(
      input.packKey,
      {
        status: "downloading_text",
        completed_items: savedEntries.length,
      },
      input.onSnapshot,
      `Saving phrases ${savedEntries.length}/${total}`,
    );
  }

  return applyCoverageMetricsToPack({
    ...input.sourcePack,
    entries: savedEntries,
    status: "text_ready",
    downloaded_at: input.sourcePack.downloaded_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function runResumableOfflinePackDownload(
  options: RunOfflinePackDownloadOptions,
): Promise<OfflineStoredPack> {
  const runtime = options.runtime ?? createRuntime();
  const request = options.request;
  const packKey = buildOfflinePackKey(request.from_language, request.to_language);
  const includeAudio = request.include_audio_manifest !== false;

  let progress =
    (options.resume ? await getOfflinePackDownloadProgress(packKey) : null) ??
    createInitialDownloadProgress({
      packKey,
      sourceLanguage: request.from_language,
      targetLanguage: request.to_language,
      category: request.pack_tier ?? "lite",
      totalItems: 0,
      request,
      includeAudio,
    });

  await saveOfflinePackDownloadProgress({
    ...progress,
    status: "preparing",
    request,
    updated_at: new Date().toISOString(),
  });
  options.onSnapshot?.(
    buildPackDownloadSnapshot(progress, "Preparing download…"),
  );

  try {
    if (!options.audioOnly) {
      const existingPack = await getOfflinePackByKey(packKey);
      const estimatedBytes = existingPack?.estimated_size_bytes ?? 2 * 1024 * 1024;
      await assertStorageReady(estimatedBytes);

      let sourcePack =
        (await getOfflinePackDownloadBuffer(packKey)) ??
        (progress.completed_items > 0 ? existingPack : null);

      if (!sourcePack) {
        await waitUntilActive(runtime);
        if (!isBrowserOnline()) {
          throw Object.assign(new Error(PACK_DOWNLOAD_ERROR_MESSAGES.network_error), {
            code: "network_error" satisfies PackDownloadErrorCode,
          });
        }

        await emitSnapshot(
          packKey,
          { status: "downloading_text", completed_items: progress.completed_items },
          options.onSnapshot,
          "Downloading phrase text…",
        );
        sourcePack = await fetchGeneratedPack(request);
        await saveOfflinePackDownloadBuffer(packKey, sourcePack);
        progress = {
          ...progress,
          total_items: sourcePack.entries.length,
        };
        await saveOfflinePackDownloadProgress(progress);
      } else if (progress.total_items === 0) {
        progress = { ...progress, total_items: sourcePack.entries.length };
        await saveOfflinePackDownloadProgress(progress);
      }

      const startIndex = progress.completed_items;
      if (startIndex < sourcePack.entries.length) {
        const textReadyPack = await savePackEntriesInBatches({
          packKey,
          sourcePack,
          startIndex,
          runtime,
          onSnapshot: options.onSnapshot,
        });
        await saveOfflinePack(textReadyPack);
        progress = {
          ...(await getOfflinePackDownloadProgress(packKey))!,
          completed_items: textReadyPack.entries.length,
          total_items: textReadyPack.entries.length,
        };
        await saveOfflinePackDownloadProgress(progress);
      }

      await clearOfflinePackDownloadBuffer(packKey);
      setActiveOfflinePairKey(packKey);
      await recordRecentPair({
        pack_key: packKey,
        from_language_id: request.from_language,
        to_language_id: request.to_language,
        from_display_name:
          request.from_display_name ?? request.from_language,
        to_display_name: request.target_display_name ?? request.to_language,
        used_at: new Date().toISOString(),
      });
    }

    let pack = await getOfflinePackByKey(packKey);
    if (!pack) {
      throw Object.assign(new Error(PACK_DOWNLOAD_ERROR_MESSAGES.verification_failed), {
        code: "verification_failed" satisfies PackDownloadErrorCode,
      });
    }

    if (includeAudio) {
      await emitSnapshot(
        packKey,
        { status: "downloading_audio", audio_completed_items: progress.audio_completed_items },
        options.onSnapshot,
        `Downloading audio ${progress.audio_completed_items}/${pack.entries.length}`,
      );

      await saveOfflinePack({ ...pack, status: "audio_downloading" });

      const audioResult = await cacheOfflinePackAudio(pack, request.to_language, {
        startFromIndex: progress.audio_completed_items,
        shouldContinue: () => isBrowserOnline() && !runtime.isPaused() && !runtime.isCancelled(),
        onProgress: async ({ cached, total }) => {
          await emitSnapshot(
            packKey,
            {
              status: "downloading_audio",
              audio_completed_items: cached,
              total_items: total,
            },
            options.onSnapshot,
            `Downloading audio ${cached}/${total}`,
          );
        },
      });

      pack = audioResult.pack;
      const audioFailed = audioResult.cached < pack.entries.length;
      if (audioFailed) {
        pack = {
          ...pack,
          status: "text_ready",
        };
      } else {
        pack = {
          ...pack,
          status: "downloaded",
        };
      }
      await saveOfflinePack(pack);

      progress = {
        ...(await getOfflinePackDownloadProgress(packKey))!,
        audio_completed_items: audioResult.cached,
        completed_items: pack.entries.length,
        total_items: pack.entries.length,
      };
      await saveOfflinePackDownloadProgress(progress);

      if (audioFailed) {
        await emitSnapshot(
          packKey,
          {
            status: "downloaded",
            error_code: "audio_failed",
            error_message: PACK_DOWNLOAD_ERROR_MESSAGES.audio_failed,
          },
          options.onSnapshot,
          PACK_DOWNLOAD_ERROR_MESSAGES.audio_failed,
        );
        await removeOfflinePackDownloadProgress(packKey);
        return pack;
      }
    }

    await emitSnapshot(packKey, { status: "verifying" }, options.onSnapshot, "Verifying pack…");
    const verification = await verifyOfflinePackReadable(pack, request, {
      requireAudio: false,
    });
    if (!verification.ok) {
      throw Object.assign(new Error(PACK_DOWNLOAD_ERROR_MESSAGES.verification_failed), {
        code: "verification_failed" satisfies PackDownloadErrorCode,
      });
    }

    const finalPack: OfflineStoredPack = {
      ...pack,
      status:
        includeAudio && pack.audio_coverage_percent < 100 ? "text_ready" : "downloaded",
      downloaded_at: pack.downloaded_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveOfflinePack(finalPack);

    await emitSnapshot(
      packKey,
      {
        status: "downloaded",
        completed_items: finalPack.entries.length,
        audio_completed_items: verification.audioCount,
        error_code: undefined,
        error_message: undefined,
      },
      options.onSnapshot,
      includeAudio && finalPack.status === "text_ready"
        ? PACK_DOWNLOAD_ERROR_MESSAGES.audio_failed
        : "Pack downloaded.",
    );
    await removeOfflinePackDownloadProgress(packKey);
    return finalPack;
  } catch (error) {
    const code = toDownloadErrorCode(error);
    const message = mapErrorMessage(code, error);
    const partialPack = await getOfflinePackByKey(packKey);
    const paused = code === "network_error" && !isBrowserOnline();

    await patchOfflinePackDownloadProgress(packKey, {
      status: paused ? "paused" : code === "cancelled" ? "cancelled" : "failed",
      error_code: code,
      error_message: message,
      completed_items: partialPack?.entries.length ?? progress.completed_items,
    });
    const record = await getOfflinePackDownloadProgress(packKey);
    if (record) {
      options.onSnapshot?.(buildPackDownloadSnapshot(record, message));
    }

    if (partialPack && partialPack.entries.length > 0 && code !== "cancelled") {
      return partialPack;
    }

    throw Object.assign(error instanceof Error ? error : new Error(message), { code });
  }
}

function mapErrorMessage(code: PackDownloadErrorCode, error: unknown): string {
  if (code === "network_error" && !isBrowserOnline()) {
    return "Waiting for connection";
  }
  if (error instanceof Error && error.message && code === "network_error") {
    return error.message;
  }
  return PACK_DOWNLOAD_ERROR_MESSAGES[code] ?? "Could not download offline pack.";
}

export async function retryOfflinePackAudioDownload(
  request: OfflinePackGenerateRequest,
  options?: Pick<RunOfflinePackDownloadOptions, "onSnapshot" | "runtime">,
): Promise<OfflineStoredPack> {
  return runResumableOfflinePackDownload({
    request,
    resume: true,
    audioOnly: true,
    onSnapshot: options?.onSnapshot,
    runtime: options?.runtime,
  });
}

export function createPackDownloadRuntime(): PackDownloadRuntime {
  return createRuntime();
}

export async function downloadOfflineLanguagePairPackBrowser(
  request: OfflinePackGenerateRequest,
  options?: Pick<RunOfflinePackDownloadOptions, "onSnapshot" | "runtime" | "resume">,
): Promise<OfflineStoredPack> {
  const packKey = buildOfflinePackKey(request.from_language, request.to_language);
  const existingProgress = await getOfflinePackDownloadProgress(packKey);
  const shouldResume =
    options?.resume ??
    Boolean(
      existingProgress &&
        existingProgress.status !== "downloaded" &&
        existingProgress.completed_items > 0,
    );

  return runResumableOfflinePackDownload({
    request,
    resume: shouldResume,
    onSnapshot: options?.onSnapshot,
    runtime: options?.runtime,
  });
}

// Server/test fallback remains in offlinePackService
export async function downloadOfflineLanguagePairPackNode(
  request: OfflinePackGenerateRequest,
): Promise<OfflineStoredPack> {
  const generated = await generateOfflineLanguagePairPack(request);
  if (!generated) {
    throw new Error(
      "Pack unavailable. Connect online with AI enabled, or choose a curated English-to-target pair.",
    );
  }
  const generatedPack = generated.pack;
  await saveOfflinePack({ ...generatedPack, status: "text_ready" });
  const finalPack: OfflineStoredPack = {
    ...generatedPack,
    status: "downloaded",
    downloaded_at: generatedPack.downloaded_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await saveOfflinePack(finalPack);
  return finalPack;
}
