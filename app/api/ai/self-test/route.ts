import { NextResponse } from "next/server";
import {
  isAiSelfTestEnabled,
  logAiSelfTestResult,
  runAiSelfTest,
  validateAiSelfTestToken,
} from "@/lib/ai/aiSelfTest";
import { isServerDeveloperDiagnosticsEnabled } from "@/lib/debug/serverDiagnostics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAiSelfTestEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!validateAiSelfTestToken(token)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runAiSelfTest();
  logAiSelfTestResult(result);

  const payload = {
    ok: result.ok,
    provider: result.provider,
    modelConfigured: result.modelConfigured,
    hasApiKey: result.hasApiKey,
    aiCallSucceeded: result.aiCallSucceeded,
    jsonParsed: result.jsonParsed,
    errorCode: result.errorCode,
    ...(isServerDeveloperDiagnosticsEnabled() && result.rawPreview
      ? { rawPreview: result.rawPreview }
      : {}),
  };

  return NextResponse.json(payload);
}
