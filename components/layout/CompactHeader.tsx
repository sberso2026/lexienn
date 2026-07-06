"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LexiennBrandLogo } from "@/components/brand/LexiennBrandLogo";
import { StatusChip } from "@/components/ui/StatusChip";
import { HOME_ROUTE } from "@/lib/app/appBoot";
import { getPageTitle } from "@/lib/navigation/navConfig";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { getLanguageOptionByValue } from "@/lib/languages/languageOptions";

function CloudIcon({ online }: { online: boolean }) {
  if (online) {
    return (
      <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.998 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8 16h8M12 12V8" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M8 10H5a1 1 0 00-1 1v2a1 1 0 001 1h3l4 3V7L8 10z" />
    </svg>
  );
}

function HeaderStatusRow({
  showPair,
  fromLabel,
  toLabel,
  online,
  voiceReady,
}: {
  showPair: boolean;
  fromLabel: string;
  toLabel: string;
  online: boolean;
  voiceReady: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {showPair && (
        <span className="max-w-[8rem] truncate text-[10px] font-medium text-[var(--muted)] sm:max-w-[9rem]">
          {fromLabel.split(" ")[0]}→{toLabel.split(" ")[0]}
        </span>
      )}
      <StatusChip
        label={online ? "Online" : "Offline"}
        variant={online ? "success" : "warning"}
        icon={<CloudIcon online={online} />}
      />
      <span className={voiceReady ? undefined : "invisible"} aria-hidden={!voiceReady}>
        <StatusChip label="Voice" variant="info" icon={<SpeakerIcon />} />
      </span>
    </div>
  );
}

function HeaderBrandLink({ className }: { className?: string }) {
  return (
    <Link
      href={HOME_ROUTE}
      className={`shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${className ?? ""}`}
      aria-label="Go to Lexienn home"
    >
      <LexiennBrandLogo size="header-mobile" className="md:hidden" priority />
      <LexiennBrandLogo size="header-desktop" className="hidden md:block" priority />
    </Link>
  );
}

export function CompactHeader() {
  const pathname = usePathname();
  const { preferences } = useUserPreferences();
  const [online, setOnline] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);

  const pageTitle = getPageTitle(pathname);
  const showPair =
    pathname.startsWith("/dictionary") ||
    pathname.startsWith("/translator") ||
    pathname.startsWith("/offline");

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    void fetch("/api/voice/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.voice_enabled === "boolean") {
          setVoiceReady(Boolean(data.voice_enabled));
        }
      })
      .catch(() => setVoiceReady(false));
  }, []);

  const fromLabel = getLanguageOptionByValue(preferences.default_source_language)?.display_name ?? "EN";
  const toLabel =
    getLanguageOptionByValue(preferences.default_target_language)?.display_name ?? "Target";

  const statusRow = (
    <HeaderStatusRow
      showPair={showPair}
      fromLabel={fromLabel}
      toLabel={toLabel}
      online={online}
      voiceReady={voiceReady}
    />
  );

  return (
    <header className="safe-area-top sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md">
      <div className="mx-auto max-w-lg px-4 sm:max-w-2xl lg:max-w-3xl">
        <div className="flex flex-col gap-1.5 py-2 md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <HeaderBrandLink />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
                LEXIENN
              </p>
              <h1 className="truncate text-base font-semibold leading-tight">{pageTitle}</h1>
            </div>
          </div>
          {statusRow}
        </div>

        <div className="hidden h-[var(--header-height)] items-center justify-between gap-2 md:flex">
          <div className="flex min-w-0 items-center gap-2.5">
            <HeaderBrandLink />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
                LEXIENN
              </p>
              <h1 className="truncate text-base font-semibold leading-tight">{pageTitle}</h1>
            </div>
          </div>
          {statusRow}
        </div>
      </div>
    </header>
  );
}
