import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  BRAND_ASSET_PATHS,
  brandAssetUrl,
  INSTALL_GATE_LOGO_PATH,
} from "@/lib/brand/brandAssetPaths";
import { BRAND_ASSET_VERSION } from "@/lib/brand/brandAssetVersion";
import { isCheckerboardBackground } from "@/lib/brand/isCheckerboardBackground";
import {
  validateAppIconPng,
  validateTransparentBrandPng,
} from "@/lib/brand/validateBrandImagePixels";

async function loadRaw(path: string) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  return {
    data,
    channels: info.channels,
    width: info.width,
    height: info.height,
  };
}

describe("brand assets", () => {
  it("defines expected public brand paths", () => {
    expect(INSTALL_GATE_LOGO_PATH).toBe("/brand/lexienn-logo-transparent.png");
    expect(BRAND_ASSET_PATHS.icon).toBe("/brand/lexienn-logo-icon.png");
  });

  it("brandAssetUrl centralizes cache busting", () => {
    expect(brandAssetUrl(INSTALL_GATE_LOGO_PATH)).toBe(
      `/brand/lexienn-logo-transparent.png?v=${BRAND_ASSET_VERSION}`,
    );
  });

  it("brand PNG files exist on disk", () => {
    for (const rel of Object.values(BRAND_ASSET_PATHS)) {
      expect(existsSync(`public${rel}`)).toBe(true);
    }
  });

  it("install gate transparent PNG is RGBA without checkerboard pixels", async () => {
    const result = await validateTransparentBrandPng(
      "public/brand/lexienn-logo-transparent.png",
      loadRaw,
    );
    expect(result.hasAlpha).toBe(true);
    expect(result.channels).toBeGreaterThanOrEqual(4);
    expect(result.transparentPercent).toBeGreaterThan(50);
    expect(result.opaqueCheckerboardPixels).toBe(0);
  });

  it("PWA favicon and apple-touch-icon exist without checkerboard background", async () => {
    for (const file of ["public/favicon.png", "public/apple-touch-icon.png"]) {
      expect(existsSync(file)).toBe(true);
      const { data, channels, width, height } = await loadRaw(file);
      const pixelCount = width * height;
      const result = await validateAppIconPng(file, loadRaw);
      const maxCheckerboardPixels = Math.max(20, Math.floor(pixelCount * 0.02));
      expect(result.opaqueCheckerboardPixels).toBeLessThanOrEqual(maxCheckerboardPixels);
      expect(result.navyishPixels).toBeGreaterThan(20);
      void data;
      void channels;
    }
  });

  it("maskable and manifest icons exist after generation", () => {
    for (const file of [
      "public/icons/icon-192x192.png",
      "public/icons/icon-512x512.png",
      "public/icons/maskable-icon-192x192.png",
      "public/icons/maskable-icon-512x512.png",
    ]) {
      expect(existsSync(file)).toBe(true);
    }
  });

  it("generate:icons runs brand processing first", () => {
    const pkg = readFileSync("package.json", "utf8");
    expect(pkg).toContain('"process:brand"');
    expect(pkg).toMatch(/generate:icons.*process-brand-logo/);
  });

  it("MobileInstallGate uses LexiennBrandLogo install size", () => {
    const gate = readFileSync("components/pwa/MobileInstallGate.tsx", "utf8");
    expect(gate).toContain("LexiennBrandLogo");
    expect(gate).toContain('size="install"');
  });

  it("LexiennBrandLogo uses versioned transparent asset for install", () => {
    const logo = readFileSync("components/brand/LexiennBrandLogo.tsx", "utf8");
    expect(logo).toContain("brandAssetUrl");
    expect(logo).toContain("INSTALL_GATE_LOGO_PATH");
    expect(logo).toContain("bg-transparent");
  });

  it("layout metadata version-busts favicon and apple-touch-icon", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("withBrandAssetVersion");
    expect(layout).toContain("apple-touch-icon");
  });

  it("treats checkerboard grays as background pixels", () => {
    expect(isCheckerboardBackground(255, 255, 255)).toBe(true);
    expect(isCheckerboardBackground(253, 253, 253)).toBe(true);
    expect(isCheckerboardBackground(0, 112, 255)).toBe(false);
    expect(isCheckerboardBackground(208, 0, 0)).toBe(false);
  });
});
