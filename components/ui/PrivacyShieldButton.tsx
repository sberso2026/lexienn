"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { InfoSheet } from "@/components/ui/InfoSheet";

interface PrivacyShieldButtonProps {
  title?: string;
  note: string;
  className?: string;
}

export function PrivacyShieldButton({
  title = "Privacy",
  note,
  className = "",
}: PrivacyShieldButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        icon={
          <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        label="Privacy information"
        variant="ghost"
        size="md"
        className={className}
        onClick={() => setOpen(true)}
      />
      <InfoSheet open={open} title={title} onClose={() => setOpen(false)}>
        {note}
      </InfoSheet>
    </>
  );
}
