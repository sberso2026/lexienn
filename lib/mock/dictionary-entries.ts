import type { DictionaryEntry } from "@/lib/schemas";
import {
  SEED_DATA_NOTICE,
  SEED_DATA_VALIDATION,
  mockConfidence,
} from "./constants";

function baseEntry(
  partial: Omit<DictionaryEntry, "is_mock_data" | "mock_data_notice" | "confidence" | "validation_status" | "audio_type"> & {
    confidence_score?: number;
    validation_status?: DictionaryEntry["validation_status"];
    audio_type?: DictionaryEntry["audio_type"];
  },
): DictionaryEntry {
  return {
    ...partial,
    confidence: mockConfidence(partial.confidence_score ?? 0.62),
    validation_status: partial.validation_status ?? SEED_DATA_VALIDATION,
    audio_type: partial.audio_type ?? "synthetic_tts",
    is_mock_data: true,
    mock_data_notice: SEED_DATA_NOTICE,
  };
}

export const mockDictionaryEntries: DictionaryEntry[] = [
  baseEntry({
    id: "entry-load",
    input_text: "load",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "word",
    general_meaning_en:
      "Something carried, supported, or handled; an amount of work or weight.",
    detailed_meaning_en:
      "As a noun, 'load' can mean a quantity carried at one time, a burden, or an amount of work. As a verb, it means to place a burden on or to fill something (e.g., load a truck). Meaning depends heavily on context.",
    target_meaning: "karga",
    closest_local_equivalent_note:
      "Multiple Tagalog senses exist (karga, load sa trabaho). This mock entry uses one common sense only.",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "In engineering: a force or weight applied to a structure or member (dead load, live load, wind load, seismic load, load path).",
        caution_note:
          "This is a language explanation, not professional design advice.",
      },
      {
        context: "household_family",
        meaning_en:
          "At home: laundry load, groceries carried in, or household tasks to handle.",
      },
      {
        context: "student",
        meaning_en: "School workload: assignments, readings, or exam preparation load.",
      },
    ],
    examples: [
      {
        text: "The truck carried a heavy load.",
        language_code: "en",
        context_label: "General English",
      },
      {
        text: "Check the live load before approving the slab design.",
        language_code: "en",
        context_label: "Engineering",
      },
      {
        text: "Mabigat ang karga ng truck.",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: {
      simple: "LOHD",
      syllables: "load",
      ipa: "/loʊd/",
    },
    usage_notes: [
      "Formal and informal in general English.",
      "Engineering sense is technical and professional.",
    ],
    related_terms: ["burden", "cargo", "dead load", "live load"],
    common_mistakes: [
      "Confusing 'load' (engineering force) with 'lode' (mineral deposit).",
    ],
    confidence_score: 0.68,
  }),

  baseEntry({
    id: "entry-stress",
    input_text: "stress",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "word",
    general_meaning_en:
      "Pressure or strain; mental or emotional tension; emphasis on a syllable or word.",
    detailed_meaning_en:
      "'Stress' can describe psychological pressure, physical strain, or emphasis in speech. In science and engineering it also means force per unit area.",
    target_meaning: "stress / diin",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "Force per unit area within a material (axial stress, bending stress, shear stress, von Mises stress).",
        caution_note:
          "This is a language explanation, not professional design advice.",
      },
      {
        context: "student",
        meaning_en:
          "Exam pressure, study pressure, deadline pressure, or performance anxiety.",
      },
      {
        context: "health_emergency",
        meaning_en:
          "Physical or emotional strain that may affect wellbeing; not a medical diagnosis.",
        caution_note:
          "This is a language explanation, not medical advice.",
      },
    ],
    examples: [
      {
        text: "She felt stress before the final exam.",
        language_code: "en",
        context_label: "Student context",
      },
      {
        text: "The beam must resist bending stress.",
        language_code: "en",
        context_label: "Engineering",
      },
      {
        text: "Maraming stress ako sa exam.",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: {
      simple: "STRES",
      syllables: "stress",
      ipa: "/strɛs/",
    },
    usage_notes: ["Common in casual and professional English."],
    related_terms: ["pressure", "strain", "anxiety", "emphasis"],
    common_mistakes: [
      "Using engineering 'stress' when meaning emotional stress in casual chat.",
    ],
    confidence_score: 0.66,
  }),

  baseEntry({
    id: "entry-foundation",
    input_text: "foundation",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "technical_term",
    general_meaning_en:
      "The base on which something is built; an underlying basis or starting point.",
    detailed_meaning_en:
      "Can refer to a building foundation, a charitable foundation, or a figurative basis for ideas or skills.",
    target_meaning: "pundasyon",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "Structural element transferring building loads to the ground (shallow or deep foundation, footing, pile cap).",
        caution_note:
          "This is a language explanation, not professional design advice.",
      },
      {
        context: "construction_worker",
        meaning_en:
          "The excavated and built base where columns, walls, or slabs start on site.",
      },
      {
        context: "student",
        meaning_en:
          "Basic knowledge or skills that later learning builds upon.",
      },
    ],
    examples: [
      {
        text: "The foundation must rest on firm soil.",
        language_code: "en",
        context_label: "Engineering",
      },
      {
        text: "Math is the foundation of engineering studies.",
        language_code: "en",
        context_label: "Student",
      },
      {
        text: "Matibay ang pundasyon ng gusali.",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: {
      simple: "rown-DAY-shun",
      syllables: "foun·da·tion",
      ipa: "/faʊnˈdeɪʃən/",
    },
    usage_notes: ["Technical in construction; figurative in education."],
    related_terms: ["footing", "basis", "pile", "substructure"],
    common_mistakes: [
      "Confusing 'foundation' (structure) with 'donation' contexts of charitable foundations.",
    ],
    confidence_score: 0.7,
  }),

  baseEntry({
    id: "entry-water",
    input_text: "water",
    source_language: "en",
    target_language: "ceb",
    target_dialect: "dialect-ceb-cebu",
    entry_type: "word",
    general_meaning_en: "Clear liquid essential for life; H₂O.",
    detailed_meaning_en:
      "Used for drinking, cooking, cleaning, irrigation, and industrial processes. In remote areas, access and safety are common concerns.",
    target_meaning: "tubig",
    profession_meanings: [
      {
        context: "farmer",
        meaning_en: "Irrigation water, rainfall, or water source for crops and livestock.",
      },
      {
        context: "engineer",
        meaning_en:
          "Fluid in hydrology/hydraulics; design flows, flood paths, and water supply systems.",
        caution_note:
          "This is a language explanation, not professional design advice.",
      },
      {
        context: "traveller",
        meaning_en: "Safe drinking water, bottled water, or asking where to get water.",
      },
    ],
    examples: [
      {
        text: "I need clean drinking water.",
        language_code: "en",
        context_label: "Traveller",
      },
      {
        text: "Gusto ko ug tubig.",
        language_code: "ceb",
        context_label: "Cebuano target",
      },
    ],
    pronunciation: {
      simple: "WAW-ter",
      syllables: "wa·ter",
      ipa: "/ˈwɔːtər/",
    },
    usage_notes: ["Neutral; essential survival vocabulary."],
    related_terms: ["drinking water", "tubig", "irrigation"],
    common_mistakes: ["Assuming all local water is safe to drink without checking."],
    confidence_score: 0.58,
    validation_status: "uncertain",
  }),

  baseEntry({
    id: "entry-help",
    input_text: "help",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "word",
    general_meaning_en: "Assistance or support; to make something easier for someone.",
    detailed_meaning_en:
      "Can be a verb ('help me') or noun ('need help'). Critical in emergencies and travel.",
    target_meaning: "tulong",
    profession_meanings: [
      {
        context: "health_emergency",
        meaning_en: "Urgent assistance, medical help, or calling for aid.",
        caution_note: "This is a language explanation, not medical advice.",
      },
      {
        context: "traveller",
        meaning_en: "Asking locals for assistance with directions, transport, or safety.",
      },
    ],
    examples: [
      {
        text: "I need help!",
        language_code: "en",
        context_label: "Emergency",
      },
      {
        text: "Tulungan mo ako.",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: {
      simple: "HELP",
      syllables: "help",
      ipa: "/hɛlp/",
    },
    usage_notes: ["Direct and appropriate in emergencies."],
    related_terms: ["assist", "aid", "tulong", "rescue"],
    common_mistakes: ["Using overly casual forms in serious emergencies."],
    confidence_score: 0.72,
  }),

  baseEntry({
    id: "entry-road",
    input_text: "road",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "word",
    general_meaning_en: "A path or way for vehicles and pedestrians to travel.",
    detailed_meaning_en:
      "Includes highways, local streets, dirt roads, and farm access roads. Important for directions and fieldwork.",
    target_meaning: "kalsada / daan",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "Road alignment, pavement, drainage, and traffic load in civil engineering.",
        caution_note:
          "This is a language explanation, not professional design advice.",
      },
      {
        context: "traveller",
        meaning_en: "Route to a destination; nearest paved or passable road.",
      },
      {
        context: "farmer",
        meaning_en: "Farm access road, haul road, or path for moving produce.",
      },
    ],
    examples: [
      {
        text: "Where is the nearest road?",
        language_code: "en",
        context_label: "Traveller",
      },
      {
        text: "Nasaan ang pinakamalapit na kalsada?",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: {
      simple: "ROHD",
      syllables: "road",
      ipa: "/roʊd/",
    },
    usage_notes: ["Common in directions and transport contexts."],
    related_terms: ["street", "highway", "daan", "kalsada"],
    common_mistakes: [
      "Confusing 'road' with 'street' when locals use different terms.",
    ],
    confidence_score: 0.65,
  }),

  baseEntry({
    id: "entry-how-much",
    input_text: "how much",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "phrase",
    general_meaning_en: "A question about price, quantity, or degree.",
    detailed_meaning_en:
      "Used when asking cost ('How much is this?') or amount. Essential for markets and transport.",
    target_meaning: "magkano",
    profession_meanings: [
      {
        context: "business_owner",
        meaning_en: "Pricing questions, quotations, and cost negotiation.",
      },
      {
        context: "traveller",
        meaning_en: "Asking prices for food, transport, lodging, or goods.",
      },
    ],
    examples: [
      {
        text: "How much is this?",
        language_code: "en",
        context_label: "General",
      },
      {
        text: "Magkano po ito?",
        language_code: "tl",
        context_label: "Polite form",
      },
    ],
    pronunciation: {
      simple: "how MUCH",
      syllables: "how · much",
    },
    usage_notes: ["Add 'po' in Tagalog for politeness (mock suggestion)."],
    related_terms: ["price", "cost", "magkano", "how many"],
    common_mistakes: [
      "Using 'how much' for countable items where 'how many' is correct in English.",
    ],
    confidence_score: 0.7,
  }),

  baseEntry({
    id: "entry-i-need-a-doctor",
    input_text: "I need a doctor",
    source_language: "en",
    target_language: "tl",
    target_dialect: "dialect-tl-manila",
    entry_type: "sentence",
    general_meaning_en: "A request indicating medical assistance is required.",
    detailed_meaning_en:
      "Used in health emergencies to communicate urgency. Should be spoken clearly and calmly if possible.",
    target_meaning: "Kailangan ko ng doktor.",
    profession_meanings: [
      {
        context: "health_emergency",
        meaning_en:
          "Urgent need for a physician or clinic; may need to specify injury or illness.",
        caution_note: "This is a language explanation, not medical advice.",
      },
      {
        context: "traveller",
        meaning_en:
          "Seeking medical care while away from home; useful at clinics or with locals.",
      },
    ],
    examples: [
      {
        text: "I need a doctor. Please help.",
        language_code: "en",
        context_label: "Emergency",
      },
      {
        text: "Kailangan ko ng doktor. Pakitulong po.",
        language_code: "tl",
        context_label: "Polite emergency",
      },
    ],
    pronunciation: {
      simple: "ay NEED uh DOK-ter",
      syllables: "I · need · a · doc·tor",
    },
    usage_notes: [
      "Emergency phrase — speak slowly and clearly.",
      "Sensitive health context.",
    ],
    related_terms: ["clinic", "hospital", "emergency", "doktor"],
    common_mistakes: [
      "Delaying clearer location information when help arrives.",
    ],
    confidence_score: 0.64,
    validation_status: "uncertain",
  }),

  baseEntry({
    id: "entry-show-way-nearest-road",
    input_text: "Can you show me the way to the nearest road?",
    source_language: "en",
    target_language: "ceb",
    target_dialect: "dialect-ceb-cebu",
    entry_type: "sentence",
    general_meaning_en:
      "A polite request for directions to the closest passable road.",
    detailed_meaning_en:
      "Useful when lost off-road, in rural areas, or after fieldwork. Implies the speaker needs guidance, not just a map.",
    target_meaning:
      "Mahimo ba nimo ipakita ang dalan padulong sa labing duol nga dalan?",
    closest_local_equivalent_note:
      "Long sentence; offline packs may use shorter variants. Mock translation is illustrative only.",
    profession_meanings: [
      {
        context: "traveller",
        meaning_en: "Finding a route back to civilization or transport.",
      },
      {
        context: "engineer",
        meaning_en:
          "Field teams locating access roads after site visits or inspections.",
        caution_note:
          "This is a language explanation, not professional safety guidance.",
      },
      {
        context: "farmer",
        meaning_en: "Asking for directions from fields or remote plots to a main road.",
      },
    ],
    examples: [
      {
        text: "Can you show me the way to the nearest road?",
        language_code: "en",
        context_label: "Traveller",
      },
      {
        text: "Mahimo ba nimo ko tudluan padulong sa dalan?",
        language_code: "ceb",
        context_label: "Cebuano target",
      },
    ],
    pronunciation: {
      simple: "kan yoo SHOH mee thuh way tuh thuh NEER-est rohd",
    },
    usage_notes: [
      "Polite request — suitable for approaching locals.",
      "Dialect wording may vary significantly.",
    ],
    related_terms: ["directions", "lost", "dalán", "kalsada"],
    common_mistakes: [
      "Using overly long sentences when a shorter phrase would be clearer offline.",
    ],
    confidence_score: 0.52,
    validation_status: "uncertain",
  }),
];

export const mockDictionaryEntriesNotice = SEED_DATA_NOTICE;

export function getMockDictionaryEntryByInput(
  inputText: string,
): DictionaryEntry | undefined {
  const normalized = inputText.trim().toLowerCase();
  return mockDictionaryEntries.find(
    (entry) => entry.input_text.toLowerCase() === normalized,
  );
}

export function getMockDictionaryEntryById(
  id: string,
): DictionaryEntry | undefined {
  return mockDictionaryEntries.find((entry) => entry.id === id);
}
