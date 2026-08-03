export type ImageQualityWarning = {
  code: "blur" | "glare" | "low_contrast" | "ok";
  message: string;
  guidance: string;
};

/**
 * Lightweight client-side image quality heuristics for OCR guidance.
 * Not a certified vision model — used only for retry hints.
 */
export async function assessOcrImageQuality(
  dataUrlOrBase64: string,
  mimeType = "image/jpeg",
): Promise<ImageQualityWarning[]> {
  if (typeof document === "undefined") return [];

  const src = dataUrlOrBase64.startsWith("data:")
    ? dataUrlOrBase64
    : `data:${mimeType};base64,${dataUrlOrBase64}`;

  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const width = Math.min(320, image.width);
  const height = Math.max(1, Math.round((image.height / image.width) * width));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let sum = 0;
  let sumSq = 0;
  let bright = 0;
  let edge = 0;
  const gray = new Float32Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const g = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    gray[p] = g;
    sum += g;
    sumSq += g * g;
    if (g > 245) bright += 1;
  }

  const n = gray.length || 1;
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  const glareRatio = bright / n;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      const dx = gray[idx + 1]! - gray[idx - 1]!;
      const dy = gray[idx + width]! - gray[idx - width]!;
      edge += Math.abs(dx) + Math.abs(dy);
    }
  }
  const edgeScore = edge / n;

  const warnings: ImageQualityWarning[] = [];
  if (edgeScore < 18) {
    warnings.push({
      code: "blur",
      message: "Image may be blurry.",
      guidance: "Hold steady, move closer, and retry capture.",
    });
  }
  if (glareRatio > 0.18) {
    warnings.push({
      code: "glare",
      message: "Glare detected.",
      guidance: "Tilt the camera to reduce reflections, then retry.",
    });
  }
  if (variance < 350) {
    warnings.push({
      code: "low_contrast",
      message: "Low contrast.",
      guidance: "Improve lighting or use Enhance before extracting.",
    });
  }
  if (warnings.length === 0) {
    warnings.push({
      code: "ok",
      message: "Image looks usable for OCR.",
      guidance: "",
    });
  }
  return warnings;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not assess image quality."));
    image.src = src;
  });
}
