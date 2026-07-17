export const QA_CHECKLIST_ITEMS = [
  { id: "install_gate", label: "Install gate" },
  { id: "home_screen_icon", label: "Home-screen icon" },
  { id: "standalone_mode", label: "Standalone mode" },
  { id: "launch_animation", label: "Launch animation" },
  { id: "mic_permission", label: "Mic permission" },
  { id: "voice_input", label: "Voice input" },
  { id: "dictionary_ai", label: "Dictionary AI" },
  { id: "translator", label: "Translator" },
  { id: "lens_fallback", label: "Lens fallback" },
  { id: "offline_packs", label: "Offline packs" },
  { id: "library_save", label: "Library save" },
  { id: "sw_no_api_cache", label: "Service worker no API cache" },
] as const;

export type QaItemId = (typeof QA_CHECKLIST_ITEMS)[number]["id"];
export type QaItemStatus = "untested" | "pass" | "fail";

export type QaChecklistState = {
  updated_at: string;
  items: Record<
    QaItemId,
    {
      status: QaItemStatus;
      notes: string;
    }
  >;
};

const STORAGE_KEY = "lexienn_qa_checklist";

function emptyState(): QaChecklistState {
  const items = {} as QaChecklistState["items"];
  for (const item of QA_CHECKLIST_ITEMS) {
    items[item.id] = { status: "untested", notes: "" };
  }
  return { updated_at: new Date().toISOString(), items };
}

export function loadQaChecklist(): QaChecklistState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as QaChecklistState;
    const base = emptyState();
    for (const item of QA_CHECKLIST_ITEMS) {
      const current = parsed.items?.[item.id];
      if (current) base.items[item.id] = current;
    }
    base.updated_at = parsed.updated_at ?? base.updated_at;
    return base;
  } catch {
    return emptyState();
  }
}

export function saveQaChecklist(state: QaChecklistState): void {
  if (typeof window === "undefined") return;
  const next = { ...state, updated_at: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function exportQaChecklistJson(state: QaChecklistState = loadQaChecklist()): string {
  return JSON.stringify(state, null, 2);
}
