import {
  buildEntryFromCurated,
  findSeedByInputKey,
  type CuratedSeedEntry,
} from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";

function seed(
  entry: CuratedSeedEntry & { confidence_score?: number },
): CuratedSeedEntry {
  return {
    ...entry,
    validation_status: entry.validation_status ?? "curated",
    confidence_score: entry.confidence_score ?? 0.88,
  };
}

/** Built-in common English technical and general vocabulary — no AI required. */
export const COMMON_SEED_DICTIONARY_ENTRIES: CuratedSeedEntry[] = [
  seed({
    id: "seed-copious",
    input_key: "copious",
    entry_type: "word",
    general_meaning_en:
      "Copious means abundant in quantity or supply; more than enough.",
    detailed_meaning_en:
      "Use copious to describe large amounts of something, such as copious notes, copious rainfall, or copious documentation on a project.",
    target_meaning: "masagana / marami",
    examples: [
      {
        text: "The inspector left copious notes on the concrete pour.",
        language_code: "en",
        context_label: "General",
      },
      {
        text: "Nag-iwan ang inspektor ng maraming tala tungkol sa pagbuhos ng kongkreto.",
        language_code: "tl",
        context_label: "Filipino / Tagalog",
      },
    ],
    pronunciation: { simple: "KOH-pee-us", ipa: "/ˈkoʊpiəs/" },
    related_terms: ["abundant", "plentiful", "ample", "extensive"],
  }),
  seed({
    id: "seed-acceleration",
    input_key: "acceleration",
    entry_type: "word",
    general_meaning_en:
      "Acceleration is the rate at which velocity changes over time.",
    detailed_meaning_en:
      "In physics and engineering, acceleration describes how quickly speed or direction changes, commonly measured in metres per second squared (m/s²).",
    target_meaning: "pagbilis / pagtaas ng bilis",
    examples: [
      {
        text: "The car's acceleration increased as it moved down the road.",
        language_code: "en",
        context_label: "General",
      },
      {
        text: "Tumataas ang pagbilis ng kotse habang bumababa ito sa kalsada.",
        language_code: "tl",
        context_label: "Filipino / Tagalog",
      },
    ],
    pronunciation: { simple: "ak-SEL-uh-RAY-shun", ipa: "/əkˌsɛləˈreɪʃən/" },
    related_terms: ["velocity", "speed", "force", "motion"],
  }),
  seed({
    id: "seed-velocity",
    input_key: "velocity",
    entry_type: "word",
    general_meaning_en:
      "Velocity is speed in a particular direction, including both magnitude and direction of motion.",
    detailed_meaning_en:
      "In physics, velocity differs from speed because it is a vector quantity. Engineers use velocity when analysing motion, fluid flow, and structural dynamics.",
    target_meaning: "bilis / velocity",
    examples: [
      {
        text: "Wind velocity increased near the ridge of the roof.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "vuh-LOS-i-tee", ipa: "/vəˈlɒsəti/" },
    related_terms: ["speed", "acceleration", "motion", "vector"],
  }),
  seed({
    id: "seed-force",
    input_key: "force",
    entry_type: "word",
    general_meaning_en:
      "Force is a push or pull that can change an object's motion, shape, or direction.",
    detailed_meaning_en:
      "In mechanics, force is measured in newtons and is central to statics, dynamics, and structural design. Multiple forces combine through vector addition.",
    target_meaning: "puwersa / lakas",
    examples: [
      {
        text: "The beam must resist the vertical force from the floor load.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "FORSS", ipa: "/fɔːrs/" },
    related_terms: ["load", "stress", "pressure", "moment"],
  }),
  seed({
    id: "seed-mass",
    input_key: "mass",
    entry_type: "word",
    general_meaning_en:
      "Mass is the amount of matter in an object, often measured in kilograms.",
    detailed_meaning_en:
      "Mass is distinct from weight. In engineering calculations, mass affects inertia, dynamic response, and dead load when combined with gravity.",
    target_meaning: "masa",
    examples: [
      {
        text: "The total mass of the equipment was added to the load calculation.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "MASS", ipa: "/mæs/" },
    related_terms: ["weight", "density", "load", "inertia"],
  }),
  seed({
    id: "seed-stress",
    input_key: "stress",
    entry_type: "word",
    general_meaning_en:
      "Stress is internal force per unit area within a material under load.",
    detailed_meaning_en:
      "In structural and materials engineering, stress (often in MPa or psi) helps assess whether a member can safely carry load without failure or excessive deformation.",
    target_meaning: "stress / tensiyon sa materyal",
    examples: [
      {
        text: "High stress at the notch may initiate cracking.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "STRESS", ipa: "/strɛs/" },
    related_terms: ["strain", "load", "pressure", "fatigue"],
  }),
  seed({
    id: "seed-strain",
    input_key: "strain",
    entry_type: "word",
    general_meaning_en:
      "Strain is a measure of deformation, usually expressed as a change in length relative to the original length.",
    detailed_meaning_en:
      "Engineers use strain to describe how much a material stretches or compresses under stress. It is dimensionless or expressed in microstrain (με).",
    target_meaning: "strain / pagunat",
    examples: [
      {
        text: "Strain gauges were installed to monitor deformation during the test.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "STRAYN", ipa: "/streɪn/" },
    related_terms: ["stress", "deformation", "elasticity", "modulus"],
  }),
  seed({
    id: "seed-pressure",
    input_key: "pressure",
    entry_type: "word",
    general_meaning_en:
      "Pressure is force applied perpendicular to a surface, divided by the area of that surface.",
    detailed_meaning_en:
      "Pressure appears in fluid systems, soil mechanics, and weather. Units include pascals (Pa), kilopascals (kPa), and pounds per square inch (psi).",
    target_meaning: "presyon",
    examples: [
      {
        text: "Water pressure at the base of the tank was higher than expected.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "PRESH-er", ipa: "/ˈprɛʃər/" },
    related_terms: ["force", "stress", "fluid", "load"],
  }),
  seed({
    id: "seed-temperature",
    input_key: "temperature",
    entry_type: "word",
    general_meaning_en:
      "Temperature measures how hot or cold something is, usually in degrees Celsius or Fahrenheit.",
    detailed_meaning_en:
      "In engineering, temperature affects material properties, thermal expansion, curing of concrete, and equipment performance. Thermal stress can cause cracking.",
    target_meaning: "temperatura",
    examples: [
      {
        text: "Temperature changes caused expansion joints to move.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "TEM-pruh-chur", ipa: "/ˈtɛmprətʃər/" },
    related_terms: ["thermal", "expansion", "heat", "concrete"],
  }),
  seed({
    id: "seed-corrosion",
    input_key: "corrosion",
    entry_type: "word",
    general_meaning_en:
      "Corrosion is the gradual destruction of a material, especially metal, by chemical or electrochemical reaction with its environment.",
    detailed_meaning_en:
      "In construction and infrastructure, corrosion reduces steel area, weakens connections, and can cause staining or spalling in reinforced concrete.",
    target_meaning: "kalawang / corrosion",
    examples: [
      {
        text: "Corrosion was found on exposed reinforcement near the coast.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "kuh-ROH-zhun", ipa: "/kəˈroʊʒən/" },
    related_terms: ["rust", "steel", "durability", "inspection"],
  }),
  seed({
    id: "seed-vibration",
    input_key: "vibration",
    entry_type: "word",
    general_meaning_en:
      "Vibration is rapid back-and-forth movement of an object or structure.",
    detailed_meaning_en:
      "Excessive vibration can damage equipment, loosen fasteners, and cause fatigue in structures. Engineers analyse natural frequency and damping.",
    target_meaning: "panginginig / vibration",
    examples: [
      {
        text: "Vibration from the machine was felt on the upper floor.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "vy-BRAY-shun", ipa: "/vaɪˈbreɪʃən/" },
    related_terms: ["frequency", "damping", "fatigue", "dynamics"],
  }),
  seed({
    id: "seed-fatigue",
    input_key: "fatigue",
    entry_type: "word",
    general_meaning_en:
      "Fatigue is weakening of a material caused by repeated loading over time.",
    detailed_meaning_en:
      "Fatigue failure can occur below the static strength of a member. Cyclic loads in bridges, machinery, and welds require fatigue assessment.",
    target_meaning: "pagkapagod ng materyal / fatigue",
    examples: [
      {
        text: "Fatigue cracks appeared after years of cyclic traffic loading.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "fuh-TEEG", ipa: "/fəˈtiːɡ/" },
    related_terms: ["crack", "load", "cycle", "inspection"],
  }),
  seed({
    id: "seed-cracking",
    input_key: "cracking",
    entry_type: "word",
    general_meaning_en:
      "Cracking is the formation of splits or fractures in a material such as concrete, masonry, or metal.",
    detailed_meaning_en:
      "Cracks may result from shrinkage, thermal movement, overloading, settlement, or corrosion. Width, pattern, and location guide diagnosis.",
    target_meaning: "pagbitak / bitak",
    examples: [
      {
        text: "Cracking along the wall followed a stair-step pattern.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "KRAK-ing", ipa: "/ˈkrækɪŋ/" },
    related_terms: ["microcracking", "shrinkage", "inspection", "durability"],
  }),
  seed({
    id: "seed-microcracking",
    input_key: "microcracking",
    entry_type: "technical_term",
    general_meaning_en:
      "Microcracking refers to very small cracks that may not be easily visible without magnification or inspection.",
    detailed_meaning_en:
      "In concrete, welds, coatings, or composites, microcracking can indicate early-stage damage, shrinkage, thermal stress, or material degradation.",
    target_meaning: "maliliit na bitak / microcracking",
    examples: [
      {
        text: "Microcracking was observed near the repaired concrete surface.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "MY-kroh-kraking", ipa: "/ˈmaɪkroʊˌkrækɪŋ/" },
    related_terms: ["crack", "concrete", "fatigue", "inspection"],
  }),
  seed({
    id: "seed-inspection",
    input_key: "inspection",
    entry_type: "word",
    general_meaning_en:
      "Inspection is a careful examination to check condition, quality, or compliance.",
    detailed_meaning_en:
      "Site and structural inspections document defects, verify workmanship, and support maintenance or safety decisions. Reports often include photos and measurements.",
    target_meaning: "inspeksyon / pagsusuri",
    examples: [
      {
        text: "A visual inspection was carried out before handover.",
        language_code: "en",
        context_label: "General",
      },
    ],
    pronunciation: { simple: "in-SPEK-shun", ipa: "/ɪnˈspɛkʃən/" },
    related_terms: ["survey", "audit", "quality", "maintenance"],
  }),
  seed({
    id: "seed-translation",
    input_key: "translation",
    entry_type: "word",
    general_meaning_en:
      "Translation is the process of expressing the meaning of text or speech in another language.",
    detailed_meaning_en:
      "Good translation considers context, register, and cultural nuance. Technical translation also requires domain accuracy.",
    target_meaning: "salin / pagsasalin",
    examples: [
      {
        text: "The translation should match the engineer's intended meaning.",
        language_code: "en",
        context_label: "General",
      },
    ],
    pronunciation: { simple: "trans-LAY-shun", ipa: "/trænsˈleɪʃən/" },
    related_terms: ["language", "interpretation", "definition", "dictionary"],
  }),
  seed({
    id: "seed-definition",
    input_key: "definition",
    entry_type: "word",
    general_meaning_en:
      "A definition is a statement that explains the meaning of a word, phrase, or concept.",
    detailed_meaning_en:
      "Dictionary definitions may include general meaning, technical sense, examples, and related terms. Clear definitions support learning across languages.",
    target_meaning: "kahulugan / depinisyon",
    examples: [
      {
        text: "Read the definition before using the term on site.",
        language_code: "en",
        context_label: "General",
      },
    ],
    pronunciation: { simple: "def-uh-NISH-un", ipa: "/ˌdɛfɪˈnɪʃən/" },
    related_terms: ["meaning", "dictionary", "translation", "term"],
  }),
  seed({
    id: "seed-language",
    input_key: "language",
    entry_type: "word",
    general_meaning_en:
      "Language is a structured system of communication used by people in speech and writing.",
    detailed_meaning_en:
      "Languages vary by vocabulary, grammar, and dialect. Lexienn helps explain English terms and translate or define them for local languages.",
    target_meaning: "wika",
    examples: [
      {
        text: "Choose the target language before you translate.",
        language_code: "en",
        context_label: "General",
      },
    ],
    pronunciation: { simple: "LANG-gwij", ipa: "/ˈlæŋɡwɪdʒ/" },
    related_terms: ["dialect", "translation", "dictionary", "speech"],
  }),
  seed({
    id: "seed-dictionary",
    input_key: "dictionary",
    entry_type: "word",
    general_meaning_en:
      "A dictionary is a reference book or tool that lists words with their meanings, pronunciation, and usage.",
    detailed_meaning_en:
      "Dictionaries may be general, bilingual, or specialized for fields such as engineering or medicine. Lexienn combines curated entries, glossaries, and AI assistance.",
    target_meaning: "diksyunaryo",
    examples: [
      {
        text: "Check the dictionary entry for the technical term first.",
        language_code: "en",
        context_label: "General",
      },
    ],
    pronunciation: { simple: "DIK-shuh-ner-ee", ipa: "/ˈdɪkʃəˌnɛri/" },
    related_terms: ["definition", "glossary", "translation", "vocabulary"],
  }),
];

export function resolveCommonSeedDictionaryEntry(
  query: DictionaryQuery,
): DictionaryEntry | null {
  const seedEntry = findSeedByInputKey(
    COMMON_SEED_DICTIONARY_ENTRIES,
    query.input_text,
  );
  if (!seedEntry) return null;
  return buildEntryFromCurated(seedEntry, query);
}
