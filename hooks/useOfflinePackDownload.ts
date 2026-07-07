"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import {
  createPackDownloadRuntime,
  type PackDownloadRuntime,
} from "@/lib/offline/offlinePackDownload";
import {
  buildPackDownloadSnapshot,
  type PackDownloadSnapshot,
} from "@/lib/offline/offlinePackDownloadTypes";
import { isActiveDownloadStatus } from "@/lib/offline/offlinePackDownloadProgress";
import type { OfflinePackGenerateRequest } from "@/lib/offline/offlinePackSchemas";
import {
  downloadOfflineLanguagePairPack,
  getOfflinePackDownloadState,
  isBrowserOnline,
  retryOfflinePackAudio,
} from "@/lib/offline/offlinePackService";

const IDLE_SNAPSHOT: PackDownloadSnapshot = {
  phase: "idle",
  progressPercent: 0,
  completedItems: 0,
  audioCompletedItems: 0,
  totalItems: 0,
  message: "",
};

export function useOfflinePackDownload() {
  const runtimeRef = useRef<PackDownloadRuntime | null>(null);
  const [snapshot, setSnapshot] = useState<PackDownloadSnapshot>(IDLE_SNAPSHOT);
  const [isRunning, setIsRunning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const ensureRuntime = useCallback(() => {
    if (!runtimeRef.current) {
      runtimeRef.current = createPackDownloadRuntime();
    }
    return runtimeRef.current;
  }, []);

  const refreshStoredProgress = useCallback(async (packKey: string) => {
    const progress = await getOfflinePackDownloadState(packKey);
    if (!progress) {
      setSnapshot(IDLE_SNAPSHOT);
      return;
    }
    setSnapshot(buildPackDownloadSnapshot(progress, progress.error_message));
  }, []);

  useEffect(() => {
    setIsOnline(isBrowserOnline());
    const handleOnline = () => {
      setIsOnline(true);
      runtimeRef.current?.resume();
    };
    const handleOffline = () => {
      setIsOnline(false);
      runtimeRef.current?.pause();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        runtimeRef.current?.pause();
        return;
      }
      runtimeRef.current?.resume();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const startDownload = useCallback(
    async (request: OfflinePackGenerateRequest, options?: { resume?: boolean }) => {
      const runtime = ensureRuntime();
      runtime.resume();
      setIsRunning(true);
      setSnapshot({
        phase: "preparing",
        progressPercent: 0,
        completedItems: 0,
        audioCompletedItems: 0,
        totalItems: 0,
        message: "Preparing download…",
      });

      try {
        const pack = await downloadOfflineLanguagePairPack(request, {
          resume: options?.resume,
          runtime,
          onSnapshot: setSnapshot,
        });
        setSnapshot((current) => ({
          ...current,
          phase: "downloaded",
          progressPercent: 100,
          message:
            pack.audio_coverage_percent > 0
              ? `Downloaded with ${pack.audio_coverage_percent}% audio.`
              : "Text downloaded. Audio can be retried.",
        }));
        return pack;
      } catch (error) {
        const code = (error as Error & { code?: PackDownloadSnapshot["errorCode"] }).code;
        if (code === "cancelled") {
          setSnapshot((current) => ({
            ...current,
            phase: "cancelled",
            message: "Download cancelled. Tap Download to resume.",
          }));
        }
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [ensureRuntime],
  );

  const retryAudio = useCallback(
    async (request: OfflinePackGenerateRequest) => {
      const runtime = ensureRuntime();
      runtime.resume();
      setIsRunning(true);
      try {
        return await retryOfflinePackAudio(request, {
          runtime,
          onSnapshot: setSnapshot,
        });
      } finally {
        setIsRunning(false);
      }
    },
    [ensureRuntime],
  );

  const cancelDownload = useCallback(() => {
    runtimeRef.current?.cancel();
    setSnapshot((current) => ({
      ...current,
      phase: "cancelled",
      message: "Download cancelled. Tap Download to resume.",
    }));
    setIsRunning(false);
  }, []);

  const resumeDownload = useCallback(
    async (request: OfflinePackGenerateRequest) => {
      return startDownload(request, { resume: true });
    },
    [startDownload],
  );

  const loadProgressForPair = useCallback(
    async (fromLanguage: string, toLanguage: string) => {
      if (!fromLanguage || !toLanguage) {
        setSnapshot(IDLE_SNAPSHOT);
        return;
      }
      const packKey = buildOfflinePackKey(fromLanguage, toLanguage);
      await refreshStoredProgress(packKey);
    },
    [refreshStoredProgress],
  );

  const showProgress =
    isRunning || isActiveDownloadStatus(snapshot.phase) || snapshot.phase === "paused";

  return {
    snapshot,
    isRunning,
    isOnline,
    showProgress,
    startDownload,
    resumeDownload,
    retryAudio,
    cancelDownload,
    loadProgressForPair,
  };
}
