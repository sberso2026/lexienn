"use client";

import { AdminCorrectionsPanel } from "@/components/admin/AdminCorrectionsPanel";
import { DialectManager } from "@/components/admin/DialectManager";
import { LanguageManager } from "@/components/admin/LanguageManager";
import { LowConfidenceList } from "@/components/admin/LowConfidenceList";
import { PhrasePacksAdminPanel } from "@/components/admin/PhrasePacksAdminPanel";
import { DEV_ADMIN_INTRO } from "@/lib/ui/developerLabels";

export function AdminLanguagesView() {
  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--muted)]">
        {DEV_ADMIN_INTRO}
      </p>

      <LanguageManager />
      <DialectManager />
      <PhrasePacksAdminPanel />
      <AdminCorrectionsPanel />
      <LowConfidenceList />
    </div>
  );
}
