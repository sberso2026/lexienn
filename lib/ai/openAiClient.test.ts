import { afterEach, describe, expect, it, vi } from "vitest";
import { getAiTimeoutMs } from "@/lib/ai/config";
import { requestOpenAiChatCompletion } from "@/lib/ai/openAiClient";

describe("openAiClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reads timeout from env", () => {
    vi.stubEnv("AI_TIMEOUT_MS", "15000");
    expect(getAiTimeoutMs()).toBe(15_000);
  });

  it("returns null when OpenAI fetch times out", async () => {
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_TIMEOUT_MS", "50");

    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );

    const result = await requestOpenAiChatCompletion({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: "hi" }],
    });

    expect(result).toBeNull();
  });
});
