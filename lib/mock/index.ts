export {
  SEED_DATA_NOTICE,
  SEED_DATA_VALIDATION,
  MVP_MOCK_DATA_NOTICE,
  MVP_MOCK_VALIDATION,
  mockConfidence,
} from "./constants";
export {
  getDialectById,
  getDialectsByLanguageId,
  mockDialects,
  mockDialectsNotice,
} from "./dialects";
export {
  getMockDictionaryEntryById,
  getMockDictionaryEntryByInput,
  mockDictionaryEntries,
  mockDictionaryEntriesNotice,
} from "./dictionary-entries";
export {
  getLanguageByCode,
  getLanguageById,
  mockLanguages,
  mockLanguagesNotice,
} from "./languages";
export {
  getFlatLanguageSelectOptions,
  getLanguageSelectGroups,
  getLanguagesSortedAlphabetically,
  getParentLanguageCode,
  LANGUAGE_VARIANT_PARENT,
} from "./languageCatalog";
export type {
  LanguageSelectGroup,
  LanguageSelectOption,
} from "./languageCatalog";
export {
  getUserContextProfile,
  mockUserContextProfiles,
} from "./user-context-profiles";
export {
  PHRASE_CATEGORY_LABELS,
  PHRASE_CATEGORY_ORDER,
} from "./phrase-categories";
export {
  getPhrasePackById,
  getPhrasesByCategory,
  mockPhrasePacks,
  mockPhrasePacksNotice,
} from "./phrase-packs";

import { dialectSchema, offlinePhrasePackSchema } from "@/lib/schemas";
import { dictionaryEntrySchema, languageSchema } from "@/lib/schemas";
import { mockDialects } from "./dialects";
import { mockDictionaryEntries } from "./dictionary-entries";
import { mockLanguages } from "./languages";
import { mockPhrasePacks } from "./phrase-packs";

/** Parse and validate all bundled seed data at module load (dev safety check). */
export function validateMockSeedData(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const language of mockLanguages) {
    const result = languageSchema.safeParse(language);
    if (!result.success) {
      errors.push(`Language ${language.id}: ${result.error.message}`);
    }
  }

  for (const dialect of mockDialects) {
    const result = dialectSchema.safeParse(dialect);
    if (!result.success) {
      errors.push(`Dialect ${dialect.id}: ${result.error.message}`);
    }
  }

  for (const entry of mockDictionaryEntries) {
    const result = dictionaryEntrySchema.safeParse(entry);
    if (!result.success) {
      errors.push(`Entry ${entry.id}: ${result.error.message}`);
    }
  }

  for (const pack of mockPhrasePacks) {
    const result = offlinePhrasePackSchema.safeParse(pack);
    if (!result.success) {
      errors.push(`Phrase pack ${pack.id}: ${result.error.message}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
