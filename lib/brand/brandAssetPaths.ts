/** Public brand asset paths used by header, install gate, and launch screen. */
import { withBrandAssetVersion } from "@/lib/brand/brandAssetVersion";

export const BRAND_ASSET_PATHS = {
  master: "/brand/lexienn-logo.png",
  transparent: "/brand/lexienn-logo-transparent.png",
  icon: "/brand/lexienn-logo-icon.png",
  mark: "/brand/lexienn-logo-mark.png",
} as const;

/** Large logo on MobileInstallGate and launch screen. */
export const INSTALL_GATE_LOGO_PATH = BRAND_ASSET_PATHS.transparent;

/** Compact header mark (small screens). */
export const HEADER_LOGO_ICON_PATH = BRAND_ASSET_PATHS.icon;

/** Header / install sizes that need the full transparent mark. */
export const HEADER_LOGO_MARK_PATH = BRAND_ASSET_PATHS.transparent;

/** Versioned URL for browser cache busting after brand asset updates. */
export function brandAssetUrl(path: string): string {
  return withBrandAssetVersion(path);
}

export { withBrandAssetVersion, BRAND_ASSET_VERSION } from "@/lib/brand/brandAssetVersion";
