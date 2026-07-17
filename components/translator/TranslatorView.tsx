"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { TextTranslatorView } from "@/components/translator/TextTranslatorView";
import { TranslatorModeTabs } from "@/components/translator/TranslatorModeTabs";

const CameraTranslatorView = dynamic(
  () =>
    import("@/components/translator/CameraTranslatorView").then((mod) => ({
      default: mod.CameraTranslatorView,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-[var(--muted)]" aria-live="polite">
        Loading camera tools…
      </p>
    ),
  },
);

export function TranslatorView() {
  const [mode, setMode] = useState<"text" | "camera">("text");

  return (
    <div className="space-y-5">
      <TranslatorModeTabs mode={mode} onChange={setMode} />
      {mode === "text" ? <TextTranslatorView /> : <CameraTranslatorView />}
    </div>
  );
}
