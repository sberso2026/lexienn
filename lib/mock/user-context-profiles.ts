import type { UserContextProfile } from "@/lib/schemas";

export const mockUserContextProfiles: UserContextProfile[] = [
  {
    context: "general",
    label: "General",
    description: "Everyday explanations for any user.",
    explanation_level_default: "normal",
  },
  {
    context: "student",
    label: "Student",
    description: "School, study, and exam-related usage.",
    explanation_level_default: "simple",
  },
  {
    context: "household_family",
    label: "Household / Family",
    description: "Home, chores, family, and daily life.",
    explanation_level_default: "simple",
  },
  {
    context: "engineer",
    label: "Engineer",
    description: "Technical and structural engineering terms.",
    explanation_level_default: "professional",
  },
  {
    context: "construction_worker",
    label: "Construction Worker",
    description: "Site work, tools, safety, and building tasks.",
    explanation_level_default: "normal",
  },
  {
    context: "business_owner",
    label: "Business Owner",
    description: "Commerce, pricing, and customer communication.",
    explanation_level_default: "normal",
  },
  {
    context: "farmer",
    label: "Farmer",
    description: "Agriculture, crops, livestock, and fieldwork.",
    explanation_level_default: "normal",
  },
  {
    context: "traveller",
    label: "Traveller",
    description: "Travel, directions, food, and emergencies.",
    explanation_level_default: "simple",
  },
  {
    context: "health_emergency",
    label: "Health / Emergency",
    description: "Medical and urgent communication needs.",
    explanation_level_default: "simple",
  },
  {
    context: "custom",
    label: "Custom",
    description: "User-defined context (future).",
    explanation_level_default: "normal",
  },
];

export function getUserContextProfile(
  context: UserContextProfile["context"],
): UserContextProfile | undefined {
  return mockUserContextProfiles.find((profile) => profile.context === context);
}
