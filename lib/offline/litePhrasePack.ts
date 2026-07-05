import type { PhraseCategory } from "@/lib/schemas";
import { BASE_PHRASE_TEMPLATES } from "@/lib/offline/basePhraseTemplates";

export const LITE_PACK_MIN_PHRASES = 150;
export const STANDARD_PACK_MIN_PHRASES = 800;
export const PROFESSIONAL_PACK_MIN_PHRASES = 2000;

export type PhraseTemplateVariables = {
  places: string[];
  items: string[];
  transport_types: string[];
  body_parts: string[];
  assets: string[];
  hazards: string[];
  numbers: string[];
  prices: string[];
  family_roles: string[];
  time_words: string[];
  conditions: string[];
  objects: string[];
};

export const PHRASE_TEMPLATE_VARIABLES: PhraseTemplateVariables = {
  places: [
    "road",
    "clinic",
    "hospital",
    "pharmacy",
    "market",
    "bus stop",
    "train station",
    "airport",
    "hotel",
    "police station",
    "embassy",
    "toilet",
    "parking area",
    "bridge",
    "village",
    "town",
    "port",
    "border checkpoint",
    "school",
    "church",
  ],
  items: [
    "water",
    "food",
    "medicine",
    "help",
    "transport",
    "a doctor",
    "a room",
    "change",
    "receipt",
    "sim card",
    "charger",
    "blanket",
    "mask",
    "pain relief",
  ],
  transport_types: ["bus", "taxi", "train", "boat", "motorcycle", "jeepney", "tricycle"],
  body_parts: ["head", "chest", "stomach", "back", "leg", "arm", "tooth"],
  assets: ["bridge", "road", "pipeline", "tower", "generator", "water tank"],
  hazards: ["flood", "landslide", "fire", "snake", "electricity", "gas leak"],
  numbers: ["one", "two", "three", "four", "five", "ten", "twenty", "fifty", "one hundred"],
  prices: ["this", "the total", "the fare", "the room rate"],
  family_roles: ["my child", "my parent", "my spouse", "my colleague"],
  time_words: ["today", "tomorrow", "morning", "afternoon", "evening", "now"],
  conditions: ["water", "food", "this area", "this road", "this bridge"],
  objects: ["map", "ticket", "passport", "phone number", "address"],
};

export type LitePackTemplate = {
  id: string;
  category: PhraseCategory;
  source_text: string;
  phrase_template_id?: string;
  usage_note?: string;
};

type PatternDef = {
  id: string;
  category: PhraseCategory;
  pattern: string;
  slot: keyof PhraseTemplateVariables;
  usage_note?: string;
};

