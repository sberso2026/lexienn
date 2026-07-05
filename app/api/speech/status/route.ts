import { NextResponse } from "next/server";
import { getSpeechInputStatus } from "@/lib/speech/speechInputConfig";

export async function GET() {
  return NextResponse.json(getSpeechInputStatus(false));
}
