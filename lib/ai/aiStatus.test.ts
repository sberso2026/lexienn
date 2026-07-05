import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/ai/status/route";
import { getAiStatus } from "@/lib/ai/config";

describe("GET /api/ai/status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns status fields and never exposes the API key", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "super-secret-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual(getAiStatus());
    expect(body.ai_enabled).toBe(true);
    expect(body.provider_configured).toBe(true);
    expect(body.model_configured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("super-secret-key");
    expect(body).not.toHaveProperty("api_key");
    expect(body).not.toHaveProperty("AI_API_KEY");
  });

  it("reports incomplete config when model is missing", () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "");

    const status = getAiStatus();
    expect(status.model_configured).toBe(false);
    expect(status.provider_configured).toBe(true);
  });
});
