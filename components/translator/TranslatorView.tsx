"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextTranslatorView } from "@/components/translator/TextTranslatorView";
import { TranslatorCameraRedirect } from "@/components/translator/TranslatorCameraRedirect";

export function TranslatorView() {
  const router = useRouter();

  return (
    <div className="space-y-5">
      <TranslatorCameraRedirect />
      <TextTranslatorView />
      <p className="text-sm text-[var(--muted)]">
        Need a live bilingual talk?{" "}
        <button
          type="button"
          onClick={() => {
            router.push("/conversation");
          }}
          className="inline border-0 bg-transparent p-0 font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Open Conversation
        </button>
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
