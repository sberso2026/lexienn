import { describe, expect, it } from "vitest";
import {
  getAfricanLanguageOptions,
  getLanguageSelectGroups,
  LOCAL_DIALECTS_GROUP,
  NATIONAL_LANGUAGES_GROUP,
} from "@/lib/languages/languageOptions";

describe("languageCatalog re-exports", () => {
  it("exposes exactly National Languages and Local Dialects groups", () => {
    const labels = getLanguageSelectGroups().map((group) => group.label);
    expect(labels).toEqual([NATIONAL_LANGUAGES_GROUP, LOCAL_DIALECTS_GROUP]);
  });

  it("sorts African languages alphabetically by display name", () => {
    const names = getAfricanLanguageOptions().map((language) => language.display_name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
  });
});
