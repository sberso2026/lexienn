import { detectClientPlatform } from "@/lib/platform/detectClientPlatform";
import { requestMicrophoneStream } from "@/lib/speech/audioCapture";
import {
  isBrowserSpeechRecognitionSupported,
  startBrowserSpeechInterimAssist,
  startBrowserSpeechSession,
} from "@/lib/speech/browserSpeechRecognition";
import { isBrowserOnline } from "@/lib/speech/speechToTextClient";
import {
  buildCapturedSpeechPreview,
  chooseBestTranscript,
  mergeFinalTranscriptChunk,
  normalizeTranscriptWhitespace,
} from "@/lib/voice/transcriptMerge";
import { VoiceTranscribeApiError, transcribeRecordedAudio } from "@/lib/voice/voiceTranscribeClient";
import type {
  VoiceCaptureCallbacks,
  VoiceCaptureMode,
  VoiceCaptureRequest,
  VoiceCaptureResult,
} from "@/lib/voice/voiceState";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/ogg;codecs=opus",
];

export function isMediaRecorderSupported(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined";
}

export function selectMediaRecorderMimeType(): string | null {
  if (!isMediaRecorderSupported()) return null;
  return MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

export function preferMobileRecordedTranscription(): boolean {
  const platform = detectClientPlatform();
  return (
    platform.isIos ||
    platform.isStandalonePwa ||
    /Android/i.test(platform.userAgent) ||
    (typeof window !== "undefined" && window.innerWidth < 900)
  );
}

export function resolveVoiceCaptureMode(): VoiceCaptureMode {
  if (!isMediaRecorderSupported()) {
    return isBrowserSpeechRecognitionSupported()
      ? "realtime_browser_speech"
      : "recorded_audio_transcription";
  }
  if (preferMobileRecordedTranscription()) return "hybrid_mobile";
  return isBrowserSpeechRecognitionSupported()
    ? "realtime_browser_speech"
    : "recorded_audio_transcription";
}

type RecordingHandle = {
  stop: () => Promise<{ blob: Blob; mimeType: string; durationMs: number }>;
  mimeType: string;
};

function startRecordingSession(options: {
  stream: MediaStream;
  mimeType: string;
  maxDurationMs: number;
  onStarted?: () => void;
  signal?: AbortSignal;
}): RecordingHandle {
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();
  let recorder: MediaRecorder;

  try {
    recorder = new MediaRecorder(options.stream, { mimeType: options.mimeType });
  } catch {
    recorder = new MediaRecorder(options.stream);
  }

  const actualMimeType = recorder.mimeType || options.mimeType;
  let timerId = 0;

  const cleanup = () => {
    window.clearTimeout(timerId);
    options.stream.getTracks().forEach((track) => track.stop());
  };

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.start(250);
  options.onStarted?.();

  timerId = window.setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, options.maxDurationMs);

  return {
    mimeType: actualMimeType,
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = () => {
          cleanup();
          if (chunks.length === 0) {
            reject(new Error("No audio was captured."));
            return;
          }
          resolve({
            blob: new Blob(chunks, { type: actualMimeType }),
            mimeType: actualMimeType,
            durationMs: Date.now() - startedAt,
          });
        };

        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error("Recording failed."));
        }
      }),
  };
}

export type VoiceCaptureSession = {
  ready: Promise<void>;
  completion?: Promise<VoiceCaptureResult>;
  stop: () => Promise<VoiceCaptureResult>;
  abort: () => void;
  getPreview: () => {
    finalTranscript: string;
    interimTranscript: string;
    capturedSpeechPreview: string;
  };
  captureMode: VoiceCaptureMode;
  selectedMimeType: string | null;
};

