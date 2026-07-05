import {
  buildEntryFromCurated,
  findSeedByInputKey,
  type CuratedSeedEntry,
} from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";

const ENGINEERING_CAUTION =
  "This is a language explanation, not professional design advice.";

export const CURATED_DICTIONARY_ENTRIES: CuratedSeedEntry[] = [
  {
    id: "prod-curated-prodigy",
    input_key: "prodigy",
    entry_type: "word",
    general_meaning_en:
      "A person, especially a young person, with exceptional talent, ability, or achievement in a particular field.",
    detailed_meaning_en:
      "A prodigy is someone who shows remarkable skill or accomplishment at an unusually early age or in a specialized domain, such as music, mathematics, or sports.",
    target_meaning: "batang mahusay / prodigy",
    closest_local_equivalent_note:
      "Tagalog may use the English loanword 'prodigy' in formal contexts. No single everyday word captures all senses of exceptional early talent.",
    profession_meanings: [
      {
        context: "student",
        meaning_en:
          "A classmate or peer recognized for outstanding academic or extracurricular achievement.",
      },
    ],
    examples: [
      {
        text: "She was a piano prodigy by age ten.",
        language_code: "en",
        context_label: "General English",
      },
      {
        text: "Siya ay isang prodigy sa piano noong siya ay sampung taong gulang.",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: { simple: "PRAH-dih-jee", syllables: "prod·i·gy", ipa: "/ˈprɒdɪdʒi/" },
    usage_notes: ["Formal and informal in English.", "Often used with a field: 'math prodigy'."],
    related_terms: ["talent", "genius", "wunderkind", "virtuoso"],
    common_mistakes: [
      "Confusing 'prodigy' (talented person) with 'prodigious' (remarkably great in size or degree).",
    ],
  },
  {
    id: "prod-curated-deep",
    input_key: "deep",
    entry_type: "word",
    general_meaning_en: "Extending far down from the top or surface; profound or intense.",
    detailed_meaning_en:
      "'Deep' describes physical depth, strong feelings, or complex ideas. In technical fields it can describe members, foundations, or regions with large depth relative to other dimensions.",
    target_meaning: "malalim",
    closest_local_equivalent_note:
      "Sense depends on context (water depth, feelings, or technical depth).",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "Often paired with structural terms (deep beam, deep foundation) where depth is small relative to span or load transfer is not flexure-dominated.",
        caution_note: ENGINEERING_CAUTION,
      },
    ],
    examples: [
      { text: "The lake is very deep here.", language_code: "en", context_label: "General" },
      { text: "Malalim ang lawa rito.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "DEEP", ipa: "/diːp/" },
    related_terms: ["depth", "profound", "shallow"],
    common_mistakes: ["Using 'deep' alone when a technical compound term is required (e.g., deep beam)."],
  },
  {
    id: "prod-curated-beam",
    input_key: "beam",
    entry_type: "word",
    general_meaning_en:
      "A long piece of timber, metal, or concrete used to support weight; a ray of light.",
    detailed_meaning_en:
      "As a noun, a beam is a horizontal or sloped structural member that carries loads to supports. As a verb, 'beam' can mean to smile radiantly or to send out light or signals.",
    target_meaning: "bigkis / sinag",
    closest_local_equivalent_note:
      "Structural 'beam' is often discussed using the English term on site; 'sinag' applies to light beams.",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "A structural member primarily resisting bending, shear, and deflection between supports (girder, joist, lintel).",
        caution_note: ENGINEERING_CAUTION,
      },
      {
        context: "construction_worker",
        meaning_en: "A steel or concrete member installed to span openings and carry floor or roof loads.",
        caution_note: ENGINEERING_CAUTION,
      },
    ],
    examples: [
      {
        text: "The steel beam spans six meters between columns.",
        language_code: "en",
        context_label: "Engineering",
      },
      {
        text: "Ang steel beam ay sumasaklaw ng anim na metro sa pagitan ng mga haligi.",
        language_code: "tl",
        context_label: "Target language",
      },
    ],
    pronunciation: { simple: "BEEM", ipa: "/biːm/" },
    related_terms: ["girder", "joist", "lintel", "deep beam", "shallow beam"],
    common_mistakes: ["Confusing 'beam' (member) with 'column' (vertical support)."],
  },
  {
    id: "prod-curated-load",
    input_key: "load",
    entry_type: "word",
    general_meaning_en:
      "Something carried or supported. In engineering, an action or force applied to a structure or component.",
    detailed_meaning_en:
      "As a noun, load can mean cargo, workload, or an applied force. As a verb, it means to place weight on or fill something. Engineering usage focuses on forces transferred through a structure.",
    target_meaning: "karga",
    closest_local_equivalent_note:
      "Multiple Tagalog senses exist (karga, load sa trabaho). Context determines the best choice.",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "An action or force applied to a structure or component, including dead load, live load, wind load, and seismic load along a load path.",
        caution_note: ENGINEERING_CAUTION,
      },
      {
        context: "household_family",
        meaning_en: "Laundry load, groceries carried in, or household tasks to handle.",
      },
      {
        context: "student",
        meaning_en: "School workload: assignments, readings, or exam preparation load.",
      },
    ],
    examples: [
      { text: "The truck carried a heavy load.", language_code: "en", context_label: "General" },
      {
        text: "Check the live load before approving the slab design.",
        language_code: "en",
        context_label: "Engineering",
      },
      { text: "Mabigat ang karga ng truck.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "LOHD", ipa: "/loʊd/" },
    related_terms: ["burden", "cargo", "dead load", "live load", "load path"],
    common_mistakes: ["Confusing 'load' (engineering force) with 'lode' (mineral deposit)."],
  },
  {
    id: "prod-curated-stress",
    input_key: "stress",
    entry_type: "word",
    general_meaning_en:
      "Pressure or strain. In engineering, internal force per unit area within a material.",
    detailed_meaning_en:
      "'Stress' can describe psychological pressure, emphasis in speech, or internal force per unit area in materials. Engineering stress types include axial, bending, and shear stress.",
    target_meaning: "stress / diin",
    closest_local_equivalent_note:
      "Emotional 'stress' and engineering 'stress' share the English word; context clarifies the sense.",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "Internal force per unit area within a material (axial stress, bending stress, shear stress).",
        caution_note: ENGINEERING_CAUTION,
      },
      {
        context: "student",
        meaning_en: "Exam pressure, study pressure, or performance anxiety.",
      },
      {
        context: "health_emergency",
        meaning_en: "Physical or emotional strain; not a medical diagnosis.",
        caution_note: "This is a language explanation, not medical advice.",
      },
    ],
    examples: [
      { text: "She felt stress before the final exam.", language_code: "en", context_label: "Student" },
      { text: "The beam must resist bending stress.", language_code: "en", context_label: "Engineering" },
      { text: "Maraming stress ako sa exam.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "STRES", ipa: "/strɛs/" },
    related_terms: ["pressure", "strain", "anxiety", "shear stress"],
    common_mistakes: ["Using engineering 'stress' when meaning emotional stress in casual chat."],
  },
  {
    id: "prod-curated-foundation",
    input_key: "foundation",
    entry_type: "technical_term",
    general_meaning_en: "The supporting base of something.",
    detailed_meaning_en:
      "The supporting base of something. In structural engineering, the part of a structure that transfers loads from columns, walls, or frames into the ground.",
    target_meaning: "pundasyon",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en:
          "Structural element transferring building loads to the ground (shallow or deep foundation, footing, pile cap).",
        caution_note: ENGINEERING_CAUTION,
      },
      {
        context: "construction_worker",
        meaning_en: "The excavated and built base where columns, walls, or slabs start on site.",
        caution_note: ENGINEERING_CAUTION,
      },
      {
        context: "student",
        meaning_en: "Basic knowledge or skills that later learning builds upon.",
      },
    ],
    examples: [
      { text: "The foundation must rest on firm soil.", language_code: "en", context_label: "Engineering" },
      { text: "Math is the foundation of engineering studies.", language_code: "en", context_label: "Student" },
      { text: "Matibay ang pundasyon ng gusali.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "rown-DAY-shun", syllables: "foun·da·tion", ipa: "/faʊnˈdeɪʃən/" },
    related_terms: ["footing", "basis", "pile", "substructure", "bearing capacity"],
    common_mistakes: [
      "Confusing structural 'foundation' with charitable 'foundation' organizations.",
    ],
  },
  {
    id: "prod-curated-water",
    input_key: "water",
    entry_type: "word",
    general_meaning_en: "Clear liquid essential for life; H₂O.",
    detailed_meaning_en:
      "Used for drinking, cooking, cleaning, irrigation, and industrial processes. In remote areas, access and safety are common concerns.",
    target_meaning: "tubig",
    profession_meanings: [
      { context: "farmer", meaning_en: "Irrigation water, rainfall, or water source for crops and livestock." },
      {
        context: "engineer",
        meaning_en: "Fluid in hydrology/hydraulics; design flows, flood paths, and water supply systems.",
        caution_note: ENGINEERING_CAUTION,
      },
      { context: "traveller", meaning_en: "Safe drinking water, bottled water, or asking where to get water." },
    ],
    examples: [
      { text: "I need clean drinking water.", language_code: "en", context_label: "Traveller" },
      { text: "Gusto ko ng tubig.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "WAW-ter", ipa: "/ˈwɔːtər/" },
    related_terms: ["drinking water", "tubig", "irrigation"],
    common_mistakes: ["Assuming all local water is safe to drink without checking."],
  },
  {
    id: "prod-curated-help",
    input_key: "help",
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
      { context: "traveller", meaning_en: "Asking locals for assistance with directions, transport, or safety." },
    ],
    examples: [
      { text: "I need help!", language_code: "en", context_label: "Emergency" },
      { text: "Tulungan mo ako.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "HELP", ipa: "/hɛlp/" },
    related_terms: ["assist", "aid", "support", "tulong"],
    common_mistakes: ["Using casual 'help' when formal 'assistance' is expected in official settings."],
  },
  {
    id: "prod-curated-road",
    input_key: "road",
    entry_type: "word",
    general_meaning_en: "A wide way leading from one place to another, especially for vehicles.",
    detailed_meaning_en:
      "Roads range from rural tracks to highways. In travel and fieldwork, asking for the nearest road is a common survival phrase.",
    target_meaning: "kalsada / daan",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en: "Paved or unpaved transport corridor with alignment, pavement, drainage, and traffic design considerations.",
        caution_note: ENGINEERING_CAUTION,
      },
      { context: "traveller", meaning_en: "Route to town, highway access, or nearest paved road." },
      {
        context: "construction_worker",
        meaning_en: "Haul road, access road, or temporary road on a construction site.",
        caution_note: ENGINEERING_CAUTION,
      },
    ],
    examples: [
      { text: "Where is the nearest main road?", language_code: "en", context_label: "Traveller" },
      { text: "Nasaan ang pinakamalapit na kalsada?", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "ROHD", ipa: "/roʊd/" },
    related_terms: ["highway", "street", "path", "kalsada"],
    common_mistakes: ["Confusing 'road' with 'street' in formal addressing contexts."],
  },
  {
    id: "prod-curated-price",
    input_key: "price",
    entry_type: "word",
    general_meaning_en: "The amount of money expected or required for something.",
    detailed_meaning_en:
      "Price is what a buyer pays. Related ideas include cost, fee, rate, and discount.",
    target_meaning: "presyo",
    profession_meanings: [
      { context: "business_owner", meaning_en: "Selling price, markup, wholesale vs retail price, and quoted rates." },
      { context: "traveller", meaning_en: "Asking how much something costs; bargaining may be culturally expected." },
    ],
    examples: [
      { text: "How much is the price?", language_code: "en", context_label: "Shopping" },
      { text: "Magkano po ito?", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "PRYS", ipa: "/praɪs/" },
    related_terms: ["cost", "fee", "rate", "magkano"],
    common_mistakes: ["Using 'price' when 'cost' (to the seller) is meant in accounting contexts."],
  },
  {
    id: "prod-curated-curate",
    input_key: "curate",
    entry_type: "word",
    general_meaning_en:
      "To select, organize, and present items such as art, content, or collections with care and judgment.",
    detailed_meaning_en:
      "To curate means to choose and arrange works or information for an exhibition, archive, website, or collection. It implies thoughtful selection rather than random gathering.",
    target_meaning: "mag-curate / pumili at ayusin",
    examples: [
      { text: "She curates the museum's modern art wing.", language_code: "en", context_label: "General" },
      { text: "Siya ang nag-curate ng modern art wing ng museo.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "kyoo-RAYT", ipa: "/kjʊˈreɪt/" },
    related_terms: ["curator", "curated", "collection", "exhibit"],
    usage_notes: ["Often used for museums, galleries, and digital content."],
    common_mistakes: ["Confusing 'curate' (select and organize) with 'create' (make something new)."],
  },
  {
    id: "prod-curated-curated",
    input_key: "curated",
    entry_type: "word",
    general_meaning_en: "Carefully chosen and arranged; selected with expert judgment.",
    detailed_meaning_en:
      "Describes a collection, list, or experience assembled deliberately rather than automatically generated.",
    target_meaning: "maingat na pinili",
    examples: [
      { text: "The shop sells curated vintage records.", language_code: "en", context_label: "General" },
    ],
    pronunciation: { simple: "kyoo-RAY-ted", ipa: "/kjʊˈreɪtɪd/" },
    related_terms: ["curate", "curator", "selection"],
    common_mistakes: ["Using 'curated' for any random list without intentional selection."],
  },
  {
    id: "prod-curated-curator",
    input_key: "curator",
    entry_type: "word",
    general_meaning_en: "A person who manages and organizes a collection, especially in a museum or gallery.",
    detailed_meaning_en:
      "A curator researches, acquires, preserves, and presents items in a collection, often writing labels and planning exhibitions.",
    target_meaning: "kurator / tagapangasiwa ng koleksyon",
    examples: [
      { text: "The curator prepared a new photography exhibit.", language_code: "en", context_label: "General" },
    ],
    pronunciation: { simple: "kyoo-RAY-ter", ipa: "/kjʊˈreɪtər/" },
    related_terms: ["curate", "museum", "exhibition"],
    common_mistakes: ["Assuming every gallery manager is formally titled 'curator'."],
  },
  {
    id: "prod-curated-definition",
    input_key: "definition",
    entry_type: "word",
    general_meaning_en: "A statement that explains the meaning of a word, phrase, or concept.",
    detailed_meaning_en:
      "A definition clarifies what something means, often by giving essential characteristics, scope, or examples.",
    target_meaning: "kahulugan / depinisyon",
    examples: [
      { text: "Look up the definition of that term.", language_code: "en", context_label: "General" },
      { text: "Hanapin ang kahulugan ng salitang iyon.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "def-uh-NISH-un", ipa: "/ˌdɛfɪˈnɪʃən/" },
    related_terms: ["meaning", "explain", "dictionary"],
    common_mistakes: ["Confusing a definition with an example sentence."],
  },
  {
    id: "prod-curated-translate",
    input_key: "translate",
    entry_type: "word",
    general_meaning_en: "To express the meaning of words or text in another language.",
    detailed_meaning_en:
      "To translate is to render source-language meaning into a target language while preserving sense, register, and context as far as possible.",
    target_meaning: "isalin / mag-translate",
    examples: [
      { text: "Can you translate this sentence into Tagalog?", language_code: "en", context_label: "General" },
      { text: "Maaari mo bang isalin ito sa Tagalog?", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "trans-LAYT", ipa: "/trænsˈleɪt/" },
    related_terms: ["translation", "interpret", "language"],
    common_mistakes: ["Treating word-for-word substitution as full translation."],
  },
  {
    id: "prod-curated-dialect",
    input_key: "dialect",
    entry_type: "word",
    general_meaning_en:
      "A regional or social variety of a language with distinct vocabulary, pronunciation, or grammar.",
    detailed_meaning_en:
      "A dialect is a form of a language associated with a place, community, or social group. Dialect differences are normal and do not imply incorrect speech.",
    target_meaning: "diyalekto / lokal na bersyon ng wika",
    examples: [
      { text: "Manila Tagalog differs slightly from provincial dialects.", language_code: "en", context_label: "General" },
    ],
    pronunciation: { simple: "DY-uh-lekt", ipa: "/ˈdaɪəlekt/" },
    related_terms: ["accent", "variety", "register"],
    common_mistakes: ["Calling a dialect a separate language without linguistic grounds."],
  },
  {
    id: "prod-curated-idiom",
    input_key: "idiom",
    entry_type: "idiom",
    general_meaning_en: "A phrase whose meaning is not predictable from the literal meanings of its words.",
    detailed_meaning_en:
      "Idioms are fixed expressions such as 'break the ice' or 'on the same page' whose figurative meaning must be learned as a unit.",
    target_meaning: "idioma / sawikain",
    examples: [
      { text: "It's raining cats and dogs.", language_code: "en", context_label: "Idiom" },
    ],
    pronunciation: { simple: "ID-ee-um", ipa: "/ˈɪdiəm/" },
    related_terms: ["phrase", "expression", "figurative language"],
    common_mistakes: ["Translating idioms word for word into another language."],
  },
  {
    id: "prod-curated-phrase",
    input_key: "phrase",
    entry_type: "phrase",
    general_meaning_en: "A small group of words that function together as a unit of meaning.",
    detailed_meaning_en:
      "A phrase may be shorter than a full sentence and can include idioms, collocations, or technical expressions.",
    target_meaning: "parirala / phrase",
    examples: [
      { text: "Learn useful travel phrases before your trip.", language_code: "en", context_label: "General" },
    ],
    pronunciation: { simple: "FRAYZ", ipa: "/freɪz/" },
    related_terms: ["expression", "sentence", "idiom"],
    common_mistakes: ["Confusing a phrase with a single word compound."],
  },
  {
    id: "prod-curated-technical",
    input_key: "technical",
    entry_type: "word",
    general_meaning_en: "Relating to a specialized field, method, or practical application.",
    detailed_meaning_en:
      "'Technical' describes language, skills, or problems tied to a profession or discipline such as engineering, medicine, or computing.",
    target_meaning: "teknikal / pang-teknikal",
    profession_meanings: [
      {
        context: "engineer",
        meaning_en: "Pertaining to engineering methods, standards, drawings, or calculations.",
        caution_note: ENGINEERING_CAUTION,
      },
    ],
    examples: [
      { text: "The manual uses technical vocabulary.", language_code: "en", context_label: "General" },
    ],
    pronunciation: { simple: "TEK-ni-kul", ipa: "/ˈtɛknɪkəl/" },
    related_terms: ["specialized", "professional", "terminology"],
    common_mistakes: ["Using technical terms with non-experts without explanation."],
  },
  {
    id: "prod-curated-doctor",
    input_key: "doctor",
    entry_type: "word",
    general_meaning_en: "A qualified medical professional; a person with a doctoral degree.",
    detailed_meaning_en:
      "'Doctor' most often means a physician. In academia it can mean someone with a doctorate. Context clarifies which sense applies.",
    target_meaning: "doktor",
    profession_meanings: [
      {
        context: "health_emergency",
        meaning_en: "Physician or clinician needed for medical care; not a substitute for emergency services instructions.",
        caution_note: "This is a language explanation, not medical advice.",
      },
      { context: "traveller", meaning_en: "Finding a clinic, hospital, or doctor while away from home." },
      { context: "student", meaning_en: "Title for PhD holders or medical doctors in academic settings." },
    ],
    examples: [
      { text: "I need a doctor.", language_code: "en", context_label: "Medical" },
      { text: "Kailangan ko ng doktor.", language_code: "tl", context_label: "Target language" },
    ],
    pronunciation: { simple: "DOK-ter", ipa: "/ˈdɒktər/" },
    related_terms: ["physician", "clinic", "hospital", "doktor"],
    common_mistakes: ["Assuming every 'doctor' title means a practicing physician."],
  },
];

export function findCuratedEntry(inputText: string): CuratedSeedEntry | undefined {
  return findSeedByInputKey(CURATED_DICTIONARY_ENTRIES, inputText);
}

export function resolveCuratedDictionaryEntry(
  query: DictionaryQuery,
): DictionaryEntry | null {
  const seed = findCuratedEntry(query.input_text);
  if (!seed) return null;
  return buildEntryFromCurated(seed, query);
}
