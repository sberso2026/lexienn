import type { GlossarySeedEntry } from "@/lib/dictionary/normalizeDictionaryEntry";

const NO_EXACT_EQUIVALENT =
  "No exact direct equivalent exists. Practitioners often use the English technical term on site.";

const ENGINEERING_CAUTION =
  "This is a language explanation, not professional design advice.";

type EngGlossaryInput = {
  id: string;
  input_key: string;
  general_meaning_en: string;
  detailed_meaning_en: string;
  technical_meaning_en: string;
  target_meaning: string;
  en_example: string;
  tl_example: string;
  related_terms: string[];
  common_mistakes?: string[];
  closest_local_equivalent_note?: string;
};

function engEntry(input: EngGlossaryInput): GlossarySeedEntry {
  return {
    id: input.id,
    input_key: input.input_key,
    entry_type: "technical_term",
    general_meaning_en: input.general_meaning_en,
    detailed_meaning_en: input.detailed_meaning_en,
    technical_meaning_en: input.technical_meaning_en,
    target_meaning: input.target_meaning,
    closest_local_equivalent_note:
      input.closest_local_equivalent_note ?? NO_EXACT_EQUIVALENT,
    related_terms: input.related_terms,
    common_mistakes: input.common_mistakes ?? [],
    validation_status: "curated",
    confidence_score: 0.95,
    examples: [
      {
        text: input.en_example,
        language_code: "en",
        context_label: "Engineering",
      },
      {
        text: input.tl_example,
        language_code: "tl",
        context_label: "Filipino / Tagalog",
      },
    ],
    pronunciation: { simple: input.input_key.toUpperCase() },
    usage_notes: [ENGINEERING_CAUTION],
  };
}

