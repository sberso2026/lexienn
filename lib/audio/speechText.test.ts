import { describe, expect, it } from "vitest";
import { resolveSpeechText } from "@/lib/audio/speechText";

describe("resolveSpeechText", () => {
  it("uses romanized pronunciation when no voice can read the script", () => {
    const result = resolveSpeechText("नमस्ते", "namaste", {
      languageCode: "hi",
      preferRomanizedWithoutVoice: true,
      hasVoice: false,
    });

    expect(result).toBe("namaste");
  });

  it("keeps native script when a matching voice is available", () => {
    const result = resolveSpeechText("नमस्ते", "namaste", {
      languageCode: "hi",
      preferRomanizedWithoutVoice: true,
      hasVoice: true,
    });

    expect(result).toBe("नमस्ते");
  });
});
