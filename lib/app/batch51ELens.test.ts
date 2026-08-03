import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  mergeOcrTextWithBlocks,
  normalizeTappedWord,
  isTappableOcrToken,
} from "@/lib/lens/ocrBlocks";
import {
  extractPreservedNumericTokens,
  runLocalDocumentIntelligence,
} from "@/lib/lens/documentIntelligence";
import { LENS_MODES, LENS_SAFETY_DISCLAIMER } from "@/lib/lens/lensTypes";

describe("Batch 51E Lens visual language intelligence", () => {
  it("exposes Live Scan, Capture, Import, and History modes", () => {
    expect(LENS_MODES.map((mode) => mode.id)).toEqual([
      "live_scan",
      "capture",
      "import",
      "history",
    ]);
    const view = readFileSync(
      join(process.cwd(), "components/lens/LensView.tsx"),
      "utf8",
    );
    expect(view).toContain("LensModeTabs");
    expect(view).toContain("LensScanHistory");
    expect(view).toContain("preferCamera");
    expect(view).toContain("preferImport");
  });

  it("preserves numbers/units/dates in OCR retention helper", () => {
    const text = "Dose 500mg at 12/01/2026. Cost $12.50 or 10%.";
    const tokens = extractPreservedNumericTokens(text);
    expect(tokens.some((token) => /500mg/i.test(token))).toBe(true);
    expect(tokens.some((token) => token.includes("12/01/2026"))).toBe(true);
    expect(tokens.some((token) => token.includes("12.50") || token.includes("$"))).toBe(true);
  });

  it("orders OCR blocks by reading_order", () => {
    const text = mergeOcrTextWithBlocks("fallback", [
      { text: "Second", reading_order: 1 },
      { text: "First", reading_order: 0 },
    ]);
    expect(text).toBe("First\n\nSecond");
  });

  it("supports Tap to Define token selection", () => {
    expect(isTappableOcrToken("Warning")).toBe(true);
    expect(isTappableOcrToken("12mg")).toBe(false);
    expect(normalizeTappedWord("(Danger!)")).toBe("Danger");
    const editor = readFileSync(
      join(process.cwd(), "components/translator/OcrResultEditor.tsx"),
      "utf8",
    );
    expect(editor).toContain("onTapWord");
    expect(editor).toContain("Tap a word to open Tap to Define");
    expect(existsSync(join(process.cwd(), "components/lens/TapToDefineSheet.tsx"))).toBe(
      true,
    );
  });

  it("document intelligence extracts dates/warnings and keeps guardrails", () => {
    const dates = runLocalDocumentIntelligence(
      "extract_dates",
      "Appointment on 12/01/2026. Follow-up 2026-02-03.",
    );
    expect(dates.items?.length).toBeGreaterThan(0);

    const warnings = runLocalDocumentIntelligence(
      "extract_warnings",
      "WARNING: Keep out of reach of children.\nDose carefully.",
    );
    expect(warnings.body.toLowerCase()).toContain("warning");
    expect(LENS_SAFETY_DISCLAIMER).toContain("not certified");
  });

  it("Translate no longer duplicates Lens camera UI", () => {
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TranslatorView.tsx"),
      "utf8",
    );
    expect(translator).toContain('href="/lens"');
    expect(translator).not.toContain("CameraTranslatorView");
  });

  it("Lens pipeline wires image tools, history save, and capability status", () => {
    const camera = readFileSync(
      join(process.cwd(), "components/translator/CameraTranslatorView.tsx"),
      "utf8",
    );
    expect(camera).toContain("LensImageTools");
    expect(camera).toContain("DocumentIntelligenceActions");
    expect(camera).toContain("saveLensScanHistoryItem");
    expect(camera).toContain("TapToDefineSheet");
    expect(existsSync(join(process.cwd(), "lib/lens/lensScanHistory.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "components/lens/LensCapabilityStatus.tsx"))).toBe(
      true,
    );
  });

  it("OCR cloud prompt requests layout blocks and preserves numbers", () => {
    const service = readFileSync(join(process.cwd(), "lib/ocr/ocrService.ts"), "utf8");
    expect(service).toContain("reading_order");
    expect(service).toContain("Preserve numbers, units, prices, and dates exactly");
    expect(service).toContain("safety signs");
  });
});
