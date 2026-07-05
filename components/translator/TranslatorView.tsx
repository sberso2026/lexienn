"use client";

import { useState } from "react";
import { CameraTranslatorView } from "@/components/translator/CameraTranslatorView";
import { TextTranslatorView } from "@/components/translator/TextTranslatorView";
import { TranslatorModeTabs } from "@/components/translator/TranslatorModeTabs";

export function TranslatorView() {
  const [mode, setMode] = useState<"text" | "camera">("text");

  return (
    <div className="space-y-5">
      <TranslatorModeTabs mode={mode} onChange={setMode} />
      {mode === "text" ? <TextTranslatorView /> : <CameraTranslatorView />}
    </div>
  );
}
