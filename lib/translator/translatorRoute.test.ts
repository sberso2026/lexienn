import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/translator/translate/route";
import { translatorResponseSchema } from "@/lib/translator/translatorSchemas";

function postTranslate(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/translator/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("translator translate route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns parseable JSON for unsupported language without AI", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const response = await postTranslate({
      input_text: "Hello world",
      source_language: "en",
      target_language: "pl",
      ai_translation_enabled: false,
      rule_fallback_enabled: false,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(translatorResponseSchema.safeParse(payload).success).toBe(true);
    expect(payload.source).toBe("unavailable");
  });

  it("returns structured JSON for invalid requests", async () => {
    const response = await postTranslate({});
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBeTruthy();
  });
});
