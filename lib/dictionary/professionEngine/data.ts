import type { ExampleSentence, UserContext } from "@/lib/schemas";
import {
  ENGINEERING_CAUTION,
  MEDICAL_CAUTION,
  SAFETY_CAUTION,
} from "./constants";

export type ContextProfessionData = {
  meaning_en: string;
  caution_note?: string;
  examples?: ExampleSentence[];
  related_terms?: string[];
  common_mistakes?: string[];
};

export type CuratedTermData = Partial<
  Record<UserContext, ContextProfessionData>
>;

export const CURATED_PROFESSION_DATA: Record<string, CuratedTermData> = {
  load: {
    general: {
      meaning_en:
        "Everyday sense: something carried, a batch of items, or work to be done.",
      related_terms: ["burden", "cargo", "amount"],
    },
    student: {
      meaning_en:
        "School workload: assignments, readings, exam preparation, or credit-hour load.",
      examples: [
        {
          text: "My course load is too heavy this semester.",
          language_code: "en",
          context_label: "Student",
        },
      ],
      related_terms: ["course load", "homework", "deadlines"],
      common_mistakes: [
        "Confusing academic 'load' with physical weight in lab reports.",
      ],
    },
    household_family: {
      meaning_en:
        "At home: laundry load, groceries carried in, or household tasks to handle.",
      examples: [
        {
          text: "I have a full load of laundry to finish.",
          language_code: "en",
          context_label: "Household",
        },
      ],
      related_terms: ["chores", "groceries", "laundry"],
    },
    engineer: {
      meaning_en:
        "Applied force or weight on a structure or member: dead load, live load, wind load, seismic load, and load path.",
      caution_note: ENGINEERING_CAUTION,
      examples: [
        {
          text: "Check the live load before approving the slab design.",
          language_code: "en",
          context_label: "Engineering",
        },
      ],
      related_terms: [
        "dead load",
        "live load",
        "wind load",
        "seismic load",
        "load path",
      ],
      common_mistakes: [
        "Treating 'load' only as cargo when discussing structural design.",
      ],
    },
    construction_worker: {
      meaning_en:
        "Materials moved on site, loading zones, and safe handling limits for lifts or scaffolding.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: ["rigging", "lifting", "material handling", "capacity"],
      common_mistakes: [
        "Exceeding safe working load limits on equipment.",
      ],
    },
    business_owner: {
      meaning_en:
        "Workload, order volume, staffing load, or system demand during busy periods.",
      related_terms: ["capacity", "throughput", "backlog", "demand"],
    },
    farmer: {
      meaning_en:
        "Harvest load, trailer load, or amount of produce moved from field to market.",
      related_terms: ["harvest", "haul", "yield", "trailer"],
    },
    traveller: {
      meaning_en: "Luggage load, packed bags, or gear carried while travelling.",
      related_terms: ["luggage", "backpack", "baggage"],
    },
    health_emergency: {
      meaning_en:
        "Physical load when moving an injured person — use proper support and avoid strain.",
      caution_note: MEDICAL_CAUTION,
      common_mistakes: [
        "Moving someone without assessing injury risk.",
      ],
    },
  },

  stress: {
    general: {
      meaning_en:
        "Pressure, strain, or emphasis — emotional, physical, or spoken.",
      related_terms: ["pressure", "strain", "tension"],
    },
    student: {
      meaning_en:
        "Exam pressure, study pressure, deadline pressure, or performance anxiety.",
      examples: [
        {
          text: "She felt stress before the final exam.",
          language_code: "en",
          context_label: "Student",
        },
      ],
      related_terms: ["exam anxiety", "deadlines", "study pressure"],
      common_mistakes: [
        "Ignoring sleep and health during high-stress exam weeks.",
      ],
    },
    household_family: {
      meaning_en:
        "Family tension, caregiving pressure, or stress from home responsibilities.",
      related_terms: ["caregiving", "family pressure", "burnout"],
    },
    engineer: {
      meaning_en:
        "Force per unit area in a material: axial stress, bending stress, shear stress, and von Mises stress.",
      caution_note: ENGINEERING_CAUTION,
      examples: [
        {
          text: "The beam must resist bending stress.",
          language_code: "en",
          context_label: "Engineering",
        },
      ],
      related_terms: [
        "axial stress",
        "bending stress",
        "shear stress",
        "von Mises stress",
      ],
      common_mistakes: [
        "Using engineering 'stress' when meaning emotional stress in casual chat.",
      ],
    },
    construction_worker: {
      meaning_en:
        "Structural stress in members, overstress warnings, and site pressure to meet deadlines safely.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: ["overstress", "capacity", "safety factor"],
    },
    business_owner: {
      meaning_en:
        "Business pressure: cash flow stress, staffing stress, or market uncertainty.",
      related_terms: ["cash flow", "risk", "deadline pressure"],
    },
    farmer: {
      meaning_en:
        "Weather stress on crops, soil moisture stress, or financial pressure between harvests.",
      related_terms: ["drought stress", "crop stress", "seasonal pressure"],
    },
    traveller: {
      meaning_en:
        "Travel stress: delays, language barriers, fatigue, or unfamiliar environments.",
      related_terms: ["jet lag", "fatigue", "culture shock"],
    },
    health_emergency: {
      meaning_en:
        "Physical or emotional strain that may affect wellbeing — not a medical diagnosis.",
      caution_note: MEDICAL_CAUTION,
      common_mistakes: [
        "Self-diagnosing serious conditions based on stress alone.",
      ],
    },
  },

  foundation: {
    general: {
      meaning_en:
        "A base something is built on, or an underlying starting point for ideas.",
      related_terms: ["basis", "base", "groundwork"],
    },
    student: {
      meaning_en:
        "Basic knowledge or skills that later learning builds upon.",
      examples: [
        {
          text: "Math is the foundation of engineering studies.",
          language_code: "en",
          context_label: "Student",
        },
      ],
      related_terms: ["basics", "prerequisites", "fundamentals"],
    },
    household_family: {
      meaning_en:
        "The literal foundation of a home, or family values as a 'foundation' for children.",
      related_terms: ["home base", "family values", "footing"],
    },
    engineer: {
      meaning_en:
        "Structural element transferring loads to the ground: shallow or deep foundation, footing, pile cap.",
      caution_note: ENGINEERING_CAUTION,
      examples: [
        {
          text: "The foundation must rest on firm soil.",
          language_code: "en",
          context_label: "Engineering",
        },
      ],
      related_terms: ["footing", "pile", "substructure", "bearing capacity"],
    },
    construction_worker: {
      meaning_en:
        "The excavated and built base where columns, walls, or slabs start on site.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: ["excavation", "rebar", "formwork", "footing"],
    },
    business_owner: {
      meaning_en:
        "Business foundation: capital, legal setup, core customers, or operating principles.",
      related_terms: ["startup capital", "business plan", "core offer"],
    },
    farmer: {
      meaning_en:
        "Soil foundation for structures on farmland, or foundational land preparation.",
      related_terms: ["soil bearing", "drainage", "farm building base"],
    },
    traveller: {
      meaning_en:
        "Figurative: learning basic local phrases as a foundation for communication.",
      related_terms: ["basics", "survival phrases"],
    },
    health_emergency: {
      meaning_en:
        "Not a common medical term — avoid clinical use; stick to general English meaning.",
      caution_note: MEDICAL_CAUTION,
    },
  },

  water: {
    general: {
      meaning_en: "Drinking, cooking, cleaning, and everyday household water use.",
      related_terms: ["drinking water", "tap water", "supply"],
    },
    student: {
      meaning_en:
        "School science context: states of matter, water cycle, or lab water use.",
      related_terms: ["H₂O", "water cycle", "hydrology basics"],
    },
    household_family: {
      meaning_en:
        "Home water for cooking, bathing, laundry, and storing safe drinking water.",
      related_terms: ["tap", "boiling", "water container"],
    },
    engineer: {
      meaning_en:
        "Fluid in hydrology and hydraulics: design flows, flood paths, and water supply systems.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: ["runoff", "drainage", "hydraulics", "flood path"],
    },
    construction_worker: {
      meaning_en:
        "Site water for curing concrete, dust control, and worker hydration.",
      related_terms: ["curing", "hydration", "site supply"],
    },
    business_owner: {
      meaning_en:
        "Utility costs, water supply for operations, or compliance with water regulations.",
      related_terms: ["utility bill", "supply contract"],
    },
    farmer: {
      meaning_en:
        "Irrigation water, rainfall, stock water, and storage for dry seasons.",
      related_terms: ["irrigation", "rainfall", "stock tank"],
      common_mistakes: [
        "Over-irrigating without checking soil moisture.",
      ],
    },
    traveller: {
      meaning_en:
        "Safe drinking water, bottled water, or asking where to get clean water.",
      examples: [
        {
          text: "I need clean drinking water.",
          language_code: "en",
          context_label: "Traveller",
        },
      ],
      related_terms: ["bottled water", "boiled water", "safe source"],
      common_mistakes: [
        "Assuming all local water is safe to drink without checking.",
      ],
    },
    health_emergency: {
      meaning_en:
        "Dehydration risk, need for clean water after illness or heat exposure.",
      caution_note: MEDICAL_CAUTION,
      common_mistakes: [
        "Giving unsafe water to someone who is already unwell.",
      ],
    },
  },

  help: {
    general: {
      meaning_en: "Assistance, support, or making a task easier for someone.",
      related_terms: ["assist", "aid", "support"],
    },
    student: {
      meaning_en:
        "Academic help: tutoring, group study, or asking a teacher for clarification.",
      related_terms: ["tutor", "study group", "office hours"],
    },
    household_family: {
      meaning_en:
        "Helping with chores, childcare, errands, or family caregiving.",
      related_terms: ["chores", "caregiving", "errands"],
    },
    engineer: {
      meaning_en:
        "Technical support, peer review, or requesting calculation or design assistance.",
      related_terms: ["peer review", "consultation", "design check"],
    },
    construction_worker: {
      meaning_en:
        "On-site assistance: spotting lifts, passing tools, or calling for backup.",
      related_terms: ["spotter", "buddy system", "signal person"],
    },
    business_owner: {
      meaning_en:
        "Customer support, hiring help, or outsourcing tasks.",
      related_terms: ["support", "outsource", "staffing"],
    },
    farmer: {
      meaning_en:
        "Extra hands at harvest, borrowing equipment, or neighbour assistance.",
      related_terms: ["harvest help", "neighbour", "equipment share"],
    },
    traveller: {
      meaning_en:
        "Asking locals for directions, transport, translation, or safety assistance.",
      related_terms: ["directions", "translation", "local guide"],
    },
    health_emergency: {
      meaning_en:
        "Urgent assistance, medical help, or calling for aid.",
      caution_note: MEDICAL_CAUTION,
      examples: [
        {
          text: "I need help!",
          language_code: "en",
          context_label: "Emergency",
        },
      ],
      common_mistakes: [
        "Using overly casual phrasing in serious emergencies.",
      ],
    },
  },

  road: {
    general: {
      meaning_en:
        "A way for vehicles and pedestrians to travel between places.",
      related_terms: ["street", "highway", "path"],
    },
    student: {
      meaning_en:
        "Figurative: 'road to success' or learning pathways; also geography lessons.",
      related_terms: ["pathway", "journey", "geography"],
    },
    household_family: {
      meaning_en:
        "Local streets near home, school routes, or neighbourhood access roads.",
      related_terms: ["neighbourhood", "school route", "driveway"],
    },
    engineer: {
      meaning_en:
        "Road alignment, pavement, drainage, crossfall, and traffic loading in civil engineering.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: [
        "alignment",
        "pavement",
        "drainage",
        "traffic load",
      ],
    },
    construction_worker: {
      meaning_en:
        "Road works, excavation, base course, paving, and site access roads.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: ["base course", "paving", "haul road"],
    },
    business_owner: {
      meaning_en:
        "Delivery routes, customer access roads, or logistics corridors.",
      related_terms: ["logistics", "delivery route", "access"],
    },
    farmer: {
      meaning_en:
        "Farm access road, haul road, or path for moving produce and equipment.",
      related_terms: ["farm track", "haul road", "access lane"],
    },
    traveller: {
      meaning_en:
        "Route to a destination; nearest paved or passable road.",
      examples: [
        {
          text: "Where is the nearest road?",
          language_code: "en",
          context_label: "Traveller",
        },
      ],
      related_terms: ["route", "highway", "directions"],
    },
    health_emergency: {
      meaning_en:
        "Access road for ambulances or evacuation — knowing the nearest passable route.",
      caution_note: MEDICAL_CAUTION,
    },
  },

  "how much": {
    general: {
      meaning_en: "Asking about price, quantity, or degree.",
      related_terms: ["price", "cost", "amount"],
    },
    student: {
      meaning_en:
        "Asking about quantities in math or science, or informal cost of school items.",
      related_terms: ["quantity", "how many", "cost"],
      common_mistakes: [
        "Using 'how much' for countable items where 'how many' is correct.",
      ],
    },
    household_family: {
      meaning_en:
        "Household budgeting: grocery prices, utility costs, or market shopping.",
      related_terms: ["budget", "groceries", "market price"],
    },
    engineer: {
      meaning_en:
        "Quantities in estimates: how much material, concrete, steel, or fill is required.",
      caution_note: ENGINEERING_CAUTION,
      related_terms: ["quantity takeoff", "estimate", "bill of materials"],
    },
    construction_worker: {
      meaning_en:
        "Material quantities on site: bags of cement, loads of gravel, or hours worked.",
      related_terms: ["material quantity", "day rate", "measurement"],
    },
    business_owner: {
      meaning_en:
        "Pricing questions, quotations, margins, and cost negotiation.",
      related_terms: ["quotation", "margin", "unit price"],
    },
    farmer: {
      meaning_en:
        "Crop prices, feed costs, or transport fees at market.",
      related_terms: ["market price", "feed cost", "transport fee"],
    },
    traveller: {
      meaning_en:
        "Asking prices for food, transport, lodging, or goods.",
      examples: [
        {
          text: "How much is this?",
          language_code: "en",
          context_label: "Traveller",
        },
      ],
      related_terms: ["magkano", "fare", "room rate"],
    },
    health_emergency: {
      meaning_en:
        "Less common in emergencies — focus on clear medical phrases instead of pricing.",
      caution_note: MEDICAL_CAUTION,
    },
  },

  "i need a doctor": {
    general: {
      meaning_en: "A direct request for medical assistance.",
      caution_note: MEDICAL_CAUTION,
    },
    student: {
      meaning_en:
        "Seeking campus health services or clinic support while at school.",
      caution_note: MEDICAL_CAUTION,
      related_terms: ["campus clinic", "school nurse"],
    },
    household_family: {
      meaning_en:
        "Family health emergency — calling for a doctor for a child or relative.",
      caution_note: MEDICAL_CAUTION,
    },
    engineer: {
      meaning_en:
        "Site first aid escalation — when field staff need professional medical care.",
      caution_note: MEDICAL_CAUTION,
      related_terms: ["first aid", "site medic", "clinic"],
    },
    construction_worker: {
      meaning_en:
        "Workplace injury communication — request urgent medical professional on site.",
      caution_note: MEDICAL_CAUTION,
    },
    business_owner: {
      meaning_en:
        "Employee or customer medical emergency on premises — call professional help.",
      caution_note: MEDICAL_CAUTION,
    },
    farmer: {
      meaning_en:
        "Rural medical emergency — requesting a doctor when far from town.",
      caution_note: MEDICAL_CAUTION,
    },
    traveller: {
      meaning_en:
        "Seeking medical care while away from home; useful at clinics or with locals.",
      caution_note: MEDICAL_CAUTION,
    },
    health_emergency: {
      meaning_en:
        "Urgent need for a physician or clinic; specify injury or illness if possible.",
      caution_note: MEDICAL_CAUTION,
      examples: [
        {
          text: "I need a doctor. Please help.",
          language_code: "en",
          context_label: "Emergency",
        },
      ],
      common_mistakes: [
        "Delaying location details when help is on the way.",
      ],
    },
  },

  "can you show me the way to the nearest road?": {
    general: {
      meaning_en:
        "A polite request for directions to the closest passable road.",
      related_terms: ["directions", "nearest road", "way"],
    },
    student: {
      meaning_en:
        "Useful on field trips or rural school outings when separated from a group.",
      related_terms: ["field trip", "lost", "meet-up point"],
    },
    household_family: {
      meaning_en:
        "Family travel in rural areas when navigating back to a main road.",
      related_terms: ["family trip", "rural route"],
    },
    engineer: {
      meaning_en:
        "Field teams locating access roads after site visits, bridge inspections, or surveys.",
      caution_note: SAFETY_CAUTION,
      related_terms: ["site access", "field survey", "inspection route"],
    },
    construction_worker: {
      meaning_en:
        "Finding haul roads or exit routes from a remote job site.",
      caution_note: SAFETY_CAUTION,
      related_terms: ["haul road", "site exit", "access"],
    },
    business_owner: {
      meaning_en:
        "Less common — may apply when visiting remote suppliers or project sites.",
      related_terms: ["site visit", "remote supplier"],
    },
    farmer: {
      meaning_en:
        "Asking for directions from fields or remote plots to a main road.",
      related_terms: ["farm track", "main road", "market route"],
    },
    traveller: {
      meaning_en:
        "Finding a route back to transport or civilization when lost off-road.",
      examples: [
        {
          text: "Can you show me the way to the nearest road?",
          language_code: "en",
          context_label: "Traveller",
        },
      ],
      common_mistakes: [
        "Using an overly long sentence when a shorter phrase would be clearer.",
      ],
    },
    health_emergency: {
      meaning_en:
        "Evacuation routing — reaching a road so responders or transport can arrive.",
      caution_note: MEDICAL_CAUTION,
    },
  },
};
