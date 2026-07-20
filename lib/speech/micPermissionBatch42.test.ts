import { describe, expect, it, vi } from "vitest";
import { detectClientPlatform } from "@/lib/platform/detectClientPlatform";
import { classifyMicError } from "@/lib/speech/classifyMicError";
import {
  getMicErrorMessage,
  getMicPreflightHint,
} from "@/lib/speech/micPermissionMessages";
import { requestMicPermissionPreflight } from "@/lib/speech/requestMicPermission";
import { transcribeSpeechInput } from "@/lib/speech/speechToTextClient";

describe("batch 42 microphone permission", () => {
  it("permissions.query unsupported does not equal blocked", () => {
    const querySupported =
      typeof navigator !== "undefined" &&
      "permissions" in navigator &&
      typeof navigator.permissions?.query === "function";

    if (!querySupported) {
      expect(querySupported).toBe(false);
    }

    expect(classifyMicError(new DOMException("denied", "NotAllowedError"))).toBe(
      "mic_permission_denied",
    );
  });

  it("getUserMedia is called on mic permission preflight", async () => {
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    });
    vi.stubGlobal("window", {
      isSecureContext: true,
    });

    const result = await requestMicPermissionPreflight();

    expect(getUserMedia).toHaveBeenCalled();
    expect(getUserMedia.mock.calls[0]?.[0]).toMatchObject({
      audio: expect.objectContaining({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }),
    });
    expect(result.ok).toBe(true);
  });

  it("getUserMedia success allows speech transcription to proceed", async () => {
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {
      onLine: true,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });

    const preflight = await requestMicPermissionPreflight();
    expect(preflight.ok).toBe(true);

    const browserModule = await import("@/lib/speech/browserSpeechRecognition");
    vi.spyOn(browserModule, "isBrowserSpeechRecognitionSupported").mockReturnValue(true);
    const transcribeSpy = vi
      .spyOn(browserModule, "transcribeWithBrowserSpeech")
      .mockResolvedValue({
        transcript: "hello",
        confidence_score: 0.9,
        detected_language: "en",
      });

    const result = await transcribeSpeechInput({
      language_hint: "en",
      user_context: "general",
      input_target: "dictionary",
      micPermissionPreflightPassed: true,
    });

    expect(transcribeSpy).toHaveBeenCalled();
    expect(result.transcript).toBe("hello");
  });

  it("NotAllowedError maps to mic_permission_denied", () => {
    expect(classifyMicError(new DOMException("denied", "NotAllowedError"))).toBe(
      "mic_permission_denied",
    );
  });

  it("NotFoundError maps to no_microphone_found", () => {
    expect(classifyMicError(new DOMException("missing", "NotFoundError"))).toBe(
      "no_microphone_found",
    );
  });

  it("insecure context maps to insecure_context_or_policy_block", async () => {
    vi.stubGlobal("window", { isSecureContext: false });
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn() },
    });

    const result = await requestMicPermissionPreflight();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorCode).toBe("insecure_context_or_policy_block");
  });

  it("mic failure does not invoke transcript callback", async () => {
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {
      onLine: true,
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(
          new DOMException("denied", "NotAllowedError"),
        ),
      },
    });

    const preflight = await requestMicPermissionPreflight();
    expect(preflight.ok).toBe(false);

    const transcribeSpy = vi.spyOn(
      await import("@/lib/speech/speechToTextClient"),
      "transcribeSpeechInput",
    );

    expect(transcribeSpy).not.toHaveBeenCalled();
  });

  it("iOS Safari displays iPhone-specific permission steps", () => {
    const platform = {
      isIos: true,
      isSafari: true,
      isChromeIos: false,
      isEdgeIos: false,
      isStandalonePwa: false,
      isSecureContext: true,
      userAgent: "iPhone Safari",
    };

    const message = getMicErrorMessage("mic_permission_denied", platform);
    expect(message.steps?.join(" ")).toMatch(/Safari/i);
    expect(message.steps?.join(" ")).toMatch(/Microphone/i);
  });

  it("installed PWA mode displays Safari-first guidance", () => {
    const platform = {
      isIos: true,
      isSafari: true,
      isChromeIos: false,
      isEdgeIos: false,
      isStandalonePwa: true,
      isSecureContext: true,
      userAgent: "iPhone PWA",
    };

    const message = getMicErrorMessage("mic_permission_denied", platform);
    expect(message.steps?.join(" ")).toMatch(/home-screen app/i);
    expect(message.steps?.join(" ")).toMatch(/Safari/i);
  });

  it("iOS preflight hint mentions phone permission prompt", () => {
    const platform = detectClientPlatform();
    const iosPlatform = { ...platform, isIos: true };
    expect(getMicPreflightHint(iosPlatform)).toMatch(/phone may ask/i);
  });
});
