import { describe, expect, it } from "vitest";
import {
  normalizeLookupCandidates,
  normalizeLookupText,
} from "@/lib/text/normalizeLookupText";

describe("normalizeLookupText", () => {
  it("normalizes punctuation and case", () => {
    expect(normalizeLookupText("  House  ")).toBe("house");
    expect(normalizeLookupText("What's your name?")).toBe("what's your name");
  });

  it("normalizes curly apostrophes", () => {
    expect(normalizeLookupText("What\u2019s your name?")).toBe("what's your name");
  });

  it("produces contraction and apostrophe variants", () => {
    const candidates = normalizeLookupCandidates("What's your name?");
    expect(candidates).toContain("what's your name");
    expect(candidates).toContain("whats your name");
    expect(candidates).toContain("what is your name");
  });
});
