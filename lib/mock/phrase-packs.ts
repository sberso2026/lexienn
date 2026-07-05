import type { OfflinePhrase, OfflinePhrasePack, PhraseCategory } from "@/lib/schemas";
import { offlinePhrasePackSchema } from "@/lib/schemas";
import {
  SEED_DATA_NOTICE,
  SEED_DATA_VALIDATION,
  mockConfidence,
} from "./constants";

function phrase(
  id: string,
  english: string,
  targetText: string,
  dialectId: string,
  pronunciationSimple: string,
  category: PhraseCategory,
  options?: {
    confidenceScore?: number;
    validationStatus?: OfflinePhrase["validation_status"];
    localResponses?: string[];
  },
): OfflinePhrase {
  const score = options?.confidenceScore ?? 0.58;
  return {
    id,
    english,
    target_text: targetText,
    dialect_id: dialectId,
    pronunciation_simple: pronunciationSimple,
    category,
    audio_type: "synthetic_tts",
    validation_status: options?.validationStatus ?? SEED_DATA_VALIDATION,
    confidence: mockConfidence(score),
    local_responses: options?.localResponses,
    is_mock_data: true,
  };
}

function buildPack(
  partial: Omit<
    OfflinePhrasePack,
    "phrase_count" | "estimated_size_kb" | "categories" | "is_mock_data"
  > & {
    phrases: OfflinePhrase[];
  },
): OfflinePhrasePack {
  const categories = [
    ...new Set(partial.phrases.map((item) => item.category)),
  ] as PhraseCategory[];
  const phraseCount = partial.phrases.length;
  const estimatedSizeKb = Math.max(
    8,
    Math.round(JSON.stringify(partial.phrases).length / 1024),
  );

  return offlinePhrasePackSchema.parse({
    ...partial,
    categories,
    phrase_count: phraseCount,
    estimated_size_kb: estimatedSizeKb,
    is_mock_data: true,
  });
}

const tlManilaPhrases: OfflinePhrase[] = [
  phrase(
    "tl-help",
    "I need help.",
    "Tulungan niyo po ako.",
    "dialect-tl-manila",
    "too-LOONG-an niyo po ah-KO",
    "emergency",
    { localResponses: ["yes", "no", "wait"] },
  ),
  phrase(
    "tl-lost",
    "I am lost.",
    "Nawawala po ako.",
    "dialect-tl-manila",
    "nah-wah-WAH-lah po ah-KO",
    "emergency",
  ),
  phrase(
    "tl-safe",
    "Is this place safe?",
    "Ligtas po ba dito?",
    "dialect-tl-manila",
    "lig-TAS po bah DEE-to",
    "emergency",
    { localResponses: ["safe", "not safe"] },
  ),
  phrase(
    "tl-call-family",
    "Please call my family.",
    "Pakitawagan po ang pamilya ko.",
    "dialect-tl-manila",
    "pah-kee-tah-WAH-gan po ang pah-MEEL-yah ko",
    "emergency",
  ),
  phrase(
    "tl-nearest-road",
    "Where is the nearest road?",
    "Nasaan po ang pinakamalapit na kalsada?",
    "dialect-tl-manila",
    "nah-sah-AN po ang pee-nah-kah-mah-LAH-pit nah kal-SAH-dah",
    "directions",
    { localResponses: ["left", "right", "straight", "near", "far"] },
  ),
  phrase(
    "tl-show-way",
    "Can you show me the way?",
    "Maaari po bang ituro ang daan?",
    "dialect-tl-manila",
    "mah-ah-AH-ree po bang ee-TOO-ro ang dah-AN",
    "directions",
  ),
  phrase(
    "tl-water",
    "I need water.",
    "Kailangan ko po ng tubig.",
    "dialect-tl-manila",
    "kah-ee-LAHNG-an ko po nang TOO-big",
    "food_and_water",
  ),
  phrase(
    "tl-food",
    "I need food.",
    "Kailangan ko po ng pagkain.",
    "dialect-tl-manila",
    "kah-ee-LAHNG-an ko po nang pag-KAH-in",
    "food_and_water",
  ),
  phrase(
    "tl-doctor",
    "I need a doctor.",
    "Kailangan ko po ng doktor.",
    "dialect-tl-manila",
    "kah-ee-LAHNG-an ko po nang dok-TOR",
    "medical",
  ),
  phrase(
    "tl-clinic",
    "Please take me to the nearest clinic.",
    "Pakihatid po ako sa pinakamalapit na klinika.",
    "dialect-tl-manila",
    "pah-kee-hah-TID po ah-KO sah pee-nah-kah-mah-LAH-pit nah klee-NEE-kah",
    "medical",
  ),
  phrase(
    "tl-how-much",
    "How much is this?",
    "Magkano po ito?",
    "dialect-tl-manila",
    "mag-KAH-no po EE-to",
    "price_and_money",
  ),
  phrase(
    "tl-write-price",
    "Can you write the price here?",
    "Maaari po bang isulat ang presyo dito?",
    "dialect-tl-manila",
    "mah-ah-AH-ree po bang ee-soo-LAT ang PRES-yo DEE-to",
    "price_and_money",
    { localResponses: ["write number here"] },
  ),
  phrase(
    "tl-transport",
    "I need transport.",
    "Kailangan ko po ng sakay.",
    "dialect-tl-manila",
    "kah-ee-LAHNG-an ko po nang sah-KAHY",
    "transport",
  ),
  phrase(
    "tl-room",
    "Do you have a room for tonight?",
    "May kuwarto po ba para ngayong gabi?",
    "dialect-tl-manila",
    "may koo-WAR-to po bah PAH-rah ngah-YONG gah-BEE",
    "accommodation",
  ),
  phrase(
    "tl-greeting",
    "Good morning. Thank you.",
    "Magandang umaga po. Salamat po.",
    "dialect-tl-manila",
    "mah-gahn-DAHNG oo-MAH-gah po. sah-LAH-mat po",
    "respectful_greetings",
  ),
  phrase(
    "tl-bridge-inspect",
    "We are here to inspect the bridge.",
    "Nandito po kami para inspeksyonin ang tulay.",
    "dialect-tl-manila",
    "nahn-DEE-to po kah-MEE PAH-rah in-spek-SYOH-nin ang too-LAHY",
    "fieldwork_engineering",
    { confidenceScore: 0.52, validationStatus: "uncertain" },
  ),
  phrase(
    "tl-road-flood",
    "Has this road flooded before?",
    "Bumaha na po ba dito ang kalsadang ito?",
    "dialect-tl-manila",
    "boo-mah-HAH nah po bah DEE-to ang kal-sah-DANG EE-to",
    "fieldwork_engineering",
    { confidenceScore: 0.5, validationStatus: "uncertain" },
  ),
  phrase(
    "tl-water-flow",
    "Where does the water usually flow?",
    "Saan po karaniwang dumadaloy ang tubig?",
    "dialect-tl-manila",
    "sah-AN po kah-rah-nee-WANG doo-mah-dah-LOY ang TOO-big",
    "fieldwork_engineering",
    { confidenceScore: 0.5, validationStatus: "uncertain" },
  ),
  phrase(
    "tl-family-home",
    "I am staying with family.",
    "Nakikitira po ako sa pamilya.",
    "dialect-tl-manila",
    "nah-kee-kee-TEE-rah po ah-KO sah pah-MEEL-yah",
    "household_family",
  ),
];

