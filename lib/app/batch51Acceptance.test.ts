import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  filterLanguageOptions,
  getLanguageOptionByValue,
  getLanguageSelectGroups,
  getNationalLanguageOptions,
  NATIONAL_LANGUAGES_GROUP,
} from "@/lib/languages/languageOptions";
import { getLanguageByCode } from "@/lib/mock/languages";

/**
 * Hard acceptance gates for Batch 51A + 51C on current main.
 */
describe("Batch 51A/51C acceptance gates", () => {
  it("registers Māori in the canonical language catalog under National Languages", () => {
    const mi = getLanguageOptionByValue("mi");
    expect(mi).toBeTruthy();
    expect(mi?.display_name).toBe("Māori");
    expect(mi?.native_name).toBe("te reo Māori");
    expect(mi?.bcp_47_tag).toBe("mi-NZ");
    expect(mi?.locale_tag).toBe("mi-NZ");
    expect(mi?.supports_offline_pack).toBe(false);

    expect(getNationalLanguageOptions().some((option) => option.value === "mi")).toBe(true);

    const national = getLanguageSelectGroups().find(
      (group) => group.label === NATIONAL_LANGUAGES_GROUP,
    );
    expect(national?.options.some((option) => option.value === "mi")).toBe(true);
    expect(national?.options.some((option) => option.label.includes("Māori"))).toBe(true);
  });

  it("finds Māori via required aliases", () => {
    for (const query of ["Māori", "Maori", "Te Reo", "Te Reo Māori", "te reo Māori", "mi"]) {
      expect(filterLanguageOptions(query).some((option) => option.value === "mi")).toBe(true);
    }
  });

  it("keeps Māori available to mock language lookups used by feedback/admin", () => {
    expect(getLanguageByCode("mi")?.name).toBe("Māori");
    expect(getLanguageByCode("mi")?.native_name).toBe("te reo Māori");
  });

  it("Translate shell has no Camera/OCR UI and links to Lens", () => {
    const translatorView = readFileSync(
      join(process.cwd(), "components/translator/TranslatorView.tsx"),
      "utf8",
    );
    const textTranslator = readFileSync(
      join(process.cwd(), "components/translator/TextTranslatorView.tsx"),
      "utf8",
    );

    expect(translatorView).toContain("TextTranslatorView");
    expect(translatorView).toContain('href="/lens"');
    expect(translatorView).toMatch(/Open Lens|Need to scan/);
    expect(translatorView).not.toContain("CameraTranslatorView");
    expect(translatorView).not.toContain("TranslatorModeTabs");
    expect(textTranslator).not.toContain("CameraTranslatorView");
    expect(textTranslator).not.toContain("ImageCaptureCard");
    expect(textTranslator).toContain("AUTO_DETECT_LANGUAGE");
    expect(existsSync(join(process.cwd(), "components/translator/TranslatorModeTabs.tsx"))).toBe(
      false,
    );
  });

  it("Lens owns camera/OCR and legacy routes redirect", () => {
    expect(existsSync(join(process.cwd(), "app/lens/page.tsx"))).toBe(true);
    const lensView = readFileSync(join(process.cwd(), "components/lens/LensView.tsx"), "utf8");
    const redirect = readFileSync(
      join(process.cwd(), "components/translator/TranslatorCameraRedirect.tsx"),
      "utf8",
    );
    expect(lensView).toContain("CameraTranslatorView");
    expect(redirect).toContain('router.replace("/lens")');
    expect(redirect).toContain('mode === "camera"');
    expect(redirect).toContain('tab === "camera"');
    expect(redirect).toContain("#camera");
  });

  it("feedback and library selectors use the canonical languageOptions catalog", () => {
    const correction = readFileSync(
      join(process.cwd(), "components/corrections/CorrectionForm.tsx"),
      "utf8",
    );
    const myDictionary = readFileSync(
      join(process.cwd(), "components/my-dictionary/MyDictionaryView.tsx"),
      "utf8",
    );
    expect(correction).toContain('from "@/lib/languages/languageOptions"');
    expect(myDictionary).toContain('from "@/lib/languages/languageOptions"');
  });
});
