import { describe, expect, it } from "vitest";
import {
  buildCapturedSpeechPreview,
  chooseBestTranscript,
  mergeFinalTranscriptChunk,
} from "@/lib/voice/transcriptMerge";

describe("transcriptMerge", () => {
  it("accumulates final chunks without duplication", () => {
    let transcript = "";
    transcript = mergeFinalTranscriptChunk(transcript, "My old emails");
    transcript = mergeFinalTranscriptChunk(transcript, "from my Microsoft website.");
    expect(transcript).toBe("My old emails from my Microsoft website.");
  });

  it("does not overwrite earlier speech with a shorter later chunk", () => {
    const previous = "My old emails from my Microsoft website.";
    expect(mergeFinalTranscriptChunk(previous, "website")).toBe(previous);
  });

  it("builds preview from final and interim parts", () => {
    const preview = buildCapturedSpeechPreview("My old emails", "from my Microsoft");
    expect(preview).toContain("My old emails");
    expect(preview).toContain("Microsoft");
  });

  it("prefers longer server transcript on mobile refinement", () => {
    const chosen = chooseBestTranscript(
      "My old emails",
      "My old emails from my Microsoft website.",
    );
    expect(chosen.refinedFromServer).toBe(true);
    expect(chosen.transcript).toBe("My old emails from my Microsoft website.");
  });
});
