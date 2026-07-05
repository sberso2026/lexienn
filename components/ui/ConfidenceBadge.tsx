interface ConfidenceBadgeProps {
  score: number;
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const level =
    score >= 0.8 ? "High" : score >= 0.5 ? "Medium" : "Low";
  const variant =
    score >= 0.8 ? "success" : score >= 0.5 ? "info" : "warning";

  const variantClass =
    variant === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
      : variant === "info"
        ? "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
        : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass}`}
      title={`Confidence score: ${Math.round(score * 100)}%`}
    >
      {level} confidence
    </span>
  );
}
