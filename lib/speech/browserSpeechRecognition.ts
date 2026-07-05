type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript?: string; confidence?: number }>>;
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

export type BrowserSpeechOptions = {
  languageHint?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export async function transcribeWithBrowserSpeech(
  options: BrowserSpeechOptions = {},
): Promise<BrowserSpeechResult> {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) {
    throw new Error("Browser speech recognition is not supported.");
  }

  const timeoutMs = options.timeoutMs ?? 20_000;
  const languageHint = options.languageHint ?? "en";

  return new Promise<BrowserSpeechResult>((resolve, reject) => {
    const recognition = new Constructor();
    recognition.lang = mapLanguageHintToBcp47(languageHint);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      options.signal?.removeEventListener("abort", onAbort);
      fn();
    };

    const onAbort = () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      finish(() => reject(new Error("Speech recognition was cancelled.")));
    };

    if (options.signal?.aborted) {
      onAbort();
      return;
    }
    options.signal?.addEventListener("abort", onAbort);

    const timeoutId = window.setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      finish(() => reject(new Error("Speech recognition timed out.")));
    }, timeoutMs);

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const result = event.results[0]?.[0];
      const transcript = result?.transcript?.trim() ?? "";
      const confidence = typeof result?.confidence === "number" ? result.confidence : 0.75;

      if (!transcript) {
        finish(() => reject(new Error("No speech was detected.")));
        return;
      }

      finish(() =>
        resolve({
          transcript,
          confidence_score: confidence,
          detected_language: languageHint,
        }),
      );
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        finish(() => reject(new Error("Microphone permission denied.")));
        return;
      }
      if (event.error === "no-speech") {
        finish(() => reject(new Error("No speech was detected.")));
        return;
      }
      if (event.error === "aborted") {
        finish(() => reject(new Error("Speech recognition was cancelled.")));
        return;
      }
      finish(() => reject(new Error(`Speech recognition failed: ${event.error}`)));
    };

    recognition.onend = () => {
      // onresult or onerror should settle; noop fallback
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
}
