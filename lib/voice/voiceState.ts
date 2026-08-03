import type { SpeechInputTarget } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";

export type VoiceCaptureMode =
  | "realtime_browser_speech"
  | "recorded_audio_transcription"
  | "hybrid_mobile";

export type VoiceCapturePhase =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "processing_speech"
  | "speech_ready"
  | "speech_error"
  | "permission_denied"
  | "unsupported";

export type VoiceAudioPlaybackPhase =
  | "idle"
  | "loading"
  | "playing"
  | "blocked"
  | "unavailable"
  | "error";

export type VoiceCaptureRequest = {
  languageHint: string;
  /** Locale used for browser SpeechRecognition.lang */
  browserLocaleHint?: string;
  /** When true, skip realtime browser-only path and capture for server STT. */
  preferRecordedTranscription?: boolean;
  userContext: UserContext;
  inputTarget: SpeechInputTarget;
  maxDurationMs?: number;
  /** Bounded textual STT hints (never audio). */
  sttHints?: string[];
};

export type VoiceCaptureResult = {
  transcript: string;
  captureMode: VoiceCaptureMode;
  source: "server_transcription" | "browser_speech" | "browser_fallback";
  refinedFromServer: boolean;
  mimeType?: string;
  durationMs?: number;
  confidence?: number;
  detectedLanguageCode?: string | null;
  detectedLanguageName?: string | null;
  needsConfirmation?: boolean;
  validationReason?: string;
  expectedLanguage?: string;
};

export type VoiceCaptureCallbacks = {
  onRecorderStart?: () => void;
  onRecognitionStart?: () => void;
  onInterim?: (preview: {
    finalTranscript: string;
    interimTranscript: string;
    capturedSpeechPreview: string;
  }) => void;
  onTimer?: (elapsedMs: number) => void;
};
