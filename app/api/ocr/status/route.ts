import { NextResponse } from "next/server";
import { isLocalOcrAvailable } from "@/lib/ocr/localOcrClient";
import { getOcrStatus } from "@/lib/ocr/ocrConfig";

export async function GET() {
  return NextResponse.json(getOcrStatus(isLocalOcrAvailable()));
}
