import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/ai/status/route";
import { getAiPublicStatus } from "@/lib/ai/config";

describe("GET /api/ai/status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns safe public status fields and never exposes the API key", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "super-secret-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("AI_TIMEOUT_MS", "30000");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEVELOPER_MODE", "false");

    const response = await GET();
    const body = await response.json();

    expect(body.aiEnabled).toBe(true);
    expect(body.providerConfigured).toBe(true);
    expect(body.modelConfigured).toBe(true);
    expect(body.hasApiKey).toBe(true);
    expect(body.timeoutMs).toBe(30000);
    expect(body.runtime).toBe("server");
    expect(body.developerMode).toBe(false);
    expect(body.ai_enabled).toBe(true);
    expect(JSON.stringify(body)).not.toContain("super-secret-key");
    expect(body).not.toHaveProperty("api_key");
    expect(body).not.toHaveProperty("AI_API_KEY");
  });

  it("reports incomplete config when model is missing", () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "");

    const status = getAiPublicStatus();
    expect(status.modelConfigured).toBe(false);
    expect(status.providerConfigured).toBe(true);
    expect(status.hasApiKey).toBe(true);
  });
});
