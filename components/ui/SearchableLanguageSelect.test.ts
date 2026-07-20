import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SearchableLanguageSelect UI", () => {
  it("uses one combobox trigger and keeps search inside the popover", () => {
    const fieldSource = readFileSync("components/ui/SearchableLanguageSelectField.tsx", "utf8");
    const selectSource = readFileSync("components/ui/SearchableLanguageSelect.tsx", "utf8");

    expect(fieldSource).toContain("SearchableLanguageSelect");
    expect(fieldSource).not.toContain('placeholder="Search languages…"');
    expect(fieldSource).not.toContain("<select");
    expect(selectSource).toContain('placeholder="Search languages…"');
    expect(selectSource).not.toContain("<select");
    expect(selectSource).toContain('role="listbox"');
    expect(selectSource).toContain("min-h-12");
  });
});
