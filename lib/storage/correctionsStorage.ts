import { CORRECTIONS_STORAGE_KEY } from "./constants";
import type { CorrectionSubmission } from "@/lib/schemas";
import { correctionSubmissionSchema } from "@/lib/schemas";

function parseCorrections(raw: string | null): CorrectionSubmission[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => correctionSubmissionSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
}

function persistCorrections(corrections: CorrectionSubmission[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(corrections));
}

export function loadCorrections(): CorrectionSubmission[] {
  if (typeof window === "undefined") return [];
  return parseCorrections(localStorage.getItem(CORRECTIONS_STORAGE_KEY));
}

export function saveCorrection(correction: CorrectionSubmission): void {
  const corrections = loadCorrections();
  persistCorrections([correction, ...corrections]);
}

export function deleteCorrection(id: string): boolean {
  const corrections = loadCorrections();
  const next = corrections.filter((item) => item.id !== id);

  if (next.length === corrections.length) return false;

  persistCorrections(next);
  return true;
}

export function advanceCorrectionSync(id: string): CorrectionSubmission | null {
  const corrections = loadCorrections();
  const index = corrections.findIndex((item) => item.id === id);

  if (index < 0) return null;

  const current = corrections[index];
  let nextStatus = current.status;

  if (current.status === "pending_sync") {
    nextStatus = "ready_for_review";
  } else if (current.status === "ready_for_review") {
    nextStatus = "simulated_synced";
  }

  if (nextStatus === current.status) {
    return current;
  }

  const updated: CorrectionSubmission = { ...current, status: nextStatus };
  const next = [...corrections];
  next[index] = updated;
  persistCorrections(next);
  return updated;
}

export function syncAllPendingCorrections(): number {
  const corrections = loadCorrections();
  let count = 0;

  const next = corrections.map((item) => {
    if (item.status !== "pending_sync") return item;
    count += 1;
    return { ...item, status: "ready_for_review" as const };
  });

  if (count > 0) {
    persistCorrections(next);
  }

  return count;
}