const cebCebuPhrases: OfflinePhrase[] = [
  phrase(
    "ceb-help",
    "I need help.",
    "Tabangi ko palihog.",
    "dialect-ceb-cebu",
    "tah-BAHNG-ee ko pah-LEE-hog",
    "emergency",
    { localResponses: ["yes", "no", "wait"] },
  ),
  phrase(
    "ceb-lost",
    "I am lost.",
    "Naunsa ko.",
    "dialect-ceb-cebu",
    "nah-OON-sah ko",
    "emergency",
  ),
  phrase(
    "ceb-water",
    "I need water.",
    "Gusto ko ug tubig.",
    "dialect-ceb-cebu",
    "GOOS-to ko oog TOO-big",
    "food_and_water",
  ),
  phrase(
    "ceb-food",
    "I need food.",
    "Gusto ko ug pagkaon.",
    "dialect-ceb-cebu",
    "GOOS-to ko oog pag-KAH-on",
    "food_and_water",
  ),
  phrase(
    "ceb-doctor",
    "I need a doctor.",
    "Kinahanglan ko ug doktor.",
    "dialect-ceb-cebu",
    "kee-nah-HANG-lan ko oog dok-TOR",
    "medical",
  ),
  phrase(
    "ceb-clinic",
    "Please take me to the nearest clinic.",
    "Palihog dad-a ko sa labing duol nga klinika.",
    "dialect-ceb-cebu",
    "pah-LEE-hog DAH-dah ko sah LAH-bing DOO-ol ngah klee-NEE-kah",
    "medical",
  ),
  phrase(
    "ceb-nearest-road",
    "Where is the nearest road?",
    "Asa ang labing duol nga dalan?",
    "dialect-ceb-cebu",
    "AH-sah ang LAH-bing DOO-ol ngah dah-LAN",
    "directions",
    { localResponses: ["left", "right", "straight"] },
  ),
  phrase(
    "ceb-show-way",
    "Can you show me the way?",
    "Mahimo ba nimo ipakita ang dalan?",
    "dialect-ceb-cebu",
    "mah-HEE-mo bah NEE-mo ee-pah-KEE-tah ang dah-LAN",
    "directions",
  ),
  phrase(
    "ceb-how-much",
    "How much is this?",
    "Tagpila ni?",
    "dialect-ceb-cebu",
    "tag-PEE-lah nee",
    "price_and_money",
  ),
  phrase(
    "ceb-safe",
    "Is this place safe?",
    "Luwas ba ni nga lugar?",
    "dialect-ceb-cebu",
    "loo-WAS bah nee ngah loo-GAR",
    "emergency",
    { localResponses: ["safe", "not safe"] },
  ),
  phrase(
    "ceb-bridge-inspect",
    "We are here to inspect the bridge.",
    "Ania mi para inspeksyon sa tulay.",
    "dialect-ceb-cebu",
    "AH-nee-ah mee PAH-rah in-SPEK-syon sah too-LAHY",
    "fieldwork_engineering",
    { confidenceScore: 0.48, validationStatus: "uncertain" },
  ),
  phrase(
    "ceb-road-flood",
    "Has this road flooded before?",
    "Nabaha na ba ni nga dalan kaniadto?",
    "dialect-ceb-cebu",
    "nah-bah-HAH nah bah nee ngah dah-LAN kah-nee-AHD-to",
    "fieldwork_engineering",
    { confidenceScore: 0.48, validationStatus: "uncertain" },
  ),
  phrase(
    "ceb-water-flow",
    "Where does the water usually flow?",
    "Asa kasagaran moagay ang tubig?",
    "dialect-ceb-cebu",
    "AH-sah kar-nee-HANG mo-ah-GAHY ang TOO-big",
    "fieldwork_engineering",
    { confidenceScore: 0.47, validationStatus: "uncertain" },
  ),
  phrase(
    "ceb-greeting",
    "Good morning. Thank you.",
    "Maayong buntag. Salamat.",
    "dialect-ceb-cebu",
    "mah-AH-yong BOON-tag. sah-LAH-mat",
    "respectful_greetings",
  ),
  phrase(
    "ceb-call-family",
    "Please call my family.",
    "Palihog tawagi akong pamilya.",
    "dialect-ceb-cebu",
    "pah-LEE-hog tah-WAH-gee ah-KONG pah-MEEL-yah",
    "household_family",
  ),
];

