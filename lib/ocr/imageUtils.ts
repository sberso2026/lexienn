export const OCR_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type OcrAcceptedMimeType = (typeof OCR_ACCEPTED_MIME_TYPES)[number];

export const OCR_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const OCR_MAX_DIMENSION = 1600;

export function normalizeImageMimeType(mimeType: string): OcrAcceptedMimeType | null {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  if (OCR_ACCEPTED_MIME_TYPES.includes(normalized as OcrAcceptedMimeType)) {
    return normalized as OcrAcceptedMimeType;
  }
  return null;
}

export function validateOcrImageFile(file: File): string | null {
  const mime = normalizeImageMimeType(file.type);
  if (!mime) {
    return "Use JPG, PNG, or WEBP images only.";
  }
  if (file.size > OCR_MAX_FILE_BYTES) {
    return "Image is too large. Maximum size is 5 MB.";
  }
  return null;
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: OcrAcceptedMimeType): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      mimeType === "image/png" ? undefined : 0.85,
    );
  });
}

export async function prepareOcrImageFile(file: File): Promise<{
  blob: Blob;
  mimeType: OcrAcceptedMimeType;
  previewUrl: string;
  base64: string;
}> {
  const validationError = validateOcrImageFile(file);
  if (validationError) throw new Error(validationError);

  const mimeType = normalizeImageMimeType(file.type)!;
  if (typeof document === "undefined") {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      blob: file,
      mimeType,
      previewUrl: `data:${mimeType};base64,${base64}`,
      base64,
    };
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(dataUrl);
  const scale = Math.min(1, OCR_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare image for OCR.");

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, mimeType);
  const compressedDataUrl = await readFileAsDataUrl(blob);
  const base64 = compressedDataUrl.split(",")[1] ?? "";

  return {
    blob,
    mimeType,
    previewUrl: compressedDataUrl,
    base64,
  };
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
