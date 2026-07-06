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

  return NextResponse.json({
    ok: result.ok,
    provider: result.provider,
    model: result.model,
    modelConfigured: result.modelConfigured,
    hasApiKey: result.hasApiKey,
    baseUrlConfigured: result.baseUrlConfigured,
    endpointStyle: result.endpointStyle,
    finalEndpoint: result.finalEndpoint,
    aiCallSucceeded: result.aiCallSucceeded,
    jsonParsed: result.jsonParsed,
    errorCode: result.errorCode,
    httpStatus: result.httpStatus ?? null,
    providerErrorType: result.providerErrorType ?? null,
    providerErrorCode: result.providerErrorCode ?? null,
    safeMessage: result.safeMessage ?? null,
    ...(result.configWarning ? { configWarning: result.configWarning } : {}),
    ...(isServerDeveloperDiagnosticsEnabled() && result.rawPreview
      ? { rawPreview: result.rawPreview }
      : {}),
  });
}