export function startVoiceCapture(
  request: VoiceCaptureRequest,
  callbacks: VoiceCaptureCallbacks = {},
  signal?: AbortSignal,
): VoiceCaptureSession {
  const captureMode = resolveVoiceCaptureMode();
  const maxDurationMs = request.maxDurationMs ?? 60_000;
  const selectedMimeType = selectMediaRecorderMimeType();

  let finalTranscript = "";
  let interimTranscript = "";
  let recording: RecordingHandle | null = null;
  let speechAssist: ReturnType<typeof startBrowserSpeechInterimAssist> | null = null;
  let browserSessionStop: (() => void) | null = null;
  let timerId = 0;
  let startedAt = 0;
  let aborted = false;
  let completion: Promise<VoiceCaptureResult> | undefined;
  const readyCallbacks: {
    resolve: (() => void) | null;
    reject: ((error: Error) => void) | null;
  } = { resolve: null, reject: null };

  const ready = new Promise<void>((resolve, reject) => {
    readyCallbacks.resolve = () => resolve();
    readyCallbacks.reject = reject;
  });

  const emitInterim = () => {
    callbacks.onInterim?.({
      finalTranscript,
      interimTranscript,
      capturedSpeechPreview: buildCapturedSpeechPreview(finalTranscript, interimTranscript),
    });
  };

  const getPreview = () => ({
    finalTranscript,
    interimTranscript,
    capturedSpeechPreview: buildCapturedSpeechPreview(finalTranscript, interimTranscript),
  });

  const abort = () => {
    if (aborted) return;
    aborted = true;
    window.clearInterval(timerId);
    speechAssist?.abort();
    browserSessionStop?.();
  };

  void (async () => {
    try {
      if (aborted) return;
      startedAt = Date.now();
      timerId = window.setInterval(() => {
        callbacks.onTimer?.(Date.now() - startedAt);
      }, 250);

      if (captureMode === "realtime_browser_speech" && isBrowserSpeechRecognitionSupported()) {
        const session = startBrowserSpeechSession({
          languageHint: request.languageHint,
          timeoutMs: maxDurationMs,
          signal,
          onStarted: callbacks.onRecognitionStart,
          onInterim: (text) => {
            interimTranscript = normalizeTranscriptWhitespace(text);
            emitInterim();
          },
          onFinal: (text) => {
            finalTranscript = mergeFinalTranscriptChunk(finalTranscript, text);
            interimTranscript = "";
            emitInterim();
          },
        });
        browserSessionStop = session.stop;
        readyCallbacks.resolve?.();
        completion = session.promise
          .then((result) => {
            if (!aborted) {
              finalTranscript = mergeFinalTranscriptChunk(finalTranscript, result.transcript);
              interimTranscript = "";
              emitInterim();
            }
            return {
              transcript: finalTranscript.trim(),
              captureMode,
              source: "browser_speech" as const,
              refinedFromServer: false,
            };
          })
          .catch((error) => {
            if (finalTranscript.trim()) {
              return {
                transcript: finalTranscript.trim(),
                captureMode,
                source: "browser_fallback" as const,
                refinedFromServer: false,
              };
            }
            throw error;
          });
        return;
      }

      if (!isMediaRecorderSupported() || !selectedMimeType) {
        throw new Error("Voice capture is limited on this browser. Please type instead.");
      }

      const stream = await requestMicrophoneStream();
      if (aborted) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      recording = startRecordingSession({
        stream,
        mimeType: selectedMimeType,
        maxDurationMs,
        onStarted: callbacks.onRecorderStart,
        signal,
      });
      readyCallbacks.resolve?.();

      if (isBrowserSpeechRecognitionSupported()) {
        speechAssist = startBrowserSpeechInterimAssist({
          languageHint: request.languageHint,
          signal,
          onStarted: callbacks.onRecognitionStart,
          onInterim: (text) => {
            interimTranscript = normalizeTranscriptWhitespace(text);
            emitInterim();
          },
          onFinal: (text) => {
            finalTranscript = mergeFinalTranscriptChunk(finalTranscript, text);
            interimTranscript = "";
            emitInterim();
          },
        });
      }
    } catch (error) {
      readyCallbacks.reject?.(error instanceof Error ? error : new Error("Voice capture failed."));
    }
  })();

  const stop = async (): Promise<VoiceCaptureResult> => {
    window.clearInterval(timerId);
    aborted = true;
    await ready.catch(() => undefined);

    browserSessionStop?.();
    const browserSnapshot = speechAssist?.stop() ?? "";
    finalTranscript = mergeFinalTranscriptChunk(finalTranscript, browserSnapshot);
    interimTranscript = "";

    if (captureMode === "realtime_browser_speech" && !recording) {
      return {
        transcript: finalTranscript.trim(),
        captureMode,
        source: "browser_speech",
        refinedFromServer: false,
      };
    }

    if (!recording) {
      if (finalTranscript.trim()) {
        return {
          transcript: finalTranscript.trim(),
          captureMode,
          source: "browser_fallback",
          refinedFromServer: false,
        };
      }
      throw new Error("No speech was detected.");
    }

    const recorded = await recording.stop();
    const browserTranscript = finalTranscript.trim();

    if (
      isBrowserOnline() &&
      (captureMode === "hybrid_mobile" || captureMode === "recorded_audio_transcription")
    ) {
      try {
        const server = await transcribeRecordedAudio({
          audio: recorded.blob,
          languageHint: request.languageHint,
          userContext: request.userContext,
          inputTarget: request.inputTarget,
          durationMs: recorded.durationMs,
          signal,
        });
        const chosen = chooseBestTranscript(browserTranscript, server.transcript);
        return {
          transcript: chosen.transcript,
          captureMode,
          source: "server_transcription",
          refinedFromServer: chosen.refinedFromServer,
          mimeType: recorded.mimeType,
          durationMs: server.durationMs || recorded.durationMs,
          confidence: server.confidence,
        };
      } catch (error) {
        if (browserTranscript) {
          return {
            transcript: browserTranscript,
            captureMode,
            source: "browser_fallback",
            refinedFromServer: false,
            mimeType: recorded.mimeType,
            durationMs: recorded.durationMs,
          };
        }
        if (error instanceof VoiceTranscribeApiError) {
          throw error;
        }
        throw error;
      }
    }

    if (browserTranscript) {
      return {
        transcript: browserTranscript,
        captureMode,
        source: "browser_fallback",
        refinedFromServer: false,
        mimeType: recorded.mimeType,
        durationMs: recorded.durationMs,
      };
    }

    throw new Error("No speech was detected.");
  };

  return {
    ready,
    completion,
    stop,
    abort,
    getPreview,
    captureMode,
    selectedMimeType,
  };
}
