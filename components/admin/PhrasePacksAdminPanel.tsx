"use client";

import Link from "next/link";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCatalogDialectById } from "@/lib/admin/catalog";
import { getLanguageById, mockPhrasePacks } from "@/lib/mock";
import { DEV_LABELS } from "@/lib/ui/developerLabels";

export function PhrasePacksAdminPanel() {
  return (
    <FeatureCard title="Phrase packs">
      <p className="text-sm text-[var(--muted)]">
        Bundled offline phrase packs. Download state is managed on the Phrase
        Packs page.
      </p>
      <ul className="mt-4 space-y-3">
        {mockPhrasePacks.map((pack) => {
          const language = getLanguageById(pack.language_id);
          const dialect = getCatalogDialectById(pack.dialect_id);

          return (
            <li
              key={pack.id}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{pack.name}</p>
                  {pack.description && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {pack.description}
                    </p>
                  )}
                </div>
                <LanguageBadge
                  language={language?.name ?? pack.language_id}
                  dialect={dialect?.variant_label}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge
                  label={`${pack.phrase_count} phrases`}
                  variant="offline"
                />
                <StatusBadge
                  label={`~${pack.estimated_size_kb} KB`}
                  variant="coming-soon"
                />
                {pack.is_mock_data && (
                  <StatusBadge label={DEV_LABELS.seedData} variant="warning" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/phrase-packs" className="font-medium text-[var(--accent)] hover:underline">
          Manage downloads on Phrase Packs
        </Link>
      </p>
    </FeatureCard>
  );
}
