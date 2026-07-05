import type { ValidationStatus } from "@/lib/schemas";
import type { ComponentProps } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

const VALIDATION_LABELS: Record<ValidationStatus, string> = {
  ai_generated: "AI generated",
  ai_generated_unverified: "AI-generated, unverified",
  verified_dictionary: "Verified dictionary",
  curated: "Curated",
  community_corrected: "Community corrected",
  native_speaker_reviewed: "Native speaker reviewed",
  professionally_reviewed: "Professionally reviewed",
  uncertain: "Uncertain",
};

const VALIDATION_VARIANTS: Record<
  ValidationStatus,
  NonNullable<ComponentProps<typeof StatusBadge>["variant"]>
> = {
  ai_generated: "info",
  ai_generated_unverified: "warning",
  verified_dictionary: "success",
  curated: "success",
  community_corrected: "accent",
  native_speaker_reviewed: "success",
  professionally_reviewed: "success",
  uncertain: "neutral",
};

export function ValidationStatusBadge({
  status,
}: {
  status: ValidationStatus;
}) {
  return (
    <StatusBadge
      label={VALIDATION_LABELS[status]}
      variant={VALIDATION_VARIANTS[status]}
    />
  );
}
