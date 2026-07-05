import { afterEach, describe, expect, it, vi } from "vitest";

import { parseAiDictionaryEntry } from "@/lib/ai/parseAiDictionaryEntry";

import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";

import type { DictionaryQuery } from "@/lib/schemas";



const sampleQuery: DictionaryQuery = {

  input_text: "water",

  source_language: "en",

  target_language: "tl",

  user_context: "general",

  explanation_level: "normal",

  output_mode: "explain_and_translate",

};



describe("dictionary generation", () => {

  afterEach(() => {

    vi.unstubAllEnvs();

  });



  it("returns curated_dictionary source when AI key is not configured", async () => {

    vi.stubEnv("AI_API_KEY", "");

    vi.stubEnv("AI_PROVIDER", "");



    const result = await generateDictionaryEntry(sampleQuery);



    expect(result.source).toBe("curated_dictionary");

    expect(result.entry.input_text).toBe("water");

    expect(result.entry.general_meaning_en.length).toBeGreaterThan(0);

    expect(result.entry.general_meaning_en).not.toMatch(/MVP mock/i);

  });



  it("falls back safely when AI JSON is invalid", async () => {

    expect(parseAiDictionaryEntry("not valid json", sampleQuery)).toBeNull();

    expect(parseAiDictionaryEntry({ foo: "bar" }, sampleQuery)).toBeNull();

    expect(

      parseAiDictionaryEntry(

        JSON.stringify({

          id: "x",

          input_text: "water",

          general_meaning_en: "only partial",

        }),

        sampleQuery,

      ),

    ).toBeNull();

  });

});


