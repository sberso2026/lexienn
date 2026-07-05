import type { ReactNode } from "react";

interface CompactCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
};

export function CompactCard({
  children,
  className = "",
  padding = "md",
}: CompactCardProps) {
  return (
    <div className={`card-surface ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
