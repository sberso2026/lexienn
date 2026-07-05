"use client";

import { useEffect, useState } from "react";
import { getCatalogDialectById, getCatalogDialectsByLanguageId } from "@/lib/admin/catalog";
import { getDialectById, getDialectsByLanguageId } from "@/lib/mock/dialects";
import type { Dialect } from "@/lib/schemas";

/**
 * Dialect list safe for SSR hydration: seed data on server and first client paint,
 * then merged catalog (localStorage admin overrides) after mount.
 */
export function useCatalogDialectsByLanguageId(
  languageId: string | undefined,
): Dialect[] {
  const [dialects, setDialects] = useState<Dialect[]>(() =>
    languageId ? getDialectsByLanguageId(languageId) : [],
  );

  useEffect(() => {
    if (!languageId) {
      setDialects([]);
      return;
    }
    setDialects(getCatalogDialectsByLanguageId(languageId));
  }, [languageId]);

  return dialects;
}

/**
 * Single dialect lookup with the same hydration-safe pattern.
 */
export function useCatalogDialectById(
  dialectId: string | undefined,
): Dialect | undefined {
  const [dialect, setDialect] = useState<Dialect | undefined>(() =>
    dialectId ? getDialectById(dialectId) : undefined,
  );

  useEffect(() => {
    if (!dialectId) {
      setDialect(undefined);
      return;
    }
    setDialect(getCatalogDialectById(dialectId));
  }, [dialectId]);

  return dialect;
}
