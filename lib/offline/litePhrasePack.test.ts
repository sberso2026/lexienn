import { describe, expect, it } from "vitest";
import {
  assertLitePackCoverage,
  getLitePackTemplates,
  LITE_PACK_MIN_PHRASES,
} from "@/lib/offline/litePhrasePack";

describe("lite phrase pack", () => {
  it("provides at least 150 unique lite templates", () => {
    const templates = getLitePackTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(LITE_PACK_MIN_PHRASES);
    expect(assertLitePackCoverage(templates)).toBe(true);
    expect(new Set(templates.map((item) => item.id)).size).toBe(templates.length);
  });

  it("covers production taxonomy categories", () => {
    const templates = getLitePackTemplates();
    const categories = new Set(templates.map((item) => item.category));
    expect(categories.has("emergency")).toBe(true);
    expect(categories.has("shopping_and_market")).toBe(true);
    expect(categories.has("consent_and_permission")).toBe(true);
  });
});
