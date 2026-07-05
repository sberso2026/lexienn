import { NextResponse } from "next/server";
import { getVoiceStatus } from "@/lib/voice/voiceConfig";
import { voiceStatusResponseSchema } from "@/lib/voice/voiceSchemas";

export async function GET() {
  const status = getVoiceStatus();
  const validated = voiceStatusResponseSchema.safeParse(status);
  if (!validated.success) {
    return NextResponse.json({ error: "Voice status unavailable." }, { status: 500 });
  }
  return NextResponse.json(validated.data);
}
