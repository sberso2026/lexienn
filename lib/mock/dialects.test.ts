import { describe, expect, it } from "vitest";
import { getLanguageSelectGroups } from "@/lib/languages/languageOptions";
import { PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP } from "@/lib/languages/philippineIndigenousLanguages";
import { mockDialects } from "@/lib/mock/dialects";

describe("Philippine Indigenous language catalog", () => {
  it("registers B'laan dialects under the indigenous B'laan language, not Tagalog", () => {
    const koronadal = mockDialects.find((dialect) => dialect.id === "dialect-blaan-koronadal");
    const sarangani = mockDialects.find((dialect) => dialect.id === "dialect-blaan-sarangani");

    expect(koronadal?.language_id).toBe("lang-bli");
    expect(sarangani?.language_id).toBe("lang-bli");
    expect(koronadal?.name).toBe("B'laan");
    expect(koronadal?.name).not.toMatch(/Filipino|Tagalog/i);

    const indigenousGroup = getLanguageSelectGroups().find(
      (group) => group.label === PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP,
    );
    const labels = indigenousGroup?.options.map((option) => option.label) ?? [];

    expect(labels.some((label) => label.includes("Koronadal B'laan"))).toBe(true);
    expect(labels.some((label) => label.includes("Sarangani B'laan"))).toBe(true);
    expect(labels.some((label) => label.includes("Filipino / Tagalog"))).toBe(false);
    expect(labels.some((label) => label.startsWith("B'laan"))).toBe(true);
  });
});
