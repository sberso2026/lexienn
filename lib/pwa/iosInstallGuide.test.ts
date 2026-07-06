import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getIOSInstallGuideMode,
  isLikelyInAppBrowser,
  isSafariIOS,
} from "@/lib/pwa/isStandaloneApp";

function installNavigator(ua: string, platform = "iPhone", maxTouchPoints = 5) {
  vi.stubGlobal("navigator", {
    userAgent: ua,
    platform,
    maxTouchPoints,
    standalone: false,
  });
  vi.stubGlobal("window", {
    navigator: {
      userAgent: ua,
      platform,
      maxTouchPoints,
      standalone: false,
    },
    matchMedia: () => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe("iOS install guide detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects iOS Safari as safari guide mode", () => {
    installNavigator(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    expect(isSafariIOS()).toBe(true);
    expect(getIOSInstallGuideMode()).toBe("safari");
  });

  it("detects in-app browser as open-in-safari", () => {
    installNavigator(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0",
    );
    expect(isLikelyInAppBrowser()).toBe(true);
    expect(getIOSInstallGuideMode()).toBe("open-in-safari");
  });

  it("detects iOS Chrome as open-in-safari", () => {
    installNavigator(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
    );
    expect(isSafariIOS()).toBe(false);
    expect(getIOSInstallGuideMode()).toBe("open-in-safari");
  });
});
