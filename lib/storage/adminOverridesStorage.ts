import { dialectSchema } from "@/lib/schemas";
import type { Dialect } from "@/lib/schemas";
import { ADMIN_OVERRIDES_STORAGE_KEY } from "./constants";
import {
  adminOverridesSchema,
  EMPTY_ADMIN_OVERRIDES,
  type AdminOverrides,
  type DialectEdit,
} from "./adminOverridesSchema";

function parseOverrides(raw: string | null): AdminOverrides {
  if (!raw) return { ...EMPTY_ADMIN_OVERRIDES };

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = adminOverridesSchema.safeParse(parsed);
    if (!result.success) return { ...EMPTY_ADMIN_OVERRIDES };

    const customDialects = result.data.customDialects
      .map((item) => dialectSchema.safeParse(item))
      .filter((item) => item.success)
      .map((item) => item.data);

    return {
      customDialects,
      dialectEdits: result.data.dialectEdits,
    };
  } catch {
    return { ...EMPTY_ADMIN_OVERRIDES };
  }
}

function persistOverrides(overrides: AdminOverrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

export function loadAdminOverrides(): AdminOverrides {
  if (typeof window === "undefined") return { ...EMPTY_ADMIN_OVERRIDES };
  return parseOverrides(localStorage.getItem(ADMIN_OVERRIDES_STORAGE_KEY));
}

export function saveAdminOverrides(overrides: AdminOverrides): void {
  persistOverrides(overrides);
}

export function addCustomDialect(dialect: Dialect): void {
  const overrides = loadAdminOverrides();
  persistOverrides({
    ...overrides,
    customDialects: [dialect, ...overrides.customDialects],
  });
}

export function updateDialectOverride(
  dialectId: string,
  edit: DialectEdit,
): void {
  const overrides = loadAdminOverrides();
  const existing = overrides.dialectEdits[dialectId] ?? {};

  persistOverrides({
    ...overrides,
    dialectEdits: {
      ...overrides.dialectEdits,
      [dialectId]: { ...existing, ...edit },
    },
  });
}

export function deleteCustomDialect(dialectId: string): boolean {
  const overrides = loadAdminOverrides();
  const nextCustom = overrides.customDialects.filter((d) => d.id !== dialectId);

  if (nextCustom.length === overrides.customDialects.length) {
    return false;
  }

  const restEdits = { ...overrides.dialectEdits };
  delete restEdits[dialectId];
  persistOverrides({
    customDialects: nextCustom,
    dialectEdits: restEdits,
  });
  return true;
}

export function resetDialectOverride(dialectId: string): void {
  const overrides = loadAdminOverrides();
  const restEdits = { ...overrides.dialectEdits };
  delete restEdits[dialectId];

  persistOverrides({
    ...overrides,
    dialectEdits: restEdits,
  });
}

export function isCustomDialect(dialectId: string): boolean {
  return loadAdminOverrides().customDialects.some((d) => d.id === dialectId);
}
