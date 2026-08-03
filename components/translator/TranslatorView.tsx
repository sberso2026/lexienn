"use client";

import Link from "next/link";
import { TextTranslatorView } from "@/components/translator/TextTranslatorView";
import { TranslatorCameraRedirect } from "@/components/translator/TranslatorCameraRedirect";

export function TranslatorView() {
  return (
    <div className="space-y-5">
      <TranslatorCameraRedirect />
      <TextTranslatorView />
      <p className="text-sm text-[var(--muted)]">
        Need a live bilingual talk?{" "}
        <Link
          href="/conversation"
          className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Open Conversation
        </Link>
      </p>
      <p className="text-sm text-[var(--muted)]">
        Need to scan text?{" "}
        <Link
          href="/lens"
          className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Open Lens
        </Link>
      </p>
    </div>
  );
}
