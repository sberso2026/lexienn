import type { OcrBlock } from "@/lib/ocr/ocrSchemas";

/**
 * Reconstruct reading-order text from OCR blocks.
 * Preserves paragraph separation; keeps numbers/units/dates as returned.
 */
export function reconstructTextFromBlocks(blocks: OcrBlock[] | undefined | null): string {
  if (!blocks || blocks.length === 0) return "";
  const ordered = [...blocks].sort((a, b) => {
    const left = a.reading_order ?? Number.MAX_SAFE_INTEGER;
    const right = b.reading_order ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
  return ordered
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function mergeOcrTextWithBlocks(
  extractedText: string,
  blocks: OcrBlock[] | undefined | null,
): string {
  const fromBlocks = reconstructTextFromBlocks(blocks);
  if (fromBlocks.trim().length >= extractedText.trim().length) return fromBlocks;
  return extractedText;
}

/** Split OCR text into tappable word tokens while preserving numbers/units. */
export function tokenizeOcrWords(text: string): string[] {
  return text
    .split(/(\s+)/)
    .filter((part) => part.length > 0);
}

export function isTappableOcrToken(token: string): boolean {
  const cleaned = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!cleaned) return false;
  if (/^\d+([.,]\d+)?(%|mg|kg|ml|km|cm|mm|°[CF]?)?$/i.test(cleaned)) return false;
  return /[\p{L}]{2,}/u.test(cleaned);
}

export function normalizeTappedWord(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
}
