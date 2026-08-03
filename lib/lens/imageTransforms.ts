/**
 * Client-side OCR image transforms for Lens (rotate / contrast).
 * Audio/images are prepared in-memory only for the OCR request.
 */

import {
  OCR_MAX_DIMENSION,
  type OcrAcceptedMimeType,
} from "@/lib/ocr/imageUtils";

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for transform."));
    image.src = src;
  });
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mimeType: OcrAcceptedMimeType,
): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Could not transform image."));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result ?? "");
          resolve({ dataUrl, base64: dataUrl.split(",")[1] ?? "" });
        };
        reader.onerror = () => reject(new Error("Could not read transformed image."));
        reader.readAsDataURL(blob);
      },
      mimeType,
      mimeType === "image/png" ? undefined : 0.9,
    );
  });
}

export async function rotateOcrImage(
  previewUrl: string,
  mimeType: OcrAcceptedMimeType,
  degrees: 90 | 180 | 270 = 90,
): Promise<{ previewUrl: string; base64: string; mimeType: OcrAcceptedMimeType }> {
  const image = await loadImage(previewUrl);
  const canvas = document.createElement("canvas");
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const width = Math.round(image.width * cos + image.height * sin);
  const height = Math.round(image.width * sin + image.height * cos);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not rotate image.");
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  const out = await canvasToDataUrl(canvas, mimeType);
  return { previewUrl: out.dataUrl, base64: out.base64, mimeType };
}

export async function enhanceOcrContrast(
  previewUrl: string,
  mimeType: OcrAcceptedMimeType,
): Promise<{ previewUrl: string; base64: string; mimeType: OcrAcceptedMimeType }> {
  const image = await loadImage(previewUrl);
  const scale = Math.min(1, OCR_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not enhance image.");
  ctx.filter = "contrast(1.25) brightness(1.05)";
  ctx.drawImage(image, 0, 0, width, height);
  const out = await canvasToDataUrl(canvas, mimeType);
  return { previewUrl: out.dataUrl, base64: out.base64, mimeType };
}
