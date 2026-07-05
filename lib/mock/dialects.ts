import type { Dialect } from "@/lib/schemas";
import { SEED_DATA_NOTICE, SEED_DATA_VALIDATION } from "./constants";

export const mockDialects: Dialect[] = [
  {
    id: "dialect-ceb-cebu",
    language_id: "lang-ceb",
    name: "Cebuano / Bisaya",
    variant_label: "Cebu variant",
    region: "Cebu",
    confidence_level: 0.55,
    validation_status: SEED_DATA_VALIDATION,
    is_mock_data: true,
  },
  {
    id: "dialect-ceb-mindanao",
    language_id: "lang-ceb",
    name: "Cebuano / Bisaya",
    variant_label: "Mindanao variant",
    region: "Mindanao",
    confidence_level: 0.5,
    validation_status: "uncertain",
    is_mock_data: true,
  },
  {
    id: "dialect-hil-iloilo",
    language_id: "lang-hil",
    name: "Hiligaynon / Ilonggo",
    variant_label: "Iloilo variant",
    region: "Iloilo",
    confidence_level: 0.52,
    validation_status: SEED_DATA_VALIDATION,
    is_mock_data: true,
  },
  {
    id: "dialect-tl-manila",
    language_id: "lang-tl",
    name: "Tagalog",
    variant_label: "Manila variant",
    region: "Metro Manila",
    confidence_level: 0.6,
    validation_status: SEED_DATA_VALIDATION,
    is_mock_data: true,
  },
  {
    id: "dialect-blaan-koronadal",
    language_id: "lang-bli",
    name: "B'laan",
    variant_label: "Koronadal B'laan",
    region: "Koronadal, South Cotabato",
    confidence_level: 0.48,
    validation_status: "uncertain",
    is_mock_data: true,
  },
  {
    id: "dialect-blaan-sarangani",
    language_id: "lang-bli",
    name: "B'laan",
    variant_label: "Sarangani B'laan",
    region: "Sarangani Province, Mindanao",
    confidence_level: 0.48,
    validation_status: "uncertain",
    is_mock_data: true,
  },
];

export const mockDialectsNotice = SEED_DATA_NOTICE;

export function getDialectById(id: string): Dialect | undefined {
  return mockDialects.find((dialect) => dialect.id === id);
}

export function getDialectsByLanguageId(languageId: string): Dialect[] {
  return mockDialects.filter((dialect) => dialect.language_id === languageId);
}
