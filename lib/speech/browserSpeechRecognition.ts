type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript?: string; confidence?: number };
  length: number;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type BrowserSpeechResult = {
  transcript: string;
  confidence_score: number;
  detected_language?: string;
};

export function isBrowserSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function mapLanguageHintToBcp47(languageHint: string): string {
  const normalized = languageHint.trim().toLowerCase();
  if (normalized.includes("-")) return normalized;
  const map: Record<string, string> = {
    en: "en-US",
    zh: "zh-CN",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    ko: "ko-KR",
    pt: "pt-PT",
    ar: "ar-SA",
    hi: "hi-IN",
    th: "th-TH",
    vi: "vi-VN",
    id: "id-ID",
    ms: "ms-MY",
    tl: "fil-PH",
  };
  return map[normalized] ?? normalized;
}

function appendTranscript(previous: string, next: string): string {
  const chunk = next.trim();
  if (!chunk) return previous;
  if (!previous) return chunk;
  if (previous.endsWith(chunk)) return previous;
  return `${previous} ${chunk}`.trim();
}

export type BrowserSpeechOptions = {
  languageHint?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type BrowserSpeechSessionCallbacks = {
  onStarted?: () => void;
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
};

export type BrowserSpeechSession = {
  stop: () => void;
  readonly promise: Promise<BrowserSpeechResult>;
};

export function startBrowserSpeechSession(
  options: BrowserSpeechOptions & BrowserSpeechSessionCallbacks = {},
): BrowserSpeechSession {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) {
    return {
      stop: () => undefined,
      promise: Promise.reject(new Error("Browser speech recognition is not supported.")),
    };
  }

  const timeoutMs = options.timeoutMs ?? 20_000;
  const languageHint = options.languageHint ?? "en";
  let recognition: BrowserSpeechRecognition | null = null;
  let settled = false;
  let stoppedByUser = false;
  let finalTranscript = "";
  let timeoutId = 0;

  const promise = new Promise<BrowserSpeechResult>((resolve, reject) => {
    recognition = new Constructor();
    recognition.lang = mapLanguageHintToBcp47(languageHint);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      options.signal?.removeEventListener("abort", onAbort);
      fn();
    };

    const settleWithTranscript = () => {
      const transcript = finalTranscript.trim();
      if (!transcript) {
        finish(() => reject(new Error("No speech was detected.")));
        return;
      }
      finish(() =>
        resolve({
          transcript,
          confidence_score: 0.8,
          detected_language: languageHint,
        }),
      );
    };

    const onAbort = () => {
      stoppedByUser = true;
      try {
        recognition?.abort();
      } catch {
        // ignore
      }
      if (finalTranscript.trim()) {
        settleWithTranscript();
        return;
      }
      finish(() => reject(new Error("Speech recognition was cancelled.")));
    };

    if (options.signal?.aborted) {
      onAbort();
      return;
    }
    options.signal?.addEventListener("abort", onAbort);

    timeoutId = window.setTimeout(() => {
      stoppedByUser = true;
      try {
        recognition?.stop();
      } catch {
        // ignore
      }
      if (finalTranscript.trim()) {
        settleWithTranscript();
        return;
      }
      finish(() => reject(new Error("Speech recognition timed out.")));
    }, timeoutMs);

    recognition.onstart = () => {
      options.onStarted?.();
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript ?? "";
        if (!text) continue;
        if (result.isFinal) {
          finalTranscript = appendTranscript(finalTranscript, text);
          options.onFinal?.(finalTranscript);
        } else {
          interim = appendTranscript(interim, text);
        }
      }

      const combined = appendTranscript(finalTranscript, interim);
      if (combined) {
        options.onInterim?.(combined);
      }
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        if (finalTranscript.trim()) {
          settleWithTranscript();
          return;
        }
        finish(() => reject(new Error("Speech recognition was cancelled.")));
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        finish(() => reject(new Error("Microphone permission denied.")));
        return;
      }
      if (event.error === "no-speech") {
        if (finalTranscript.trim()) {
          settleWithTranscript();
          return;
        }
        finish(() => reject(new Error("No speech was detected.")));
        return;
      }
      finish(() => reject(new Error(`Speech recognition failed: ${event.error}`)));
    };

    recognition.onend = () => {
      if (settled) return;
      if (stoppedByUser || finalTranscript.trim()) {
        settleWithTranscript();
        return;
      }
      finish(() => reject(new Error("No speech was detected.")));
    };

    try {
      recognition.start();
    } catch (error) {
      finish(() =>
        reject(
          error instanceof Error
            ? error
            : new Error("Could not start speech recognition."),
        ),
      );
    }
  });

  return {
    stop: () => {
      if (settled) return;
      stoppedByUser = true;
      try {
        recognition?.stop();
      } catch {
        try {
          recognition?.abort();
        } catch {
          // ignore
        }
      }
    },
    promise,
  };
}

export async function transcribeWithBrowserSpeech(
  options: BrowserSpeechOptions = {},
): Promise<BrowserSpeechResult> {
  const session = startBrowserSpeechSession(options);
  return session.promise;
}
