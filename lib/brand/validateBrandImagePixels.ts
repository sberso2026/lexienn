import { isCheckerboardBackground } from "@/lib/brand/isCheckerboardBackground";

export type BrandImageValidation = {
  channels: number;
  hasAlpha: boolean;
  transparentPercent: number;
  opaqueCheckerboardPixels: number;
};

/** Validate install-gate transparent PNG has alpha and no baked checkerboard. */
export async function validateTransparentBrandPng(
  filePath: string,
  loadRaw: (path: string) => Promise<{ data: Uint8Array; channels: number; width: number; height: number }>,
): Promise<BrandImageValidation> {
  const { data, channels, width, height } = await loadRaw(filePath);
  const pixelCount = width * height;
  let transparent = 0;
  let opaqueCheckerboardPixels = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = channels >= 4 ? data[i + 3] : 255;

    if (a < 10) {
      transparent++;
      continue;
    }

    if (isCheckerboardBackground(r, g, b)) {
      opaqueCheckerboardPixels++;
    }
  }

  return {
    channels,
    hasAlpha: channels >= 4,
    transparentPercent: (transparent / pixelCount) * 100,
    opaqueCheckerboardPixels,
  };
}

/** App icons should use Lexienn navy, not checkerboard neutrals. */
export async function validateAppIconPng(
  filePath: string,
  loadRaw: (path: string) => Promise<{ data: Uint8Array; channels: number; width: number; height: number }>,
): Promise<{ opaqueCheckerboardPixels: number; navyishPixels: number }> {
  const { data, channels, width, height } = await loadRaw(filePath);
  const pixelCount = width * height;
  let opaqueCheckerboardPixels = 0;
  let navyishPixels = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = channels >= 4 ? data[i + 3] : 255;

    if (a < 10) continue;

    if (isCheckerboardBackground(r, g, b)) {
      opaqueCheckerboardPixels++;
    }

    if (r <= 30 && g >= 45 && g <= 70 && b >= 90 && b <= 110) {
      navyishPixels++;
    }
  }

  return {
    opaqueCheckerboardPixels,
    navyishPixels: (navyishPixels / pixelCount) * 100,
  };
}
