export type LensMode = "live_scan" | "capture" | "import" | "history";

export const LENS_MODES: Array<{
  id: LensMode;
  label: string;
  hint: string;
}> = [
  { id: "live_scan", label: "Live Scan", hint: "Camera scanner" },
  { id: "capture", label: "Capture", hint: "Take a photo" },
  { id: "import", label: "Import Image", hint: "From gallery" },
  { id: "history", label: "Scan History", hint: "Recent scans" },
];

export type LensDocumentActionId =
  | "translate_all"
  | "explain_simply"
  | "define_difficult"
  | "summarize"
  | "extract_actions"
  | "extract_dates"
  | "extract_warnings"
  | "preserve_original";

export const LENS_DOCUMENT_ACTIONS: Array<{
  id: LensDocumentActionId;
  label: string;
}> = [
  { id: "translate_all", label: "Translate all" },
  { id: "explain_simply", label: "Explain simply" },
  { id: "define_difficult", label: "Define difficult words" },
  { id: "summarize", label: "Summarize" },
  { id: "extract_actions", label: "Extract actions" },
  { id: "extract_dates", label: "Extract dates" },
  { id: "extract_warnings", label: "Extract warnings" },
  { id: "preserve_original", label: "Preserve original text" },
];

export const LENS_SAFETY_DISCLAIMER =
  "AI explanations are not certified medical or safety advice. Always follow official guidance.";

export type LensScanHistoryItem = {
  id: string;
  createdAt: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  objectType?: string | null;
  userContext?: string;
};
