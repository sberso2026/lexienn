import { NextResponse } from "next/server";
import { transcribeAudioCloud } from "@/lib/speech/speechToTextService";
import { getSpeechInputConfig } from "@/lib/speech/speechInputConfig";
import { speechInputTargetSchema } from "@/lib/speech/speechInputSchemas";
import { userContextSchema } from "@/lib/schemas";

const TRANSCRIPTION_TIMEOUT_MS = 15_000;
const MAX_AUDIO_BYTES = 10_000_000;

const SUPPORTED_MIME_PREFIXES = [
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/ogg",
  "audio/mpeg",
];

export async function HEAD() {
  const config = getSpeechInputConfig();
  return NextResponse.json({ available: config.enabled }, { status: 200 });
}

export async function POST(request: Request) {
  const config = getSpeechInputConfig();

  if (!config.enabled) {
    return NextResponse.json(
      {
        error: "High-reliability mobile transcription is not configured yet.",
        code: "transcription_unavailable",
      },
      { status: 503 },
    );
  }

  if (!config.isConfigured) {
    return NextResponse.json(
      {
        error: "High-reliability mobile transcription is not configured yet.",
        code: "transcription_provider_unavailable",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart form data.", code: "invalid_request" },
      { status: 400 },
    );
  }

  const audioEntry = formData.get("audio");
  const languageHint = String(formData.get("language_hint") ?? "en").trim() || "en";
  const userContextRaw = String(formData.get("user_context") ?? "general");
  const inputTargetRaw = String(formData.get("input_target") ?? "translator");
  const durationMsRaw = String(formData.get("duration_ms") ?? "").trim();
  const durationMs = durationMsRaw ? Number.parseInt(durationMsRaw, 10) : 0;

  const userContextParsed = userContextSchema.safeParse(userContextRaw);
  const inputTargetParsed = speechInputTargetSchema.safeParse(inputTargetRaw);

  if (!userContextParsed.success || !inputTargetParsed.success) {
    return NextResponse.json(
      { error: "Invalid transcription request.", code: "invalid_request" },
      { status: 400 },
    );
  }

  if (!(audioEntry instanceof Blob) || audioEntry.size === 0) {
    return NextResponse.json(
      { error: "Microphone audio is required.", code: "microphone_unavailable" },
      { status: 400 },
    );
  }

  if (audioEntry.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio payload is too large.", code: "audio_too_large" },
      { status: 400 },
    );
  }

  const mimeType = audioEntry.type || "audio/webm";
  if (!SUPPORTED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    return NextResponse.json(
      { error: "Unsupported audio format.", code: "unsupported_audio_format" },
      { status: 415 },
    );
  }

  const arrayBuffer = await audioEntry.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

  try {
    const result = await transcribeAudioCloud({
      audioBuffer,
      mimeType,
      language_hint: languageHint,
      user_context: userContextParsed.data,
      input_target: inputTargetParsed.data,
    });

    if (result.transcript.startsWith("Voice input unavailable")) {
      return NextResponse.json(
        {
          error: "Transcription provider unavailable.",
          code: "transcription_provider_unavailable",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      transcript: result.transcript,
      confidence: result.confidence_score,
      provider: config.provider,
      durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Speech transcription timed out.", code: "transcription_timeout" },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeoutId);
    void controller.abort();
  }
}
