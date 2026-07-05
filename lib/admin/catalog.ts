import { dialectSchema } from "@/lib/schemas";
import type { Dialect, ValidationStatus } from "@/lib/schemas";
import { mockDialects } from "@/lib/mock/dialects";
import { getLanguagesSortedAlphabetically } from "@/lib/mock/languageCatalog";
import type { Language } from "@/lib/schemas";
import { loadAdminOverrides } from "@/lib/storage/adminOverridesStorage";
import type { DialectEdit } from "@/lib/storage/adminOverridesSchema";

function applyDialectEdit(dialect: Dialect, edit?: DialectEdit): Dialect {
  if (!edit) return dialect;

  return dialectSchema.parse({
    ...dialect,
    variant_label: edit.variant_label ?? dialect.variant_label,
    region: edit.region ?? dialect.region,
    confidence_level: edit.confidence_level ?? dialect.confidence_level,
    validation_status: edit.validation_status ?? dialect.validation_status,
  });
}

export function mergeDialects(
  seed: Dialect[],
  overrides = loadAdminOverrides(),
): Dialect[] {
  const seedIds = new Set(seed.map((d) => d.id));
  const mergedSeed = seed.map((dialect) =>
    applyDialectEdit(dialect, overrides.dialectEdits[dialect.id]),
  );
  const custom = overrides.customDialects
    .filter((d) => !seedIds.has(d.id))
    .map((dialect) => applyDialectEdit(dialect, overrides.dialectEdits[dialect.id]));

  return [...custom, ...mergedSeed];
}

export function getCatalogLanguages(): Language[] {
  return getLanguagesSortedAlphabetically();
}

export function getCatalogDialects(): Dialect[] {
  if (typeof window === "undefined") return mockDialects;
  return mergeDialects(mockDialects);
}

export function getCatalogDialectById(id: string): Dialect | undefined {
  return getCatalogDialects().find((dialect) => dialect.id === id);
}

export function getCatalogDialectsByLanguageId(languageId: string): Dialect[] {
  return getCatalogDialects().filter((dialect) => dialect.language_id === languageId);
}

export function createCustomDialect(input: {
  language_id: string;
  name: string;
  variant_label: string;
  region?: string;
  confidence_level: number;
  validation_status: ValidationStatus;
}): Dialect {
  return dialectSchema.parse({
    id: `dialect-custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    language_id: input.language_id,
    name: input.name,
    variant_label: input.variant_label,
    region: input.region,
    confidence_level: input.confidence_level,
    validation_status: input.validation_status,
    is_mock_data: false,
  });
}