const hilIloiloPhrases: OfflinePhrase[] = [
  phrase(
    "hil-help",
    "I need help.",
    "Buligi ako palihog.",
    "dialect-hil-iloilo",
    "boo-LEE-gee AH-ko pah-LEE-hog",
    "emergency",
  ),
  phrase(
    "hil-water",
    "I need water.",
    "Kinahanglan ko sang tubig.",
    "dialect-hil-iloilo",
    "kee-nah-HANG-lan ko sang TOO-big",
    "food_and_water",
  ),
  phrase(
    "hil-how-much",
    "How much is this?",
    "Tagpila ini?",
    "dialect-hil-iloilo",
    "tag-PEE-lah EE-nee",
    "price_and_money",
  ),
  phrase(
    "hil-show-way",
    "Can you show me the way?",
    "Puwede mo mapakita ang dalan?",
    "dialect-hil-iloilo",
    "poo-WEH-deh mo mah-pah-KEE-tah ang dah-LAN",
    "directions",
  ),
  phrase(
    "hil-greeting",
    "Good morning. Thank you.",
    "Maayong aga. Salamat.",
    "dialect-hil-iloilo",
    "mah-AH-yong AH-gah. sah-LAH-mat",
    "respectful_greetings",
  ),
  phrase(
    "hil-write-price",
    "Can you write the price here?",
    "Puwede isulat ang presyo diri?",
    "dialect-hil-iloilo",
    "poo-WEH-deh ee-soo-LAT ang PRES-yo DEE-ree",
    "price_and_money",
  ),
];

export const mockPhrasePacks: OfflinePhrasePack[] = [
  buildPack({
    id: "pack-tl-manila-remote",
    language_id: "lang-tl",
    dialect_id: "dialect-tl-manila",
    name: "Tagalog Remote & Field Pack",
    description:
      "Emergency, directions, food, medical, transport, and fieldwork phrases for Metro Manila Tagalog. seed data.",
    phrases: tlManilaPhrases,
  }),
  buildPack({
    id: "pack-ceb-cebu-field",
    language_id: "lang-ceb",
    dialect_id: "dialect-ceb-cebu",
    name: "Cebuano Field & Travel Pack",
    description:
      "Cebu variant phrases for travel, emergencies, directions, and engineering fieldwork. seed data.",
    phrases: cebCebuPhrases,
  }),
  buildPack({
    id: "pack-hil-iloilo-travel",
    language_id: "lang-hil",
    dialect_id: "dialect-hil-iloilo",
    name: "Hiligaynon Travel Essentials",
    description:
      "Compact Iloilo variant pack for greetings, help, directions, and prices. seed data.",
    phrases: hilIloiloPhrases,
  }),
];

export const mockPhrasePacksNotice = SEED_DATA_NOTICE;

export function getPhrasePackById(id: string): OfflinePhrasePack | undefined {
  return mockPhrasePacks.find((pack) => pack.id === id);
}

export function getPhrasesByCategory(
  pack: OfflinePhrasePack,
  category: PhraseCategory,
): OfflinePhrase[] {
  return pack.phrases.filter((item) => item.category === category);
}
