import type { OfflinePackTier } from "@/lib/schemas";
import type { UserContext } from "@/lib/schemas";
import { getTierPhraseTarget } from "@/lib/offline/offlinePackCoverage";
import { estimatePackSizeBytes, formatPackSize } from "@/lib/offline/offlinePackKey";
import { buildOfflineCapabilities, capabilityLabel } from "@/lib/offline/offlineCapabilities";
import { getLanguageOptionByValue } from "@/lib/languages/languageOptions";

export type SmartPackThemeId =
  | "travel"
  | "emergency"
  | "engineering"
  | "healthcare"
  | "business"
  | "daily"
  | "personal_vocabulary";

export type SmartPackTheme = {
  id: SmartPackThemeId;
  label: string;
  description: string;
  userContext: UserContext;
  includePersonalVocabulary: boolean;
};

export const SMART_PACK_THEMES: SmartPackTheme[] = [
  {
    id: "travel",
    label: "Travel",
    description: "Directions, lodging, transport, and everyday phrases.",
    userContext: "traveller",
    includePersonalVocabulary: false,
  },
  {
    id: "emergency",
    label: "Emergency",
    description: "Urgent help, medical, safety, and authority phrases.",
    userContext: "health_emergency",
    includePersonalVocabulary: false,
  },
  {
    id: "engineering",
    label: "Engineering",
    description: "Fieldwork and construction language for job sites.",
    userContext: "engineer",
    includePersonalVocabulary: false,
  },
  {
    id: "healthcare",
    label: "Healthcare",
    description: "Clinic, pharmacy, symptoms, and care conversations.",
    userContext: "health_emergency",
    includePersonalVocabulary: false,
  },
  {
    id: "business",
    label: "Business",
    description: "Meetings, pricing, and professional communication.",
    userContext: "business_owner",
    includePersonalVocabulary: false,
  },
  {
    id: "daily",
    label: "Daily communication",
    description: "Household, shopping, and routine conversation.",
    userContext: "household_family",
    includePersonalVocabulary: false,
  },
  {
    id: "personal_vocabulary",
    label: "Selected personal vocabulary",
    description: "Prioritize phrases and words you already saved.",
    userContext: "general",
    includePersonalVocabulary: true,
  },
];

export type SmartPackPlan = {
  theme: SmartPackTheme;
  packTier: OfflinePackTier;
  phraseTarget: number;
  estimatedBytes: number;
  estimatedSizeLabel: string;
  includedCapabilities: string[];
  unavailableCapabilities: string[];
  fromLanguageId: string;
  toLanguageId: string;
};

export function buildSmartPackPlan(input: {
  fromLanguageId: string;
  toLanguageId: string;
  themeId: SmartPackThemeId;
  packTier?: OfflinePackTier;
}): SmartPackPlan {
  const theme =
    SMART_PACK_THEMES.find((entry) => entry.id === input.themeId) ?? SMART_PACK_THEMES[0]!;
  const packTier = input.packTier ?? "lite";
  const phraseTarget = getTierPhraseTarget(packTier);
  const estimatedBytes = estimatePackSizeBytes(phraseTarget);
  const toCaps = buildOfflineCapabilities({
    languageId: input.toLanguageId,
    estimatedBytes,
  });
  const toOption = getLanguageOptionByValue(input.toLanguageId);
  const included: string[] = [];
  const unavailable: string[] = [];

  if (toOption?.supports_offline_pack) {
    included.push(`Offline phrase pack (${capabilityLabel(toCaps.offlinePhrasePack)})`);
    included.push(`Offline text pack (${capabilityLabel(toCaps.offlineTextPack)})`);
  } else {
    unavailable.push("Offline phrase/text pack for this language");
  }

  if (toCaps.offlineAudioPack === "unavailable") {
    unavailable.push("Complete offline audio pack");
  } else {
    included.push(`Offline audio (${capabilityLabel(toCaps.offlineAudioPack)})`);
  }

  unavailable.push("Offline OCR pack");
  unavailable.push("Fully offline AI for every phrase");
  if (theme.includePersonalVocabulary) {
    included.push("Personal vocabulary preference (local review items)");
  }

  return {
    theme,
    packTier,
    phraseTarget,
    estimatedBytes,
    estimatedSizeLabel: formatPackSize(estimatedBytes),
    includedCapabilities: included,
    unavailableCapabilities: unavailable,
    fromLanguageId: input.fromLanguageId,
    toLanguageId: input.toLanguageId,
  };
}
