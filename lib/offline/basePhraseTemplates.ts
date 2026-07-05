import type { PhraseCategory } from "@/lib/schemas";

export type BasePhraseTemplate = {
  id: string;
  category: PhraseCategory;
  source_text: string;
  local_response_id?: string;
};

export const BASE_PHRASE_TEMPLATES: BasePhraseTemplate[] = [
  { id: "emergency-help", category: "emergency", source_text: "I need help." },
  { id: "emergency-lost", category: "emergency", source_text: "I am lost." },
  { id: "emergency-doctor", category: "emergency", source_text: "I need a doctor." },
  { id: "emergency-danger", category: "emergency", source_text: "This is an emergency." },
  { id: "emergency-call", category: "emergency", source_text: "Please call for help." },
  { id: "directions-road", category: "directions", source_text: "Where is the nearest road?" },
  { id: "directions-left", category: "directions", source_text: "Turn left.", local_response_id: "left" },
  { id: "directions-right", category: "directions", source_text: "Turn right.", local_response_id: "right" },
  { id: "directions-straight", category: "directions", source_text: "Go straight.", local_response_id: "straight" },
  { id: "directions-back", category: "directions", source_text: "Go back.", local_response_id: "go_back" },
  { id: "food-water", category: "food_and_water", source_text: "I need water." },
  { id: "food-hungry", category: "food_and_water", source_text: "I need food." },
  { id: "food-safe", category: "food_and_water", source_text: "Is this water safe to drink?" },
  { id: "transport-ride", category: "transport", source_text: "I need transport." },
  { id: "transport-stop", category: "transport", source_text: "Where is the bus stop?" },
  { id: "transport-taxi", category: "transport", source_text: "Please take me to the nearest town." },
  { id: "medical-clinic", category: "medical", source_text: "Please take me to the nearest clinic." },
  { id: "medical-pain", category: "medical", source_text: "I am in pain." },
  { id: "medical-medicine", category: "medical", source_text: "I need medicine." },
  { id: "money-price", category: "price_and_money", source_text: "How much is this?" },
  { id: "money-change", category: "price_and_money", source_text: "Do you have change?" },
  { id: "money-card", category: "price_and_money", source_text: "Can I pay by card?" },
  { id: "accommodation-room", category: "accommodation", source_text: "I need a room for tonight." },
  { id: "accommodation-bathroom", category: "accommodation", source_text: "Where is the bathroom?" },
  { id: "greeting-hello", category: "respectful_greetings", source_text: "Hello. Thank you for your help." },
  { id: "greeting-respect", category: "respectful_greetings", source_text: "Good morning. I mean no disrespect." },
  { id: "work-site", category: "fieldwork_engineering", source_text: "I am here for fieldwork." },
  { id: "work-safe", category: "fieldwork_engineering", source_text: "Is this area safe to enter?" },
  { id: "work-equipment", category: "fieldwork_engineering", source_text: "Where can I store equipment?" },
  { id: "number-one", category: "price_and_money", source_text: "One" },
  { id: "number-two", category: "price_and_money", source_text: "Two" },
  { id: "number-three", category: "price_and_money", source_text: "Three" },
  { id: "number-four", category: "price_and_money", source_text: "Four" },
  { id: "number-five", category: "price_and_money", source_text: "Five" },
  { id: "response-yes", category: "respectful_greetings", source_text: "Yes", local_response_id: "yes" },
  { id: "response-no", category: "respectful_greetings", source_text: "No", local_response_id: "no" },
  { id: "response-safe", category: "emergency", source_text: "Safe", local_response_id: "safe" },
  { id: "response-not-safe", category: "emergency", source_text: "Not safe", local_response_id: "not_safe" },
  { id: "response-unknown", category: "respectful_greetings", source_text: "I do not know", local_response_id: "i_do_not_know" },
  { id: "response-write-number", category: "price_and_money", source_text: "Write the number here", local_response_id: "write_number_here" },
];

export const OFFLINE_UI_CATEGORIES = [
  "emergency",
  "directions",
  "food_and_water",
  "transport",
  "medical",
  "price_and_money",
  "fieldwork_engineering",
  "household_family",
  "shopping_and_market",
  "phone_and_communication",
  "local_response_board",
  "favorites",
  "all",
] as const;

export type OfflineUiCategory = (typeof OFFLINE_UI_CATEGORIES)[number];

export function getTemplatesForCategory(category: OfflineUiCategory): BasePhraseTemplate[] {
  if (category === "all") return BASE_PHRASE_TEMPLATES;
  return BASE_PHRASE_TEMPLATES.filter((template) => template.category === category);
}
