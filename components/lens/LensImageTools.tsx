"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";

type LensImageToolsProps = {
  disabled?: boolean;
  onRotate: () => void;
  onEnhance: () => void;
  qualityMessages?: string[];
};

export function LensImageTools({
  disabled = false,
  onRotate,
  onEnhance,
  qualityMessages = [],
}: LensImageToolsProps) {
  return (
    <CompactCard padding="sm">
      <p className="text-sm font-semibold">Image tools</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <ActionButton
          type="button"
          variant="secondary"
          className="!min-h-11"
          disabled={disabled}
          onClick={onRotate}
        >
          Rotate
        </ActionButton>
        <ActionButton
          type="button"
          variant="secondary"
          className="!min-h-11"
          disabled={disabled}
          onClick={onEnhance}
        >
          Enhance contrast
        </ActionButton>
      </div>
      {qualityMessages.length > 0 && (
        <ul className="mt-2 space-y-1">
          {qualityMessages.map((message) => (
            <li key={message} className="text-xs text-amber-800 dark:text-amber-200">
              {message}
            </li>
          ))}
        </ul>
      )}
    </CompactCard>
  );
}
