import type { ReactNode } from "react";
import { AlertCard } from "@/components/ui/AlertCard";

interface WarningCalloutProps {
  children: ReactNode;
  title?: string;
}

export function WarningCallout({ children, title }: WarningCalloutProps) {
  return (
    <AlertCard variant="warning" title={title}>
      {children}
    </AlertCard>
  );
}
