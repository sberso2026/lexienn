import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Batch 51D conversation acceptance gates", () => {
  it("adds /conversation without a sixth bottom-nav item", () => {
    expect(existsSync(join(process.cwd(), "app/conversation/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "components/conversation/ConversationView.tsx"))).toBe(
      true,
    );
    const nav = readFileSync(join(process.cwd(), "lib/navigation/navConfig.tsx"), "utf8");
    expect(nav).toContain('href: "/dictionary"');
    expect(nav).toContain('href: "/translator"');
    expect(nav).toContain('href: "/lens"');
    expect(nav).toContain('href: "/library"');
    expect(nav).toContain('href: "/more"');
    expect(nav).not.toContain('href: "/conversation"');
    expect(nav).toContain('"/conversation": "Conversation"');
  });

  it("links Conversation from Translate and keeps Open Lens", () => {
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TranslatorView.tsx"),
      "utf8",
    );
    expect(translator).toContain('href="/conversation"');
    expect(translator).toContain("Open Conversation");
    expect(translator).toContain('href="/lens"');
    expect(translator).toContain("Open Lens");
    expect(translator).not.toContain("CameraTranslatorView");
  });

  it("Conversation UI includes required controls and Big Screen", () => {
    const view = readFileSync(
      join(process.cwd(), "components/conversation/ConversationView.tsx"),
      "utf8",
    );
    const big = readFileSync(
      join(process.cwd(), "components/conversation/ConversationBigScreen.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      join(process.cwd(), "components/conversation/ConversationSpeakerPanel.tsx"),
      "utf8",
    );

    expect(view).toContain("Person A");
    expect(view).toContain("Person B");
    expect(view).toContain("Transcript history");
    expect(view).toContain("Save conversation");
    expect(view).toContain("Big Screen");
    expect(view).toContain("Pause");
    expect(view).toContain("Clear");
    expect(view).toContain("Reverse languages");
    expect(view).toContain("Automatic turn detection stays off");
    expect(view).toContain("not auto-saved");
    expect(view).toContain("handleDetection");
    expect(view).toContain("voicePlaybackLanguageForTurn");
    expect(view).toContain('play("slow")');
    expect(big).toContain("text-4xl");
    expect(big).toContain("Replay");
    expect(big).toContain("Slow");
    expect(panel).toContain("!min-h-16");
    expect(panel).toContain("Active speaker");
    expect(panel).toContain("VoiceInputTextArea");
  });

  it("graceful voice unavailable messaging exists", () => {
    const view = readFileSync(
      join(process.cwd(), "components/conversation/ConversationView.tsx"),
      "utf8",
    );
    expect(view).toContain("Voice unavailable for this language or browser.");
    expect(view).toContain("audio_unavailable");
  });
});
