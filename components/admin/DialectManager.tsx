"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConfidenceEditor,
  type ConfidenceEditorValues,
} from "@/components/admin/ConfidenceEditor";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
import {
  createCustomDialect,
  getCatalogDialects,
  getCatalogLanguages,
} from "@/lib/admin/catalog";
import { DEV_LABELS } from "@/lib/ui/developerLabels";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import { validationStatusSchema } from "@/lib/schemas";
import {
  addCustomDialect,
  deleteCustomDialect,
  isCustomDialect,
  loadAdminOverrides,
  resetDialectOverride,
  updateDialectOverride,
} from "@/lib/storage/adminOverridesStorage";
import type { AdminOverrides } from "@/lib/storage/adminOverridesSchema";
import type { Dialect } from "@/lib/schemas";

function fieldClassName() {
  return "mt-1 w-full min-h-11 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-base";
}

export function DialectManager() {
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [overrides, setOverrides] = useState<AdminOverrides>({
    customDialects: [],
    dialectEdits: {},
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    language_id: "lang-tl",
    name: "",
    variant_label: "",
    region: "",
    confidence_level: 0.5,
    validation_status: "uncertain" as Dialect["validation_status"],
  });

  const languages = useMemo(() => getCatalogLanguages(), []);

  const refresh = useCallback(() => {
    setDialects(getCatalogDialects());
    setOverrides(loadAdminOverrides());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const customCount = overrides.customDialects.length;
  const editedCount = Object.keys(overrides.dialectEdits).length;

  function handleSaveEdit(dialectId: string, values: ConfidenceEditorValues) {
    updateDialectOverride(dialectId, values);
    setEditingId(null);
    refresh();
    setMessage("Dialect updated locally.");
  }

  function handleAddDialect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!addForm.name.trim() || !addForm.variant_label.trim()) {
      setMessage("Name and variant label are required.");
      return;
    }

    const dialect = createCustomDialect({
      language_id: addForm.language_id,
      name: addForm.name.trim(),
      variant_label: addForm.variant_label.trim(),
      region: addForm.region.trim() || undefined,
      confidence_level: addForm.confidence_level,
      validation_status: addForm.validation_status,
    });

    addCustomDialect(dialect);
    setShowAddForm(false);
    setAddForm({
      language_id: "lang-tl",
      name: "",
      variant_label: "",
      region: "",
      confidence_level: 0.5,
      validation_status: "uncertain",
    });
    refresh();
    setMessage(`Added custom dialect: ${dialect.variant_label}`);
  }

  function handleDelete(dialectId: string) {
    if (!isCustomDialect(dialectId)) return;
    if (deleteCustomDialect(dialectId)) {
      refresh();
      setMessage("Custom dialect removed.");
    }
  }

  function handleReset(dialectId: string) {
    resetDialectOverride(dialectId);
    refresh();
    setMessage("Reverted local edits for this dialect.");
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Dialect[]>();
    for (const dialect of dialects) {
      const list = map.get(dialect.language_id) ?? [];
      list.push(dialect);
      map.set(dialect.language_id, list);
    }
    return map;
  }, [dialects]);

  return (
    <FeatureCard title="Dialects">
      <p className="text-sm text-[var(--muted)]">
        View seed dialects, add custom variant labels, and edit confidence or
        validation status locally.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge label={`${dialects.length} dialects`} variant="offline" />
        <StatusBadge
          label={`${customCount} custom`}
          variant={customCount > 0 ? "beta" : "coming-soon"}
        />
        <StatusBadge
          label={`${editedCount} edited`}
          variant={editedCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAddForm((value) => !value)}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          {showAddForm ? "Hide add dialect form" : "Add custom dialect"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddDialect}
          className="mt-4 space-y-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3"
        >
          <div>
            <label htmlFor="add-dialect-language" className="block text-sm font-medium">
              Language
            </label>
            <select
              id="add-dialect-language"
              value={addForm.language_id}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, language_id: e.target.value }))
              }
              className={fieldClassName()}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add-dialect-name" className="block text-sm font-medium">
              Dialect name
            </label>
            <input
              id="add-dialect-name"
              value={addForm.name}
              onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Tagalog"
              className={fieldClassName()}
            />
          </div>
          <div>
            <label htmlFor="add-dialect-variant" className="block text-sm font-medium">
              Variant label <span className="text-red-600">*</span>
            </label>
            <input
              id="add-dialect-variant"
              value={addForm.variant_label}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, variant_label: e.target.value }))
              }
              placeholder="e.g. Batangas variant"
              className={fieldClassName()}
            />
          </div>
          <div>
            <label htmlFor="add-dialect-region" className="block text-sm font-medium">
              Region
            </label>
            <input
              id="add-dialect-region"
              value={addForm.region}
              onChange={(e) => setAddForm((prev) => ({ ...prev, region: e.target.value }))}
              className={fieldClassName()}
            />
          </div>
          <div>
            <label htmlFor="add-dialect-confidence" className="block text-sm font-medium">
              Initial confidence ({Math.round(addForm.confidence_level * 100)}%)
            </label>
            <input
              id="add-dialect-confidence"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={addForm.confidence_level}
              onChange={(e) =>
                setAddForm((prev) => ({
                  ...prev,
                  confidence_level: Number(e.target.value),
                }))
              }
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="add-dialect-status" className="block text-sm font-medium">
              Data status
            </label>
            <select
              id="add-dialect-status"
              value={addForm.validation_status}
              onChange={(e) =>
                setAddForm((prev) => ({
                  ...prev,
                  validation_status: e.target.value as Dialect["validation_status"],
                }))
              }
              className={fieldClassName()}
            >
              {validationStatusSchema.options.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Save custom dialect
          </button>
        </form>
      )}

      {message && (
        <p className="mt-3 text-sm text-[var(--muted)]" role="status">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {languages.map((language) => {
          const languageDialects = grouped.get(language.id) ?? [];
          if (languageDialects.length === 0) return null;

          return (
            <section key={language.id}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                {language.name}
              </h3>
              <ul className="mt-2 space-y-3">
                {languageDialects.map((dialect) => {
                  const isCustom = isCustomDialect(dialect.id);
                  const hasLocalEdit = Boolean(overrides.dialectEdits[dialect.id]);

                  return (
                    <li
                      key={dialect.id}
                      className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{dialect.variant_label}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {dialect.name}
                            {dialect.region ? ` · ${dialect.region}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ConfidenceBadge score={dialect.confidence_level} />
                          <ValidationStatusBadge status={dialect.validation_status} />
                          {dialect.is_mock_data && (
                            <StatusBadge label={DEV_LABELS.seedData} variant="warning" />
                          )}
                          {isCustom && (
                            <StatusBadge label="Custom" variant="beta" />
                          )}
                          {hasLocalEdit && (
                            <StatusBadge label="Locally edited" variant="offline" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingId((current) =>
                              current === dialect.id ? null : dialect.id,
                            )
                          }
                          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card)]"
                        >
                          {editingId === dialect.id ? "Close editor" : "Edit confidence"}
                        </button>
                        {hasLocalEdit && (
                          <button
                            type="button"
                            onClick={() => handleReset(dialect.id)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--card)]"
                          >
                            Reset edits
                          </button>
                        )}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDelete(dialect.id)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
                          >
                            Delete custom
                          </button>
                        )}
                      </div>

                      {editingId === dialect.id && (
                        <div className="mt-3">
                          <ConfidenceEditor
                            dialect={dialect}
                            showVariantFields={isCustom}
                            onSave={(values) => handleSaveEdit(dialect.id, values)}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </FeatureCard>
  );
}
