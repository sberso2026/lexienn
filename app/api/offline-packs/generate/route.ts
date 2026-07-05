import { NextResponse } from "next/server";
import { getAiConfig, getAiConfigDiagnostic } from "@/lib/ai/config";
import {
  canGenerateOfflinePackWithoutAi,
  generateOfflineLanguagePairPack,
} from "@/lib/offline/offlinePackGenerator";
import { offlinePackGenerateRequestSchema } from "@/lib/offline/offlinePackSchemas";

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

  const parsed = offlinePackGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid offline pack request.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const aiConfigured = getAiConfig().isConfigured;
  const canUseCurated = canGenerateOfflinePackWithoutAi(parsed.data);

  if (!aiConfigured && !canUseCurated) {
    return NextResponse.json(
      {
        error:
          "Offline pack generation unavailable. Enable AI on the server or choose a curated English-to-target pair.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await generateOfflineLanguagePairPack(parsed.data);
    if (!result) {
      const diagnostic = getAiConfigDiagnostic();
      return NextResponse.json(
        {
          error: "Offline pack generation failed to produce a valid pack.",
          ...(diagnostic ? { details: diagnostic } : {}),
        },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Offline pack generation failed." },
      { status: 500 },
    );
  }
}