/** Batch 38 engineering glossary entries — multi-word phrases with Tagalog examples. */
export const ENGINEERING_GLOSSARY_EXTENDED_ENTRIES: GlossarySeedEntry[] = [
  engEntry({
    id: "prod-glossary-tie-beam",
    input_key: "tie beam",
    general_meaning_en:
      "A tie beam is a horizontal structural member that connects columns, walls, rafters, trusses, or foundation elements to resist separation, improve stability, and transfer forces between connected members.",
    detailed_meaning_en:
      "Tie beams link supports so they act together under lateral or vertical load. They may resist tension, compression, bending, and lateral effects depending on the structural system.",
    technical_meaning_en:
      "In building and foundation work, a tie beam connects isolated footings, columns, pile caps, or wall supports so they act together and reduce differential movement. It may resist tension, compression, bending, and lateral effects depending on the structural system.",
    target_meaning: "biga na pangtali / tie beam",
    en_example: "The tie beam connects the two column footings.",
    tl_example: "Ikinokonekta ng tie beam ang dalawang pundasyon ng haligi.",
    related_terms: [
      "beam",
      "grade beam",
      "plinth beam",
      "footing tie beam",
      "column",
      "footing",
      "foundation",
    ],
    common_mistakes: [
      "Confusing a tie beam with a grade beam or plinth beam without checking its structural role.",
    ],
  }),
  engEntry({
    id: "prod-glossary-grade-beam",
    input_key: "grade beam",
    general_meaning_en:
      "A horizontal concrete beam placed at or near ground level to tie footings or walls together.",
    detailed_meaning_en:
      "Grade beams span between footings or pile caps at grade, helping distribute loads and stiffen the foundation system against differential movement.",
    technical_meaning_en:
      "A reinforced concrete tie element at or near finished grade connecting shallow or deep foundation elements to improve load sharing and reduce differential settlement.",
    target_meaning: "grade beam / biga sa antas ng lupa",
    en_example: "The grade beam ties the isolated footings together.",
    tl_example: "Pinagsasama ng grade beam ang mga hiwalay na footing.",
    related_terms: ["tie beam", "footing", "plinth beam", "ground beam", "foundation"],
  }),
  engEntry({
    id: "prod-glossary-plinth-beam",
    input_key: "plinth beam",
    general_meaning_en:
      "A beam at the base of a wall or column, often at plinth level, that distributes load or ties supports.",
    detailed_meaning_en:
      "Plinth beams run at the base of masonry or framed walls to spread wall loads, reduce cracking, and connect columns or footings at plinth level.",
    technical_meaning_en:
      "A reinforced concrete beam at plinth or pedestal level tying wall or column supports and improving load distribution at the base of the superstructure.",
    target_meaning: "plinth beam / biga sa plinth",
    en_example: "The plinth beam runs along the base of the masonry wall.",
    tl_example: "Dumadaan ang plinth beam sa ibaba ng pader na masonry.",
    related_terms: ["grade beam", "tie beam", "ring beam", "column", "footing"],
  }),
  engEntry({
    id: "prod-glossary-footing-tie-beam",
    input_key: "footing tie beam",
    general_meaning_en:
      "A tie beam specifically connecting footings or pile caps in a foundation system.",
    detailed_meaning_en:
      "Footing tie beams link adjacent footings so unbalanced loads and lateral effects are shared across the foundation grid.",
    technical_meaning_en:
      "A foundation-level tie element connecting isolated or combined footings to reduce differential movement and improve structural unity under lateral and gravity loads.",
    target_meaning: "footing tie beam / biga na pangtali ng footing",
    en_example: "The footing tie beam was cast with the pile caps.",
    tl_example: "Inihalo ang footing tie beam kasama ng mga pile cap.",
    related_terms: ["tie beam", "grade beam", "footing", "isolated footing", "combined footing"],
  }),
  engEntry({
    id: "prod-glossary-ground-beam",
    input_key: "ground beam",
    general_meaning_en:
      "A beam constructed at or near ground level, often part of a foundation or basement system.",
    detailed_meaning_en:
      "Ground beams connect pad foundations, support walls, or span over soft zones while remaining close to natural or finished ground level.",
    technical_meaning_en:
      "A reinforced concrete beam at ground level linking foundation elements, sometimes used in suspended ground-floor or piled raft systems.",
    target_meaning: "ground beam / biga sa lupa",
    en_example: "Ground beams were used between the pad footings.",
    tl_example: "Ginamit ang ground beams sa pagitan ng mga pad footing.",
    related_terms: ["grade beam", "tie beam", "footing", "slab on grade"],
  }),
  engEntry({
    id: "prod-glossary-column",
    input_key: "column",
    general_meaning_en:
      "A vertical structural member that carries compressive loads from beams, slabs, or roofs down to foundations.",
    detailed_meaning_en:
      "Columns transfer axial load and may resist bending from lateral forces. They are critical nodes in gravity and seismic load paths.",
    technical_meaning_en:
      "A primary vertical load-bearing member designed for axial compression, moment, and shear as required by the framing system and code combinations.",
    target_meaning: "haligi / column",
    en_example: "The column rests on a reinforced concrete footing.",
    tl_example: "Nakapatong ang haligi sa reinforced concrete footing.",
    related_terms: ["beam", "footing", "foundation", "shear wall", "tie beam"],
  }),
  engEntry({
    id: "prod-glossary-isolated-footing",
    input_key: "isolated footing",
    general_meaning_en:
      "A separate footing supporting a single column or post.",
    detailed_meaning_en:
      "Isolated footings spread one column load into the soil. They are common where column spacing is regular and soil capacity is adequate.",
    technical_meaning_en:
      "A shallow pad footing sized for one column load, bending, and punching shear checks against bearing capacity and settlement limits.",
    target_meaning: "isolated footing / hiwalay na footing",
    en_example: "Each column has its own isolated footing.",
    tl_example: "Bawat haligi ay may sariling isolated footing.",
    related_terms: ["footing", "combined footing", "tie beam", "bearing capacity", "column"],
  }),
  engEntry({
    id: "prod-glossary-combined-footing",
    input_key: "combined footing",
    general_meaning_en:
      "One footing supporting two or more columns or walls.",
    detailed_meaning_en:
      "Combined footings are used when columns are close together or near property lines, sharing a common concrete pad.",
    technical_meaning_en:
      "A single shallow foundation element proportioned for combined column loads, longitudinal bending, and soil bearing under multiple supports.",
    target_meaning: "combined footing / pinagsamang footing",
    en_example: "A combined footing supports the two adjacent columns.",
    tl_example: "Sinusuportahan ng combined footing ang dalawang magkatabing haligi.",
    related_terms: ["isolated footing", "footing", "mat foundation", "tie beam"],
  }),
  engEntry({
    id: "prod-glossary-mat-foundation",
    input_key: "mat foundation",
    general_meaning_en:
      "A large continuous concrete slab that supports many columns or walls, also called a raft foundation.",
    detailed_meaning_en:
      "Mat foundations distribute building loads over a wide area, useful on weak or variable soils where isolated footings would overlap or settle unevenly.",
    technical_meaning_en:
      "A thick reinforced concrete raft designed as a plate or grillage to control bearing pressure and differential settlement across the building footprint.",
    target_meaning: "mat foundation / raft foundation",
    en_example: "The tower sits on a mat foundation over soft clay.",
    tl_example: "Nakatayo ang tore sa mat foundation sa malambot na lupa.",
    related_terms: ["foundation", "footing", "bearing capacity", "settlement", "slab"],
  }),
  engEntry({
    id: "prod-glossary-slab",
    input_key: "slab",
    general_meaning_en:
      "A flat horizontal plate of concrete that forms floors, roofs, or pavements.",
    detailed_meaning_en:
      "Slabs carry gravity loads to beams, walls, or columns. They may be one-way, two-way, flat, or post-tensioned depending on span and use.",
    technical_meaning_en:
      "A reinforced concrete plate element designed for flexure, shear, deflection, and crack control under dead and live loads.",
    target_meaning: "slab / plataporma ng sahig",
    en_example: "The floor slab spans between the beams.",
    tl_example: "Ang floor slab ay sumasaklaw sa pagitan ng mga biga.",
    related_terms: ["slab on grade", "beam", "reinforcement", "live load", "dead load"],
  }),
  engEntry({
    id: "prod-glossary-slab-on-grade",
    input_key: "slab on grade",
    general_meaning_en:
      "A concrete slab cast directly on the ground without a suspended floor system.",
    detailed_meaning_en:
      "Slabs on grade are common for ground floors, pavements, and industrial floors. They require subgrade preparation and joint detailing.",
    technical_meaning_en:
      "A ground-supported concrete slab designed for soil support, shrinkage, curling, and load transfer without a structural void below.",
    target_meaning: "slab on grade / slab sa lupa",
    en_example: "The warehouse uses a slab on grade with control joints.",
    tl_example: "Gumagamit ang bodega ng slab on grade na may control joints.",
    related_terms: ["slab", "ground beam", "footing", "settlement"],
  }),
  engEntry({
    id: "prod-glossary-retaining-wall",
    input_key: "retaining wall",
    general_meaning_en:
      "A wall that holds back soil or other material and resists lateral earth pressure.",
    detailed_meaning_en:
      "Retaining walls may be gravity, cantilever, or anchored. Drainage and sliding/overturning stability are key design concerns.",
    technical_meaning_en:
      "A structural wall resisting lateral earth pressure through weight, flexure, or tiebacks while meeting sliding, overturning, and bearing checks.",
    target_meaning: "retaining wall / pader na pangharang ng lupa",
    en_example: "The retaining wall supports the road embankment.",
    tl_example: "Sinusuportahan ng retaining wall ang tambak ng kalsada.",
    related_terms: ["shear wall", "foundation", "footing", "bearing capacity"],
  }),
  engEntry({
    id: "prod-glossary-shear-wall",
    input_key: "shear wall",
    general_meaning_en:
      "A wall designed to resist lateral forces such as wind or earthquake through in-plane shear.",
    detailed_meaning_en:
      "Shear walls stiffen buildings and carry lateral loads to foundations. They often work with diaphragms and collectors.",
    technical_meaning_en:
      "A vertical lateral-force-resisting element designed for in-plane shear, axial load, and overturning under wind or seismic load combinations.",
    target_meaning: "shear wall / pader na pang-shear",
    en_example: "Shear walls around the stair core resist seismic load.",
    tl_example: "Ang shear walls sa paligid ng hagdan ay sumasalungat sa seismic load.",
    related_terms: ["seismic load", "wind load", "column", "foundation", "diaphragm"],
  }),
  engEntry({
    id: "prod-glossary-lintel-beam",
    input_key: "lintel beam",
    general_meaning_en:
      "A short beam spanning an opening such as a door or window in a wall.",
    detailed_meaning_en:
      "Lintels support masonry or cladding above openings. They may be steel, precast, or reinforced concrete.",
    technical_meaning_en:
      "A flexural member over a wall opening designed for load from the wall above plus applicable live or cladding loads.",
    target_meaning: "lintel / lintel beam",
    en_example: "A reinforced concrete lintel beam spans the window opening.",
    tl_example: "May reinforced concrete lintel beam sa bukana ng bintana.",
    related_terms: ["beam", "column", "retaining wall", "reinforcement"],
  }),
  engEntry({
    id: "prod-glossary-ring-beam",
    input_key: "ring beam",
    general_meaning_en:
      "A continuous horizontal beam tying a building perimeter or circular structure together.",
    detailed_meaning_en:
      "Ring beams improve stability by connecting walls or columns in a closed loop, often used at roof or plinth level.",
    technical_meaning_en:
      "A closed-loop tie beam providing circumferential restraint and load distribution in tanks, domes, or masonry structures.",
    target_meaning: "ring beam / biga na pambilog",
    en_example: "The ring beam ties the top of the masonry walls together.",
    tl_example: "Pinagsasama ng ring beam ang tuktok ng mga pader na masonry.",
    related_terms: ["tie beam", "plinth beam", "grade beam", "beam"],
  }),
  engEntry({
    id: "prod-glossary-differential-settlement",
    input_key: "differential settlement",
    general_meaning_en:
      "Unequal vertical movement between different parts of a foundation or structure.",
    detailed_meaning_en:
      "Differential settlement can crack finishes, bind doors, and damage structural elements if not controlled by foundation design.",
    technical_meaning_en:
      "Relative settlement between foundation points exceeding serviceability limits, often driving raft, pile, or tie-beam solutions.",
    target_meaning: "differential settlement / di-pantay na settlement",
    en_example: "Tie beams help limit differential settlement between footings.",
    tl_example: "Tumutulong ang tie beams na limitahan ang differential settlement sa pagitan ng mga footing.",
    related_terms: ["settlement", "footing", "mat foundation", "tie beam", "bearing capacity"],
  }),
  engEntry({
    id: "prod-glossary-reinforcement",
    input_key: "reinforcement",
    general_meaning_en:
      "Steel bars or mesh embedded in concrete to resist tension and control cracking.",
    detailed_meaning_en:
      "Reinforcement works with concrete in composite action. Layout, cover, development length, and splices must meet code requirements.",
    technical_meaning_en:
      "Deformed steel bars, welded wire fabric, or strands placed in concrete members to provide tensile capacity, shear resistance, and ductility.",
    target_meaning: "bakal na pampalakas / reinforcement",
    en_example: "Main reinforcement runs along the bottom of the beam.",
    tl_example: "Ang main reinforcement ay dumadaan sa ilalim ng biga.",
    related_terms: ["rebar", "stirrup", "concrete cover", "development length", "lap splice"],
  }),
  engEntry({
    id: "prod-glossary-stirrup",
    input_key: "stirrup",
    general_meaning_en:
      "Closed or U-shaped reinforcement that resists shear in beams and columns.",
    detailed_meaning_en:
      "Stirrups wrap around main longitudinal bars and are spaced closer near supports where shear is highest.",
    technical_meaning_en:
      "Transverse reinforcement providing shear capacity and confinement, detailed with spacing, hooks, and leg count per structural drawings.",
    target_meaning: "stirrup / bakal na pang-shear",
    en_example: "Stirrups are spaced at 150 mm near the beam support.",
    tl_example: "Ang stirrups ay naka-spacing na 150 mm malapit sa suporta ng biga.",
    related_terms: ["rebar", "reinforcement", "shear force", "beam", "column"],
  }),
  engEntry({
    id: "prod-glossary-rebar",
    input_key: "rebar",
    general_meaning_en:
      "Steel reinforcing bar used in reinforced concrete construction.",
    detailed_meaning_en:
      "Rebar comes in various diameters and grades. It must be placed per drawings with correct cover, laps, and anchorage.",
    technical_meaning_en:
      "Deformed steel reinforcement conforming to material standards, sized and scheduled for flexural, shear, and temperature-shrinkage requirements.",
    target_meaning: "bakal na pampalakas / rebar",
    en_example: "Workers placed rebar before the footing pour.",
    tl_example: "Inilagay ng mga trabahador ang rebar bago ang pagbuhos ng footing.",
    related_terms: ["reinforcement", "stirrup", "concrete cover", "development length", "lap splice"],
  }),
  engEntry({
    id: "prod-glossary-concrete-cover",
    input_key: "concrete cover",
    general_meaning_en:
      "The distance from the concrete surface to the nearest reinforcement.",
    detailed_meaning_en:
      "Adequate cover protects steel from corrosion and fire. Cover requirements depend on exposure and code.",
    technical_meaning_en:
      "Specified clear distance between the outer concrete face and reinforcement centroid or bar surface for durability and fire rating.",
    target_meaning: "concrete cover / lapis ng konkreto",
    en_example: "Coastal exposure required increased concrete cover.",
    tl_example: "Kailangan ng mas makapal na concrete cover dahil sa coastal exposure.",
    related_terms: ["rebar", "reinforcement", "durability", "footing", "slab"],
  }),
  engEntry({
    id: "prod-glossary-development-length",
    input_key: "development length",
    general_meaning_en:
      "The length of bar embedment needed to develop full design stress in reinforcement.",
    detailed_meaning_en:
      "If development length is insufficient, bars can slip before reaching design strength at critical sections.",
    technical_meaning_en:
      "Required anchorage length computed from bond stress, bar diameter, concrete strength, and coating condition per code provisions.",
    target_meaning: "development length / haba ng pagkakabit ng bakal",
    en_example: "Check development length at the beam-column joint.",
    tl_example: "Suriin ang development length sa joint ng biga at haligi.",
    related_terms: ["rebar", "lap splice", "reinforcement", "beam", "column"],
  }),
  engEntry({
    id: "prod-glossary-lap-splice",
    input_key: "lap splice",
    general_meaning_en:
      "The overlap of two reinforcing bars so force transfers from one bar to the next.",
    detailed_meaning_en:
      "Lap lengths depend on bar size, concrete strength, and whether bars are top or bottom in a member.",
    technical_meaning_en:
      "Overlapped bar length providing bond transfer between discontinuous reinforcement, detailed per structural notes and code tables.",
    target_meaning: "lap splice / pagdugtong ng bakal",
    en_example: "The lap splice length was marked on the footing drawing.",
    tl_example: "Nakamarka sa drawing ng footing ang lap splice length.",
    related_terms: ["rebar", "development length", "reinforcement", "footing", "beam"],
  }),
];
