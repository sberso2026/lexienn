import { NextResponse } from "next/server";
import { getAiPublicStatus, getAiStatus } from "@/lib/ai/config";
import {
  aiPublicStatusResponseSchema,
  aiStatusResponseSchema,
} from "@/lib/ai/aiStatusSchemas";

export const runtime = "nodejs";

export async function GET() {
  const publicStatus = getAiPublicStatus();
  const validated = aiPublicStatusResponseSchema.safeParse(publicStatus);
  if (!validated.success) {
    return NextResponse.json({ error: "AI status unavailable." }, { status: 500 });
  }

  // Legacy snake_case fields for existing clients — no secrets.
  const legacy = getAiStatus();
  const legacyValidated = aiStatusResponseSchema.safeParse(legacy);
  if (!legacyValidated.success) {
    return NextResponse.json({ error: "AI status unavailable." }, { status: 500 });
  }

  return NextResponse.json({
    ...validated.data,
    ...legacyValidated.data,
  });
}
