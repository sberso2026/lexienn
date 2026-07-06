import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  InstallStep,
  MobileInstallGate,
  resolveInstallGateUiState,
} from "@/components/pwa/MobileInstallGate";

function installWindow({
  ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  platform = "iPhone",
  maxTouchPoints = 5,
}: {
  ua?: string;
  platform?: string;
  maxTouchPoints?: number;
} = {}) {
  const nav = { userAgent: ua, platform, maxTouchPoints, standalone: false };
  vi.stubGlobal("navigator", nav);
  vi.stubGlobal("window", {
    navigator: nav,
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

describe("MobileInstallGate hydration safety", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolveInstallGateUiState is safe when window is unavailable", () => {
    vi.stubGlobal("window", undefined);
    expect(resolveInstallGateUiState(null)).toEqual({
      clientReady: false,
      iosGuideMode: null,
      showAndroidMenuGuide: false,
      showAndroidInstallButton: false,
    });
  });

  it("resolveInstallGateUiState detects iOS Safari install guide", () => {
    installWindow();
    const ui = resolveInstallGateUiState(null);
    expect(ui.clientReady).toBe(true);
    expect(ui.iosGuideMode).toBe("safari");
    expect(ui.showAndroidMenuGuide).toBe(false);
    expect(ui.showAndroidInstallButton).toBe(false);
  });

  it("MobileInstallGate renders initial shell without throwing when window is unavailable", () => {
    vi.stubGlobal("React", React);
    vi.stubGlobal("window", undefined);
    expect(() => renderToString(createElement(MobileInstallGate))).not.toThrow();
    const html = renderToString(createElement(MobileInstallGate));
    expect(html).toContain("Install Lexienn");
    expect(html).toContain("Preparing install instructions");
  });

  it("InstallStep renders step number, sr-only label, and content", () => {
    vi.stubGlobal("React", React);
    const html = renderToString(
      createElement(
        "ol",
        null,
        createElement(InstallStep, { number: 1 }, "Tap share"),
      ),
    );
    expect(html).toContain('class="step-number"');
    expect(html).toContain('aria-hidden="true">1');
    expect(html).toContain('class="step-content"');
    expect(html).toContain("Step 1:");
    expect(html).toContain("Tap share");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("service worker install hotfix", () => {
  const sw = readFileSync("public/sw.js", "utf8");

  it("uses lexienn-shell-v4-installfix cache name", () => {
    expect(sw).toContain('const CACHE_NAME = "lexienn-shell-v4-installfix"');
  });

  it("does not retain v3-brand2 as active shell cache", () => {
    expect(sw).not.toContain("lexienn-shell-v3-brand2");
  });

  it("deletes old caches during activate", () => {
    expect(sw).toContain("key !== CACHE_NAME");
    expect(sw).toContain("caches.delete(key)");
  });

  it("does not cache HTML shell routes or Next.js chunks", () => {
    expect(sw).not.toMatch(/["']\/["']/);
    expect(sw).not.toContain('"/translator"');
    expect(sw).not.toContain('"/offline"');
    expect(sw).toContain('url.pathname.startsWith("/_next/")');
    expect(sw).toContain("return;");
  });

  it("does not intercept navigation requests", () => {
    expect(sw).toContain('request.mode === "navigate"');
  });
});
