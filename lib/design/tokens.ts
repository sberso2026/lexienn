/** Enterprise design tokens for Lexienn (Batch 21). */
export const colors = {
  navy: "#0f172a",
  navyMuted: "#1e293b",
  slate: "#64748b",
  slateLight: "#94a3b8",
  background: "#f4f6f9",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderSubtle: "#eef2f6",
  primary: "#1e3a5f",
  primaryHover: "#152a45",
  accent: "#4f46e5",
  accentSoft: "#eef2ff",
  success: "#15803d",
  successSoft: "#ecfdf5",
  warning: "#b45309",
  warningSoft: "#fffbeb",
  error: "#b91c1c",
  errorSoft: "#fef2f2",
} as const;

export const spacing = {
  pageX: "1rem",
  pageY: "1.25rem",
  card: "1rem",
  section: "1.5rem",
  touchMin: "2.75rem",
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  full: "9999px",
} as const;

export const shadow = {
  card: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
  elevated: "0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.04)",
} as const;

export const typography = {
  pageTitle: "text-2xl font-semibold tracking-tight text-[var(--foreground)]",
  sectionTitle: "text-base font-semibold text-[var(--foreground)]",
  label: "text-sm font-medium text-[var(--foreground)]",
  body: "text-sm leading-relaxed text-[var(--foreground)]",
  caption: "text-xs text-[var(--muted)]",
} as const;
