import type { TranslationSource } from "@/lib/translator/translatorSchemas";
import { TRANSLATION_SOURCE_LABELS } from "@/lib/translator/translatorSchemas";
import { StatusBadge } from "@/components/ui/StatusBadge";

const SOURCE_VARIANTS: Record<
  TranslationSource,
  "success" | "accent" | "neutral" | "info" | "warning"
> = {
  dictionary: "success",
  phrase_pack: "success",
  ai: "info",
  rule_fallback: "accent",
  unavailable: "neutral",
};

interface TranslationSourceBadgeProps {
  source: TranslationSource;
}

export function TranslationSourceBadge({ source }: TranslationSourceBadgeProps) {
  return (
    <StatusBadge
      label={TRANSLATION_SOURCE_LABELS[source]}
      variant={SOURCE_VARIANTS[source]}
    />
  );
}
