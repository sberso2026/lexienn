import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/ai/config";
import { aiStatusResponseSchema } from "@/lib/ai/aiStatusSchemas";

export async function GET() {
  const status = getAiStatus();
  const validated = aiStatusResponseSchema.safeParse(status);
  if (!validated.success) {
    return NextResponse.json({ error: "AI status unavailable." }, { status: 500 });
  }
  return NextResponse.json(validated.data);
}
