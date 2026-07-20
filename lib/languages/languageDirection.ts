/** Languages that typically render right-to-left. */
const RTL_BASE_CODES = new Set([
  "ar",
  "fa",
  "ur",
  "he",
  "ps",
  "ku",
  "yi",
  "dv",
  "egy",
  "ar-ma",
  "ar-sd",
]);

export function isRtlLanguageCode(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return false;
  if (RTL_BASE_CODES.has(normalized)) return true;
  const base = normalized.split(/[-_:]/)[0] ?? normalized;
  return RTL_BASE_CODES.has(base);
}

export function languageTextDirection(code: string): "rtl" | "ltr" {
  return isRtlLanguageCode(code) ? "rtl" : "ltr";
}
