export const FEEDBACK_CATEGORIES = [
  "send_feedback",
  "report_issue",
  "suggest_language_or_phrase",
  "report_wrong_translation",
  "report_microphone_issue",
  "report_camera_lens_issue",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  send_feedback: "Send feedback",
  report_issue: "Report issue",
  suggest_language_or_phrase: "Suggest language or phrase",
  report_wrong_translation: "Report wrong translation",
  report_microphone_issue: "Report microphone issue",
  report_camera_lens_issue: "Report camera/Lens issue",
};

export type FeedbackSubmission = {
  id: string;
  category: FeedbackCategory;
  description: string;
  contact?: string;
  route: string;
  appVersion: string;
  commitSha: string | null;
  deviceSummary: string;
  standalone: boolean;
  includeDiagnostics: boolean;
  created_at: string;
};

const STORAGE_KEY = "lexienn_feedback_submissions";

function parseList(raw: string | null): FeedbackSubmission[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FeedbackSubmission[]) : [];
  } catch {
    return [];
  }
}

export function loadFeedbackSubmissions(): FeedbackSubmission[] {
  if (typeof window === "undefined") return [];
  return parseList(window.localStorage.getItem(STORAGE_KEY));
}

export function saveFeedbackSubmission(
  input: Omit<FeedbackSubmission, "id" | "created_at">,
): FeedbackSubmission {
  const entry: FeedbackSubmission = {
    ...input,
    id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    const next = [entry, ...loadFeedbackSubmissions()].slice(0, 100);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}