const TEMPLATE_PATTERNS: PatternDef[] = [
  { id: "where-nearest", category: "directions", pattern: "Where is the nearest {place}?", slot: "places" },
  { id: "take-me-to", category: "transport", pattern: "Please take me to the {place}.", slot: "places" },
  { id: "need-item", category: "emergency", pattern: "I need {item}.", slot: "items" },
  { id: "how-much-price", category: "price_and_money", pattern: "How much is {price}?", slot: "prices" },
  { id: "is-safe", category: "safety_and_danger", pattern: "Is {condition} safe?", slot: "conditions" },
  { id: "show-object", category: "directions", pattern: "Can you show me the {object}?", slot: "objects" },
  { id: "pain-body", category: "medical", pattern: "I have pain in my {body_part}.", slot: "body_parts" },
  { id: "inspect-asset", category: "fieldwork_engineering", pattern: "We are here to inspect the {asset}.", slot: "assets" },
  { id: "flooded-before", category: "weather_and_environment", pattern: "Has this area flooded before?", slot: "places", usage_note: "Use with hazard context." },
  { id: "transport-by", category: "transport", pattern: "I need a {transport_type}.", slot: "transport_types" },
  { id: "family-needs", category: "household_family", pattern: "{family_role} needs help.", slot: "family_roles" },
  { id: "time-schedule", category: "time_and_schedule", pattern: "What time is it {time_word}?", slot: "time_words" },
  { id: "hazard-warning", category: "safety_and_danger", pattern: "Watch out for {hazard}.", slot: "hazards" },
  { id: "buy-at-market", category: "shopping_and_market", pattern: "Where can I buy {item}?", slot: "items" },
  { id: "call-police", category: "police_and_authority", pattern: "Please call the police about {hazard}.", slot: "hazards" },
  { id: "phone-help", category: "phone_and_communication", pattern: "Can I use your phone to call about {item}?", slot: "items" },
  { id: "farm-question", category: "farming_and_rural", pattern: "Where is the nearest farm supply for {item}?", slot: "items" },
  { id: "repair-needed", category: "problems_and_repairs", pattern: "This {asset} needs repair.", slot: "assets" },
  { id: "permission-enter", category: "consent_and_permission", pattern: "May I enter this {place}?", slot: "places" },
  { id: "weather-today", category: "weather_and_environment", pattern: "What is the weather like {time_word}?", slot: "time_words" },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function expandPatternCorrectly(pattern: PatternDef, value: string): LitePackTemplate {
  const slotToken = `{${pattern.slot.replace(/s$/, "")}}`;
  const altToken = `{${pattern.slot}}`;
  let sourceText = pattern.pattern;
  if (sourceText.includes(slotToken)) {
    sourceText = sourceText.replace(slotToken, value);
  } else if (sourceText.includes(altToken)) {
    sourceText = sourceText.replace(altToken, value);
  } else {
    sourceText = pattern.pattern.replace(/\{[^}]+\}/g, value);
  }

  return {
    id: `${pattern.id}--${slugify(value)}`,
    category: pattern.category,
    source_text: sourceText,
    phrase_template_id: pattern.id,
    usage_note: pattern.usage_note,
  };
}

function buildFixedLiteTemplates(): LitePackTemplate[] {
  return BASE_PHRASE_TEMPLATES.map((template) => ({
    id: template.id,
    category: template.category,
    source_text: template.source_text,
    phrase_template_id: template.local_response_id ? `response-${template.local_response_id}` : template.id,
  }));
}

