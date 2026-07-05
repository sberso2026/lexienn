/** Professional labels for Developer Mode surfaces only. */

export const DEV_LABELS = {
  development: "Development",
  seedData: "Seed data",
  localAdminTools: "Local admin tools",
  fallbackPolicy: "Fallback policy",
  providerStatus: "Provider status",
  sampleData: "Sample data",
  pendingSync: "Pending sync",
  localOnly: "Stored on this device only.",
  noBackend: "No cloud admin connection. Changes stay on this device.",
  correctionsQueue: "Local corrections",
} as const;

export const DEV_ADMIN_INTRO =
  "Local admin tools — changes are stored on this device only. No cloud admin connection.";

export const DEV_CORRECTIONS_INTRO =
  "Corrections are stored on this device. Sync actions simulate sending them for review.";

export const DEV_LANGUAGE_SEED_NOTE =
  "Bundled seed languages for development. Read-only in local admin tools.";

export const DEV_CONFIDENCE_LEGEND =
  "Labels: seed data, AI generated, community validated";

export const CAMERA_PRIVACY_NOTE =
  "Images are used only to extract text and are not saved unless you choose to save them.";

export const OCR_PRIVACY_NOTE =
  "Text is extracted from your image in memory and is not stored by default.";
