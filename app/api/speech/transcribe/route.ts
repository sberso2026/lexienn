import { NextResponse } from "next/server";
import { transcribeAudioCloud } from "@/lib/speech/speechToTextService";
import { getSpeechInputConfig } from "@/lib/speech/speechInputConfig";
import {
  speechInputTargetSchema,
  speechTranscribeErrorSchema,
  speechTranscribeResponseSchema,
} from "@/lib/speech/speechInputSchemas";
import { userContextSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const config = getSpeechInputConfig();

  if (!config.enabled) {
    return NextResponse.json(
      speechTranscribeResponseSchema.parse({
        transcript: "Voice input unavailable. Please type manually.",
        confidence_score: 0,
        source: "unavailable",
        warnings: ["Speech input is disabled."],
        unavailable_reason: "Voice input unavailable. Please type manually.",
      }),
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      speechTranscribeErrorSchema.parse({ error: "Request must be multipart form data." }),
      { status: 400 },
    );
  }

  const audioEntry = formData.get("audio");
  const languageHint = String(formData.get("language_hint") ?? "en").trim() || "en";
  const userContextRaw = String(formData.get("user_context") ?? "general");
  const inputTargetRaw = String(formData.get("input_target") ?? "translator");

  const userContextParsed = userContextSchema.safeParse(userContextRaw);
  const inputTargetParsed = speechInputTargetSchema.safeParse(inputTargetRaw);

  if (!userContextParsed.success || !inputTargetParsed.success) {
    return NextResponse.json(
      {
        error: "Invalid speech transcription request.",
        details: [
          ...(userContextParsed.success
            ? []
            : [{ path: "user_context", message: "Invalid user context." }]),
          ...(inputTargetParsed.success
            ? []
            : [{ path: "input_target", message: "Invalid input target." }]),
        ],
      },
      { status: 400 },
    );
  }

  if (!(audioEntry instanceof Blob) || audioEntry.size === 0) {
    return NextResponse.json(
      speechTranscribeErrorSchema.parse({ error: "Audio file is required." }),
      { status: 400 },
    );
  }

  if (audioEntry.size > 10_000_000) {
    return NextResponse.json(
      speechTranscribeErrorSchema.parse({ error: "Audio payload is too large." }),
      { status: 400 },
    );
  }

  const arrayBuffer = await audioEntry.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const mimeType = audioEntry.type || "audio/webm";

  const result = await transcribeAudioCloud({
    audioBuffer,
    mimeType,
    language_hint: languageHint,
    user_context: userContextParsed.data,
    input_target: inputTargetParsed.data,
  });

  const response = speechTranscribeResponseSchema.parse({
    transcript: result.transcript,
    detected_language: result.detected_language,
    confidence_score: result.confidence_score,
    source: result.transcript.startsWith("Voice input unavailable")
      ? "unavailable"
      : "cloud_speech",
    warnings: result.warnings,
    unavailable_reason: result.transcript.startsWith("Voice input unavailable")
      ? result.transcript
      : undefined,
  });

  return NextResponse.json(response);
}
