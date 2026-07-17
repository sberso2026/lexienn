"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { formatReleaseLabel, getReleaseMetadata } from "@/lib/app/releaseMetadata";
import {
  exportQaChecklistJson,
  loadQaChecklist,
  QA_CHECKLIST_ITEMS,
  saveQaChecklist,
  type QaChecklistState,
  type QaItemId,
  type QaItemStatus,
} from "@/lib/qa/qaChecklistStorage";

export function QaChecklistView() {
  const release = useMemo(() => getReleaseMetadata(), []);
  const [state, setState] = useState<QaChecklistState>(() => loadQaChecklist());
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  function updateItem(id: QaItemId, patch: Partial<QaChecklistState["items"][QaItemId]>) {
    setState((previous) => {
      const next: QaChecklistState = {
        ...previous,
        items: {
          ...previous.items,
          [id]: { ...previous.items[id], ...patch },
        },
      };
      saveQaChecklist(next);
      return next;
    });
  }

  async function handleExport() {
    const json = exportQaChecklistJson(state);
    try {
      await navigator.clipboard.writeText(json);
      setExportMessage("Checklist JSON copied to clipboard.");
    } catch {
      setExportMessage(json);
    }
  }

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Developer QA
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">QA checklist</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Mark real-device checks and export notes. Release: {formatReleaseLabel(release)}.
        </p>
      </section>

      <CompactCard className="enterprise-card space-y-4">
        {QA_CHECKLIST_ITEMS.map((item) => {
          const current = state.items[item.id];
          return (
            <div key={item.id} className="border-b border-[var(--border-subtle)] pb-3 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{item.label}</p>
                <select
                  aria-label={`${item.label} status`}
                  value={current.status}
                  onChange={(event) =>
                    updateItem(item.id, { status: event.target.value as QaItemStatus })
                  }
                  className="min-h-11 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 text-sm"
                >
                  <option value="untested">Untested</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
              <label className="mt-2 block text-xs text-[var(--muted)]" htmlFor={`qa-note-${item.id}`}>
                Notes
              </label>
              <textarea
                id={`qa-note-${item.id}`}
                value={current.notes}
                onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm"
              />
            </div>
          );
        })}
        <ActionButton type="button" fullWidth onClick={() => void handleExport()}>
          Export checklist JSON
        </ActionButton>
        {exportMessage && (
          <pre className="overflow-x-auto rounded-lg bg-[var(--background)] p-3 text-[10px] leading-4">
            {exportMessage}
          </pre>
        )}
      </CompactCard>
    </div>
  );
}
