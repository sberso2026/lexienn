/**
 * Bump when brand PNGs change so browsers and the service worker pick up new assets.
 * Keep public/sw.js CACHE_NAME in sync (e.g. lexienn-shell-v3-brand2).
 */
export const BRAND_ASSET_VERSION = "2";

export function withBrandAssetVersion(path: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${BRAND_ASSET_VERSION}`;
}
