import {
  buildEntryFromGlossary,
  findSeedByInputKey,
  type GlossarySeedEntry,
} from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";

const NO_EXACT_EQUIVALENT =
  "No exact direct equivalent exists. Practitioners often use the English technical term on site.";

export const ENGINEERING_GLOSSARY_ENTRIES: GlossarySeedEntry[] = [
  {
    id: "prod-glossary-deep-beam",
    input_key: "deep beam",
    entry_type: "technical_term",
    general_meaning_en:
      "A short, stocky beam where loads do not follow simple bending patterns.",
    detailed_meaning_en:
      "A structural member with a relatively small span-to-depth ratio where load transfer is governed mainly by compression strut and tension tie action rather than ordinary flexural beam theory.",
    technical_meaning_en:
      "A structural member with a relatively small span-to-depth ratio where load transfer is governed mainly by compression strut and tension tie action rather than ordinary flexural beam theory.",
    target_meaning: "deep beam (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: [
      "shallow beam",
      "strut-and-tie model",
      "compression strut",
      "tension tie",
      "disturbed region",
      "span-to-depth ratio",
    ],
    common_mistakes: [
      "Designing a deep beam using elementary beam theory without strut-and-tie or deep-beam provisions.",
      "Confusing 'deep beam' with 'deep foundation'.",
    ],
    examples: [
      {
        text: "Transfer girders over large openings often behave as deep beams.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
    pronunciation: { simple: "DEEP BEEM", ipa: "/diːp biːm/" },
  },
  {
    id: "prod-glossary-shallow-beam",
    input_key: "shallow beam",
    entry_type: "technical_term",
    general_meaning_en: "A beam that is relatively long compared with its depth.",
    detailed_meaning_en:
      "A beam with a larger span-to-depth ratio where flexural behavior and classical beam theory are usually appropriate for preliminary analysis.",
    technical_meaning_en:
      "A flexure-dominated member where ordinary beam theory (shear, moment, deflection) is typically valid when span-to-depth ratio is large enough.",
    target_meaning: "shallow beam (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["deep beam", "span-to-depth ratio", "bending moment"],
    common_mistakes: [
      "Treating a shallow beam as a deep beam without checking span-to-depth ratio.",
    ],
    pronunciation: { simple: "SHAL-oh BEEM" },
    examples: [
      {
        text: "Floor joists are usually analyzed as shallow beams.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-shear-span",
    input_key: "shear span",
    entry_type: "technical_term",
    general_meaning_en: "The distance over which shear is transferred to a support.",
    detailed_meaning_en:
      "In beam and deep-beam design, the shear span is the distance between the load application and the reaction where shear transfer is critical, often influencing strut inclination.",
    technical_meaning_en:
      "The horizontal distance between a concentrated load and the nearest support where shear transfer governs behavior in disturbed regions.",
    target_meaning: "shear span (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["deep beam", "shear stress", "strut-and-tie model"],
    common_mistakes: ["Confusing shear span with total span length."],
    pronunciation: { simple: "SHEER SPAN" },
    examples: [
      {
        text: "A shorter shear span increases diagonal compression demand.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-span-to-depth-ratio",
    input_key: "span-to-depth ratio",
    entry_type: "technical_term",
    general_meaning_en: "How long a member is compared with how deep it is.",
    detailed_meaning_en:
      "Span-to-depth ratio compares clear span to member depth. Small ratios often indicate deep-beam behavior; larger ratios suggest flexure-dominated shallow beams.",
    technical_meaning_en:
      "The ratio of member span to depth used to classify flexure-dominated versus strut-and-tie dominated members.",
    target_meaning: "span-to-depth ratio (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["deep beam", "shallow beam", "disturbed region"],
    common_mistakes: [
      "Using overall building height instead of member clear span in the ratio.",
    ],
    pronunciation: { simple: "SPAN tuh DEPTH RAY-shee-oh" },
    examples: [
      {
        text: "When the span-to-depth ratio is small, check deep-beam provisions.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-strut-and-tie-model",
    input_key: "strut-and-tie model",
    entry_type: "technical_term",
    general_meaning_en: "A truss-like model used to explain how forces flow through concrete regions.",
    detailed_meaning_en:
      "A strut-and-tie model represents disturbed regions using compression struts, tension ties, and nodal zones to trace load paths where flexural beam theory is not reliable.",
    technical_meaning_en:
      "A lower-bound truss analogy for reinforced concrete D-regions with compression struts, tension ties, and hydrostatic nodal zones.",
    target_meaning: "strut-and-tie model (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["compression strut", "tension tie", "disturbed region", "deep beam"],
    common_mistakes: [
      "Applying strut-and-tie models outside disturbed regions without justification.",
    ],
    pronunciation: { simple: "STRUT and TIE MAH-dul" },
    examples: [
      {
        text: "The corbel was checked with a strut-and-tie model.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-compression-strut",
    input_key: "compression strut",
    entry_type: "technical_term",
    general_meaning_en: "An idealized compression member in a strut-and-tie model.",
    detailed_meaning_en:
      "A compression strut represents concrete carrying diagonal compression between nodes in disturbed regions such as deep beams, corbels, and dapped ends.",
    technical_meaning_en:
      "A truss member representing concrete in compression within a strut-and-tie model, often inclined between load and support nodes.",
    target_meaning: "compression strut (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["strut-and-tie model", "tension tie", "deep beam"],
    common_mistakes: ["Ignoring strut crushing checks at nodes."],
    pronunciation: { simple: "kom-PRESH-un STRUT" },
    examples: [
      {
        text: "The inclined compression strut carries load toward the column.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-tension-tie",
    input_key: "tension tie",
    entry_type: "technical_term",
    general_meaning_en: "A tension member that holds a strut-and-tie model together.",
    detailed_meaning_en:
      "A tension tie is reinforcement or an idealized tie resisting tensile forces balancing compression struts in disturbed regions.",
    technical_meaning_en:
      "Steel reinforcement or an idealized tie element providing the tensile force couple required in strut-and-tie equilibrium.",
    target_meaning: "tension tie (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["compression strut", "strut-and-tie model", "deep beam"],
    common_mistakes: ["Under-detailing horizontal tie reinforcement at supports."],
    pronunciation: { simple: "TEN-shun TY" },
    examples: [
      {
        text: "Horizontal reinforcement acts as the tension tie across the span.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-disturbed-region",
    input_key: "disturbed region",
    entry_type: "technical_term",
    general_meaning_en: "A zone where simple beam assumptions do not apply.",
    detailed_meaning_en:
      "Disturbed regions (D-regions) occur near loads, supports, openings, and geometric discontinuities where plane sections do not remain plane.",
    technical_meaning_en:
      "A concrete region where Bernoulli beam assumptions fail, requiring strut-and-tie or detailed local analysis.",
    target_meaning: "disturbed region (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["strut-and-tie model", "deep beam", "B-region"],
    common_mistakes: ["Using B-region moment diagrams directly inside D-regions."],
    pronunciation: { simple: "dis-TURBD REE-jun" },
    examples: [
      {
        text: "The opening creates a disturbed region above the transfer beam.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-bending-moment",
    input_key: "bending moment",
    entry_type: "technical_term",
    general_meaning_en: "A measure of bending effect along a member.",
    detailed_meaning_en:
      "Bending moment quantifies the internal tendency of a member to bend about an axis, usually varying along the span in flexure-dominated beams.",
    technical_meaning_en:
      "The internal moment causing flexural stress about a section axis, often plotted on moment diagrams for beam design.",
    target_meaning: "bending moment (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["shear stress", "beam", "shallow beam"],
    common_mistakes: ["Confusing bending moment with torque on horizontal members."],
    pronunciation: { simple: "BEND-ing MOH-munt" },
    examples: [
      {
        text: "Maximum bending moment occurs near midspan for a simply supported beam.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-shear-stress",
    input_key: "shear stress",
    entry_type: "technical_term",
    general_meaning_en: "Internal stress that tries to slide one part of a material past another.",
    detailed_meaning_en:
      "Shear stress acts parallel to a section and accompanies shear force in beams, connections, and disturbed regions.",
    technical_meaning_en:
      "Tangential stress on a plane equal to shear force divided by area, critical at supports and in deep beams.",
    target_meaning: "shear stress (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["shear span", "stress", "deep beam"],
    common_mistakes: ["Ignoring shear near concentrated loads in deep beams."],
    pronunciation: { simple: "SHEER STRES" },
    examples: [
      {
        text: "High shear stress near the support required additional stirrups.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-load-path",
    input_key: "load path",
    entry_type: "technical_term",
    general_meaning_en: "The route forces take through a structure to the ground.",
    detailed_meaning_en:
      "A load path traces how gravity, wind, or seismic forces move through slabs, beams, walls, and foundations to supporting soil or rock.",
    technical_meaning_en:
      "The continuous force-transfer route from applied loads through connected members and connections to the foundation.",
    target_meaning: "load path (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["load", "foundation", "footing", "compression strut"],
    common_mistakes: ["Stopping the load path diagram at a beam without continuing to supports."],
    pronunciation: { simple: "LOHD PATH" },
    examples: [
      {
        text: "The architect asked us to verify the load path after the opening was added.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-footing",
    input_key: "footing",
    entry_type: "technical_term",
    general_meaning_en: "A widened base that spreads column or wall loads into the soil.",
    detailed_meaning_en:
      "Footings are shallow foundation elements—such as isolated, combined, or strip footings—that distribute structural loads to bearing soil or rock.",
    technical_meaning_en:
      "A shallow foundation element enlarging contact area to keep bearing pressure within soil capacity.",
    target_meaning: "footing (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["foundation", "bearing capacity", "settlement"],
    common_mistakes: ["Confusing footing (shallow) with pile cap (deep system)."],
    pronunciation: { simple: "FOOT-ing" },
    examples: [
      {
        text: "The column sits on a reinforced concrete footing.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-settlement",
    input_key: "settlement",
    entry_type: "technical_term",
    general_meaning_en: "Downward movement of the ground or foundation under load.",
    detailed_meaning_en:
      "Settlement is the vertical compression of soil beneath a foundation. Differential settlement can damage structures if not controlled.",
    technical_meaning_en:
      "Time-dependent or immediate vertical soil deformation under applied foundation loads, including elastic and consolidation components.",
    target_meaning: "settlement (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["bearing capacity", "footing", "foundation"],
    common_mistakes: ["Using total settlement interchangeably with differential settlement."],
    pronunciation: { simple: "SET-ul-munt" },
    examples: [
      {
        text: "Excessive settlement cracked the masonry wall.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-dead-load",
    input_key: "dead load",
    entry_type: "technical_term",
    general_meaning_en: "Permanent weight from the structure itself and fixed attachments.",
    detailed_meaning_en:
      "Dead load includes self-weight of members, finishes, fixed equipment, and other loads that do not change significantly over time.",
    technical_meaning_en:
      "Permanent structural and non-structural gravity load used in strength and serviceability design, typically factored separately from live load.",
    target_meaning: "dead load (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["live load", "imposed load", "self-weight", "DL"],
    common_mistakes: ["Including movable furniture as dead load without confirming permanence."],
    pronunciation: { simple: "DED LOHD" },
    examples: [
      {
        text: "The slab dead load includes topping and ceiling finishes.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-live-load",
    input_key: "live load",
    entry_type: "technical_term",
    general_meaning_en: "Variable load from occupancy, use, or movable items.",
    detailed_meaning_en:
      "Live load accounts for people, furniture, vehicles, and other loads that can change in magnitude or location during the life of the structure.",
    technical_meaning_en:
      "Transient imposed gravity load specified by building codes for occupancy type and used with load combinations for member design.",
    target_meaning: "live load (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["dead load", "imposed load", "occupancy load", "LL"],
    common_mistakes: ["Confusing live load with wind or seismic lateral load."],
    pronunciation: { simple: "LIV LOHD" },
    examples: [
      {
        text: "Office live load is higher than residential live load in most codes.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-imposed-load",
    input_key: "imposed load",
    entry_type: "technical_term",
    general_meaning_en: "Load applied to a structure by use, occupancy, or stored materials.",
    detailed_meaning_en:
      "Imposed load is a broader term for loads not part of permanent construction, often overlapping with live load in building codes.",
    technical_meaning_en:
      "Variable gravity load from occupancy, storage, or equipment as distinct from permanent dead load; terminology varies by code region.",
    target_meaning: "imposed load (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["live load", "dead load", "occupancy"],
    common_mistakes: ["Using imposed load and live load interchangeably without checking local code definitions."],
    pronunciation: { simple: "im-POHZD LOHD" },
    examples: [
      {
        text: "Warehouse imposed loads include pallet storage.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-wind-load",
    input_key: "wind load",
    entry_type: "technical_term",
    general_meaning_en: "Force on a structure caused by wind pressure or suction.",
    detailed_meaning_en:
      "Wind load depends on wind speed, exposure, building geometry, and dynamic effects. It acts laterally and can govern cladding and framing design.",
    technical_meaning_en:
      "Lateral environmental load computed from basic wind speed, exposure category, and pressure coefficients per applicable wind code.",
    target_meaning: "wind load (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["seismic load", "lateral load", "pressure", "suction"],
    common_mistakes: ["Ignoring uplift on roof cladding when checking wind load."],
    pronunciation: { simple: "WIND LOHD" },
    examples: [
      {
        text: "High-rise façades must resist increased wind load near the top.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-seismic-load",
    input_key: "seismic load",
    entry_type: "technical_term",
    general_meaning_en: "Inertial force on a structure during an earthquake.",
    detailed_meaning_en:
      "Seismic load arises from ground shaking and building mass. Design methods distribute forces through diaphragms, frames, and walls.",
    technical_meaning_en:
      "Equivalent lateral force or response-spectrum base shear used in seismic design, dependent on site class, importance factor, and structural system.",
    target_meaning: "seismic load (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["earthquake", "base shear", "lateral force", "ductility"],
    common_mistakes: ["Applying seismic provisions without checking local seismic hazard maps."],
    pronunciation: { simple: "SYZ-mik LOHD" },
    examples: [
      {
        text: "Shear walls help resist seismic load in low-rise buildings.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-shear-force",
    input_key: "shear force",
    entry_type: "technical_term",
    general_meaning_en: "Internal force that acts parallel to a cross-section, tending to slide one part past another.",
    detailed_meaning_en:
      "Shear force varies along a beam and is maximum near supports in many simple spans. It works with bending moment in member design.",
    technical_meaning_en:
      "Internal transverse force V(x) on a section, paired with shear stress and reinforcement/stirrup requirements in concrete and steel design.",
    target_meaning: "shear force (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["shear stress", "bending moment", "stirrups", "V-diagram"],
    common_mistakes: ["Neglecting shear near concentrated loads or deep beams."],
    pronunciation: { simple: "SHEER FORS" },
    examples: [
      {
        text: "Stirrups resist shear force near the beam support.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-foundation",
    input_key: "foundation",
    entry_type: "technical_term",
    general_meaning_en: "The part of a structure that transfers loads to the ground.",
    detailed_meaning_en:
      "Foundations can be shallow (footings, rafts) or deep (piles, caissons) depending on soil capacity and load magnitude.",
    technical_meaning_en:
      "Structural system element that distributes building loads to bearing strata while meeting bearing capacity and settlement limits.",
    target_meaning: "foundation (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["footing", "pile", "bearing capacity", "settlement"],
    common_mistakes: ["Confusing foundation (system) with footing (shallow element)."],
    pronunciation: { simple: "fown-DAY-shun" },
    examples: [
      {
        text: "Poor soil required a deeper foundation system.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
  {
    id: "prod-glossary-bearing-capacity",
    input_key: "bearing capacity",
    entry_type: "technical_term",
    general_meaning_en: "How much load the ground can support without failure.",
    detailed_meaning_en:
      "Bearing capacity is the maximum contact pressure a foundation can transmit to soil without shear failure or excessive settlement.",
    technical_meaning_en:
      "Ultimate or allowable soil bearing pressure used to size footings and foundations against shear failure and serviceability limits.",
    target_meaning: "bearing capacity (technical English term)",
    closest_local_equivalent_note: NO_EXACT_EQUIVALENT,
    related_terms: ["footing", "foundation", "settlement"],
    common_mistakes: [
      "Using allowable bearing capacity without checking settlement serviceability.",
    ],
    pronunciation: { simple: "BAIR-ing kuh-PAS-i-tee" },
    examples: [
      {
        text: "Loose fill lowered the allowable bearing capacity at the site.",
        language_code: "en",
        context_label: "Engineering",
      },
    ],
  },
];

export function findGlossaryEntry(inputText: string): GlossarySeedEntry | undefined {
  return findSeedByInputKey(ENGINEERING_GLOSSARY_ENTRIES, inputText);
}

export function resolveGlossaryEntry(query: DictionaryQuery): DictionaryEntry | null {
  const seed = findGlossaryEntry(query.input_text);
  if (!seed) return null;
  return buildEntryFromGlossary(seed, query);
}