function buildExpandedTemplates(): LitePackTemplate[] {
  const expanded: LitePackTemplate[] = [];

  for (const pattern of TEMPLATE_PATTERNS) {
    const values = PHRASE_TEMPLATE_VARIABLES[pattern.slot];
    for (const value of values) {
      expanded.push(expandPatternCorrectly(pattern, value));
    }
  }

  const standalone: LitePackTemplate[] = [
    { id: "greet-good-evening", category: "respectful_greetings", source_text: "Good evening. Thank you.", phrase_template_id: "greeting-evening" },
    { id: "family-where-staying", category: "household_family", source_text: "My family is staying nearby.", phrase_template_id: "family-staying" },
    { id: "schedule-meeting", category: "time_and_schedule", source_text: "What time does it open?", phrase_template_id: "schedule-open" },
    { id: "schedule-close", category: "time_and_schedule", source_text: "What time does it close?", phrase_template_id: "schedule-close" },
    { id: "shopping-bargain", category: "shopping_and_market", source_text: "Can you lower the price?", phrase_template_id: "shopping-bargain" },
    { id: "shopping-weigh", category: "shopping_and_market", source_text: "Can you weigh this?", phrase_template_id: "shopping-weigh" },
    { id: "phone-signal", category: "phone_and_communication", source_text: "Is there mobile signal here?", phrase_template_id: "phone-signal" },
    { id: "phone-translate", category: "phone_and_communication", source_text: "Can someone translate for me?", phrase_template_id: "phone-translate" },
    { id: "police-report", category: "police_and_authority", source_text: "I need to report a problem.", phrase_template_id: "police-report" },
    { id: "police-lost-item", category: "police_and_authority", source_text: "I lost my passport.", phrase_template_id: "police-lost-passport" },
    { id: "consent-photo", category: "consent_and_permission", source_text: "May I take a photo here?", phrase_template_id: "consent-photo" },
    { id: "consent-record", category: "consent_and_permission", source_text: "May I record audio for work?", phrase_template_id: "consent-record" },
    { id: "farm-harvest", category: "farming_and_rural", source_text: "When is harvest season here?", phrase_template_id: "farm-harvest" },
    { id: "farm-water-source", category: "farming_and_rural", source_text: "Where is the water source?", phrase_template_id: "farm-water" },
    { id: "weather-rain", category: "weather_and_environment", source_text: "Will it rain today?", phrase_template_id: "weather-rain" },
    { id: "weather-storm", category: "weather_and_environment", source_text: "Is a storm coming?", phrase_template_id: "weather-storm" },
    { id: "repair-broken", category: "problems_and_repairs", source_text: "This is broken.", phrase_template_id: "repair-broken" },
    { id: "repair-help", category: "problems_and_repairs", source_text: "Can you help me fix this?", phrase_template_id: "repair-help" },
    { id: "safety-stay-away", category: "safety_and_danger", source_text: "Please stay away from that area.", phrase_template_id: "safety-stay-away" },
    { id: "safety-evacuate", category: "safety_and_danger", source_text: "Do we need to evacuate?", phrase_template_id: "safety-evacuate" },
    { id: "accommodation-checkout", category: "accommodation", source_text: "What time is checkout?", phrase_template_id: "accommodation-checkout" },
    { id: "accommodation-wifi", category: "accommodation", source_text: "Is there Wi-Fi?", phrase_template_id: "accommodation-wifi" },
    { id: "medical-allergy", category: "medical", source_text: "I have an allergy.", phrase_template_id: "medical-allergy" },
    { id: "medical-blood-type", category: "medical", source_text: "My blood type is on my card.", phrase_template_id: "medical-blood-type" },
    { id: "food-allergy", category: "food_and_water", source_text: "I cannot eat this ingredient.", phrase_template_id: "food-allergy" },
    { id: "food-vegetarian", category: "food_and_water", source_text: "Do you have vegetarian food?", phrase_template_id: "food-vegetarian" },
    { id: "money-atm", category: "price_and_money", source_text: "Where is the nearest ATM?", phrase_template_id: "money-atm" },
    { id: "money-exchange", category: "price_and_money", source_text: "Where can I exchange money?", phrase_template_id: "money-exchange" },
    { id: "work-site-access", category: "fieldwork_engineering", source_text: "We have permission to access this site.", phrase_template_id: "work-site-access" },
    { id: "work-safety-gear", category: "fieldwork_engineering", source_text: "Where should we store safety gear?", phrase_template_id: "work-safety-gear" },
  ];

  return [...expanded, ...standalone];
}

let cachedLiteTemplates: LitePackTemplate[] | null = null;

export function getLitePackTemplates(): LitePackTemplate[] {
  if (cachedLiteTemplates) return cachedLiteTemplates;

  const byId = new Map<string, LitePackTemplate>();
  for (const template of [...buildFixedLiteTemplates(), ...buildExpandedTemplates()]) {
    if (!byId.has(template.id)) {
      byId.set(template.id, template);
    }
  }

  cachedLiteTemplates = [...byId.values()];
  return cachedLiteTemplates;
}

export function getLitePackTemplatesForTier(tier: "lite" | "standard" | "professional"): LitePackTemplate[] {
  const all = getLitePackTemplates();
  if (tier === "professional") {
    return all.slice(0, Math.min(all.length, PROFESSIONAL_PACK_MIN_PHRASES));
  }
  if (tier === "standard") {
    return all.slice(0, Math.min(all.length, STANDARD_PACK_MIN_PHRASES));
  }
  return all.slice(0, LITE_PACK_MIN_PHRASES);
}

export function assertLitePackCoverage(templates: LitePackTemplate[]): boolean {
  return templates.length >= LITE_PACK_MIN_PHRASES;
}
