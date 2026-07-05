import { describe, expect, it } from "vitest";
import {
  AI_DICTIONARY_GUARDRAIL_MARKERS,
  buildAiDictionaryPrompt,
  promptIncludesRequiredGuardrails,
} from "@/lib/dictionary/aiDictionaryPrompt";
import type { DictionaryQuery } from "@/lib/schemas";

const sampleQuery: DictionaryQuery = {
  input_text: "load",
  source_language: "en",
  target_language: "tl",
  target_dialect: "dialect-tl-manila",
  user_context: "engineer",
  explanation_level: "professional",
  output_mode: "explain_and_translate",
};

describe("buildAiDictionaryPrompt", () => {
  it("includes uncertainty and no-invention guardrails", () => {
    const { system, user } = buildAiDictionaryPrompt(sampleQuery);

    expect(promptIncludesRequiredGuardrails(system)).toBe(true);
    expect(system).toContain(AI_DICTIONARY_GUARDRAIL_MARKERS.noInventDialect);
    expect(system).toContain(AI_DICTIONARY_GUARDRAIL_MARKERS.noExactEquivalent);
    expect(user).toContain("no exact direct equivalent");
    expect(user).toContain("Do not invent dialect words");
  });

  it("requires strict JSON output and AiDictionaryResult schema fields", () => {
    const { system } = buildAiDictionaryPrompt(sampleQuery);

    expect(system).toContain("AiDictionaryResult");
    expect(system).toContain("generalMeaning");
    expect(system).toContain("definitionSummary");
    expect(system).toContain("pronunciationText");
    expect(system).toContain("validationStatus");
    expect(system).toContain("ai_generated_unverified");
  });

  it("adds a retry reminder when isRetry is true", () => {
    const { user } = buildAiDictionaryPrompt(sampleQuery, { isRetry: true });
    expect(user).toContain("invalid JSON");
  });
});
