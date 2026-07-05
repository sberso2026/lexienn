"use client";

import { useCallback, useEffect, useState } from "react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCatalogLanguages } from "@/lib/admin/catalog";
import { DEV_LANGUAGE_SEED_NOTE, DEV_LABELS } from "@/lib/ui/developerLabels";
import type { Language } from "@/lib/schemas";

export function LanguageManager() {
  const [languages, setLanguages] = useState<Language[]>([]);

  const refresh = useCallback(() => {
    setLanguages(getCatalogLanguages());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeCount = languages.filter((lang) => lang.is_active).length;

  return (
    <FeatureCard title="Languages">
      <p className="text-xs text-[var(--muted)]">{DEV_LANGUAGE_SEED_NOTE}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge label={`${languages.length} languages`} variant="offline" />
        <StatusBadge label={`${activeCount} active`} variant="beta" />
      </div>
      <ul className="mt-4 space-y-2">
        {languages.map((language) => (
          <li
            key={language.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5"
          >
            <div>
              <p className="font-medium">{language.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {language.native_name} · code: {language.code}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {language.is_active ? (
                <StatusBadge label="Active" variant="offline" />
              ) : (
                <StatusBadge label="Inactive" variant="coming-soon" />
              )}
              {language.is_mock_data && (
                <StatusBadge label={DEV_LABELS.seedData} variant="warning" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </FeatureCard>
  );
}
