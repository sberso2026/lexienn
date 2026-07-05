import type { VoiceAudioType } from "@/lib/voice/voiceSchemas";
import { StatusBadge } from "@/components/ui/StatusBadge";

const VOICE_TYPE_LABELS: Record<VoiceAudioType, string> = {
  ai_generated: "AI local-style voice",
  native_recorded: "Native recorded audio",
  browser_fallback: "Device voice fallback",
  unavailable: "Voice unavailable",
};

const VOICE_TYPE_VARIANTS: Record<
  VoiceAudioType,
  "success" | "accent" | "neutral" | "info" | "warning"
> = {
  ai_generated: "info",
  native_recorded: "success",
  browser_fallback: "warning",
  unavailable: "neutral",
};

interface VoiceSourceBadgeProps {
  audioType: VoiceAudioType | null;
}

export function VoiceSourceBadge({ audioType }: VoiceSourceBadgeProps) {
  if (!audioType) return null;

  return (
    <StatusBadge
      label={VOICE_TYPE_LABELS[audioType]}
      variant={VOICE_TYPE_VARIANTS[audioType]}
    />
  );
}
