import { describe, expect, it } from "vitest";
import { getLanguageSelectGroups, LOCAL_DIALECTS_GROUP } from "@/lib/languages/languageOptions";
import { mockDialects } from "@/lib/mock/dialects";

describe("Philippine Indigenous language catalog", () => {
  it("registers B'laan dialects under the indigenous B'laan language, not Tagalog", () => {
    const koronadal = mockDialects.find((dialect) => dialect.id === "dialect-blaan-koronadal");
    const sarangani = mockDialects.find((dialect) => dialect.id === "dialect-blaan-sarangani");

    expect(koronadal?.language_id).toBe("lang-bli");
    expect(sarangani?.language_id).toBe("lang-bli");
    expect(koronadal?.name).toBe("B'laan");
    expect(koronadal?.name).not.toMatch(/Filipino|Tagalog/i);

    const localGroup = getLanguageSelectGroups().find(
      (group) => group.label === LOCAL_DIALECTS_GROUP,
    );
    const labels = localGroup?.options.map((option) => option.label) ?? [];
    const blaanLabels = labels.filter((label) => /B'laan/i.test(label));

    expect(blaanLabels.some((label) => label.includes("Koronadal B'laan"))).toBe(true);
    expect(blaanLabels.some((label) => label.includes("Sarangani B'laan"))).toBe(true);
    expect(blaanLabels.every((label) => !/Filipino|Tagalog/i.test(label))).toBe(true);
    expect(blaanLabels.some((label) => label.startsWith("B'laan"))).toBe(true);
  });
});
