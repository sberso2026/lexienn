import { NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/ocr/ocrService";
import {
  ocrErrorSchema,
  ocrExtractRequestSchema,
  ocrExtractResponseSchema,
} from "@/lib/ocr/ocrSchemas";

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

  const parsed = ocrExtractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid OCR request.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (parsed.data.image_base64.length > 7_000_000) {
    return NextResponse.json(
      { error: "Image payload is too large. Maximum size is 5 MB." },
      { status: 400 },
    );
  }

  try {
    const result = await extractTextFromImage(parsed.data);
    const validated = ocrExtractResponseSchema.safeParse(result);
    if (!validated.success) {
      return NextResponse.json(
        { error: "OCR produced an invalid response." },
        { status: 500 },
      );
    }
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json(
      ocrErrorSchema.parse({ error: "Image text extraction failed." }),
      { status: 500 },
    );
  }
}
