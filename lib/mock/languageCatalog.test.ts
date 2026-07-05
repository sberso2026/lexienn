import { describe, expect, it } from "vitest";
import {
  AFRICAN_LANGUAGES_GROUP,
  AUSTRALIAN_LANGUAGES_GROUP,
  getAfricanLanguageOptions,
  getLanguageSelectGroups,
  PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP,
} from "@/lib/languages/languageOptions";

describe("languageCatalog re-exports", () => {
  it("orders priority regional groups before alphabetical groups", () => {
    const labels = getLanguageSelectGroups().map((group) => group.label);
    expect(labels[0]).toBe(AFRICAN_LANGUAGES_GROUP);
    expect(labels[1]).toBe(AUSTRALIAN_LANGUAGES_GROUP);
    expect(labels[2]).toBe(PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP);

    const rest = labels.slice(3);
    const sortedRest = [...rest].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(rest).toEqual(sortedRest);
  });

  it("sorts African languages alphabetically by display name", () => {
    const names = getAfricanLanguageOptions().map((language) => language.display_name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
  });
});
