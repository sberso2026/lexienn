import { afterEach, describe, expect, it, vi } from "vitest";
import * as aiService from "@/lib/ai/aiDictionaryService";
import { mapHttpStatusToOpenAiErrorCode } from "@/lib/ai/aiErrors";
import {
  DEFAULT_OPENAI_API_BASE,
  getOpenAiChatCompletionsUrl,
  normalizeOpenAiApiBaseUrl,
} from "@/lib/ai/openAiEndpoint";
import {
  requestOpenAiChatCompletionDetailed,
  resolveOpenAiChatCompletionsEndpoint,
} from "@/lib/ai/openAiClient";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";

describe("batch 41 OpenAI endpoint and errors", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("final endpoint equals https://api.openai.com/v1/chat/completions by default", () => {
    vi.stubEnv("AI_BASE_URL", "");
    expect(getOpenAiChatCompletionsUrl()).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
  });

  it("AI_BASE_URL with trailing slash still works", () => {
    expect(getOpenAiChatCompletionsUrl("https://api.openai.com/v1/")).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
  });

  it("AI_BASE_URL containing /chat/completions is normalized safely", () => {
    const normalized = normalizeOpenAiApiBaseUrl(
      "https://api.openai.com/v1/chat/completions",
    );
    expect(normalized.baseUrl).toBe(DEFAULT_OPENAI_API_BASE);
    expect(normalized.configWarning).toMatch(/normalized/i);
    expect(getOpenAiChatCompletionsUrl("https://api.openai.com/v1/chat/completions")).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
  });

  it("AI_BASE_URL with /v1 does not double-append version path", () => {
    vi.stubEnv("AI_BASE_URL", "https://api.openai.com/v1");
    const { url } = resolveOpenAiChatCompletionsEndpoint();
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("maps HTTP 404 to provider_model_or_endpoint_not_found", () => {
    expect(mapHttpStatusToOpenAiErrorCode(404)).toBe(
      "provider_model_or_endpoint_not_found",
    );
  });

  it("self-test style call exposes httpStatus safely on provider error", async () => {
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("AI_ENABLED", "true");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "The model `bad-model` does not exist",
            type: "invalid_request_error",
            code: "model_not_found",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await requestOpenAiChatCompletionDetailed({
      model: "bad-model",
      temperature: 0,
      messages: [{ role: "user", content: "hi" }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe("provider_model_or_endpoint_not_found");
    expect(result.httpStatus).toBe(404);
    expect(result.providerErrorType).toBe("invalid_request_error");
    expect(result.endpointPath).toBe("/v1/chat/completions");
    expect(JSON.stringify(result)).not.toMatch(/test-key|Bearer/i);
  });

  it("copious resolves from seed_dictionary with AI disabled", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await generateDictionaryEntry({
      input_text: "copious",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    });

    expect(result.source).toBe("seed_dictionary");
    expect(result.entry.general_meaning_en).toMatch(/abundant/i);
    expect(result.diagnostics.used_ai).toBe(false);
  });

  it("acceleration resolves from seed_dictionary with target=en", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "");

    const result = await generateDictionaryEntry({
      input_text: "acceleration",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    });

    expect(result.source).toBe("seed_dictionary");
    expect(result.entry.general_meaning_en).toMatch(/velocity changes/i);
    expect(result.entry.target_meaning).toBe(result.entry.detailed_meaning_en);
  });

  it("unknown real word calls AI when seed and glossary miss", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");

    const aiSpy = vi
      .spyOn(aiService, "generateDictionaryEntryWithAiDetailed")
      .mockResolvedValue({
        ok: true,
        attempts: 1,
        entry: {
          id: "ai-palimpsest",
          input_text: "palimpsest",
          source_language: "en",
          target_language: "en",
          entry_type: "word",
          general_meaning_en: "A reused writing surface.",
          detailed_meaning_en: "A manuscript written over an earlier erased text.",
          target_meaning: "A manuscript written over an earlier erased text.",
          profession_meanings: [],
          examples: [],
          pronunciation: { simple: "PAL-im-sest" },
          usage_notes: [],
          related_terms: [],
          common_mistakes: [],
          confidence: { score: 0.7, level: "medium" },
          validation_status: "ai_generated_unverified",
          audio_type: "synthetic_tts",
          is_mock_data: false,
        },
      });

    const result = await generateDictionaryEntry({
      input_text: "palimpsest",
      source_language: "en",
      target_language: "en",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain",
    });

    expect(aiSpy).toHaveBeenCalled();
    expect(result.source).toBe("ai_generated");
    expect(result.diagnostics.used_ai).toBe(true);
  });

  it("openai logs do not include API key", async () => {
    vi.stubEnv("AI_API_KEY", "sk-test-secret-key-12345");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    vi.stubEnv("AI_ENABLED", "true");

    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not found", { status: 404 }),
    );

    await requestOpenAiChatCompletionDetailed({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: "hi" }],
    });

    const logged = logSpy.mock.calls
      .filter(([msg]) => String(msg).includes("[openai]"))
      .map(([, details]) => JSON.stringify(details))
      .join(" ");

    expect(logged).not.toContain("sk-test-secret-key");
    expect(logged).not.toContain("Bearer");
  });
});
