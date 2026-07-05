/** IndexedDB / pack record shape version. Bump when pack metadata schema changes. */
export const OFFLINE_PACK_SCHEMA_VERSION = 2;

/** Bundled phrase content generation version. Bump when seed phrases or cleanup rules change. */
export const OFFLINE_PACK_CONTENT_VERSION = 2;

/** Semantic pack release string stored on each downloaded pack. */
export const OFFLINE_PACK_VERSION = "2.0.0";

/** App build label stored on newly downloaded packs. */
export const LEXIENN_APP_VERSION = "0.1.0";

/** @deprecated Use OFFLINE_PACK_VERSION */
export const PACK_VERSION = OFFLINE_PACK_VERSION;
