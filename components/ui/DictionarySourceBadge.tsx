import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DICTIONARY_SOURCE_LABELS,
} from "@/lib/dictionary/dictionarySources";
import type { DictionaryResolutionSource } from "@/lib/schemas";

const SOURCE_VARIANTS: Record<
  DictionaryResolutionSource,
  "success" | "accent" | "neutral" | "info"
> = {
  curated_dictionary: "success",
  domain_glossary: "accent",
  external_dictionary: "neutral",
  ai_generated: "info",
  unavailable: "neutral",
};

interface DictionarySourceBadgeProps {
  source: DictionaryResolutionSource;
}

export function DictionarySourceBadge({ source }: DictionarySourceBadgeProps) {
  return (
    <StatusBadge
      label={DICTIONARY_SOURCE_LABELS[source]}
      variant={SOURCE_VARIANTS[source]}
    />
  );
}
