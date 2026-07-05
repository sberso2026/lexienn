"use client";

import { CompactSegmentedControl } from "@/components/ui/CompactSegmentedControl";

interface TranslatorModeTabsProps {
  mode: "text" | "camera";
  onChange: (mode: "text" | "camera") => void;
}

export function TranslatorModeTabs({ mode, onChange }: TranslatorModeTabsProps) {
  return (
    <CompactSegmentedControl
      value={mode}
      onChange={onChange}
      ariaLabel="Translator mode"
      options={[
        { value: "text", label: "Text" },
        { value: "camera", label: "Camera" },
      ]}
    />
  );
}
