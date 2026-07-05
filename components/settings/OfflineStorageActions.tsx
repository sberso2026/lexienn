"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

interface ConfirmActionProps {
  label: string;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "secondary" | "danger";
  onConfirm: () => Promise<void> | void;
}

function ConfirmAction({
  label,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "secondary",
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ActionButton variant={variant} fullWidth disabled={busy} onClick={() => setOpen(true)}>
        {label}
      </ActionButton>
      <ConfirmSheet
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel="Cancel"
        destructive={variant === "danger"}
        busy={busy}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

interface OfflineStorageActionsProps {
  onChanged?: () => void;
}

export function OfflineStorageActions({ onChanged }: OfflineStorageActionsProps) {
  async function run(action: () => Promise<void>) {
    await action();
    onChanged?.();
  }

  return (
    <div className="mt-3 space-y-2">
      <ConfirmAction
        label="Clear downloaded packs"
        title="Clear downloaded packs?"
        message="Removes all language-pair packs and cached phrase audio from this device. You can download them again when online."
        confirmLabel="Clear packs"
        onConfirm={() =>
          run(async () => {
            const { clearDownloadedOfflinePacks } = await import("@/lib/storage/localDataReset");
            await clearDownloadedOfflinePacks();
          })
        }
      />
      <ConfirmAction
        label="Clear recent offline history"
        title="Clear recent offline history?"
        message="Removes recently used phrases and language pairs. Downloaded packs are kept."
        confirmLabel="Clear history"
        onConfirm={() =>
          run(async () => {
            const { clearRecentOfflineHistory } = await import("@/lib/storage/localDataReset");
            await clearRecentOfflineHistory();
          })
        }
      />
      <ConfirmAction
        label="Clear missing requests"
        title="Clear missing requests?"
        message="Removes saved missing phrase searches from this device."
        confirmLabel="Clear requests"
        onConfirm={() =>
          run(async () => {
            const { clearSavedMissingRequests } = await import("@/lib/storage/localDataReset");
            await clearSavedMissingRequests();
          })
        }
      />
      <ConfirmAction
        label="Reset Lexienn local data"
        title="Reset all local Lexienn data?"
        message="Clears downloaded packs, offline history, missing requests, saved words, corrections, and settings stored on this device."
        confirmLabel="Reset local data"
        variant="danger"
        onConfirm={() =>
          run(async () => {
            const { resetLexiennLocalData } = await import("@/lib/storage/localDataReset");
            await resetLexiennLocalData();
          })
        }
      />
    </div>
  );
}
