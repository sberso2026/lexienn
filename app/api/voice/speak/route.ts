import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/voice/generateSpeech";
import {
  voiceSpeakRequestSchema,
  voiceSpeakResponseSchema,
} from "@/lib/voice/voiceSchemas";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = voiceSpeakRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid voice request.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateSpeech(parsed.data);
    const validated = voiceSpeakResponseSchema.safeParse(result);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Voice generation produced an invalid response." },
        { status: 500 },
      );
    }
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json({ error: "Voice generation failed." }, { status: 500 });
  }
}
