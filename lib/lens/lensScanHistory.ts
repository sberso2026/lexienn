import type { LensScanHistoryItem } from "@/lib/lens/lensTypes";

export const LENS_SCAN_HISTORY_KEY = "lexienn_lens_scan_history";
export const LENS_SCAN_HISTORY_UPDATED_EVENT = "lexienn:lens-scan-history-updated";

const MAX_ITEMS = 40;

export function loadLensScanHistory(): LensScanHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LENS_SCAN_HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return (parsed as LensScanHistoryItem[])
      .filter((item) => item?.id && item.originalText)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveLensScanHistoryItem(
  item: Omit<LensScanHistoryItem, "id" | "createdAt">,
): "saved" | "error" {
  if (typeof window === "undefined") return "error";
  try {
    const next: LensScanHistoryItem = {
      ...item,
      id: `lens-${Date.now()}`,
      createdAt: new Date().toISOString(),
      originalText: item.originalText.slice(0, 2000),
      translatedText: item.translatedText.slice(0, 2000),
    };
    const saved = [next, ...loadLensScanHistory()].slice(0, MAX_ITEMS);
    localStorage.setItem(LENS_SCAN_HISTORY_KEY, JSON.stringify(saved));
    window.dispatchEvent(new Event(LENS_SCAN_HISTORY_UPDATED_EVENT));
    return "saved";
  } catch {
    return "error";
  }
}

export function clearLensScanHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LENS_SCAN_HISTORY_KEY);
  window.dispatchEvent(new Event(LENS_SCAN_HISTORY_UPDATED_EVENT));
}
