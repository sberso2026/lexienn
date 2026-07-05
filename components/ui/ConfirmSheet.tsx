"use client";

import { IconButton } from "@/components/ui/IconButton";
import { ActionButton } from "@/components/ui/ActionButton";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        className="relative z-10 w-full max-w-lg rounded-t-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[var(--shadow-elevated)] sm:rounded-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="confirm-sheet-title" className="text-sm font-semibold">
            {title}
          </h2>
          <IconButton
            icon={
              <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            label="Close"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          />
        </div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{message}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <ActionButton
            variant={destructive ? "danger" : "primary"}
            fullWidth
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </ActionButton>
          <ActionButton variant="secondary" fullWidth disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
