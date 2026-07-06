import Image from "next/image";
import {
  brandAssetUrl,
  HEADER_LOGO_ICON_PATH,
  HEADER_LOGO_MARK_PATH,
  INSTALL_GATE_LOGO_PATH,
} from "@/lib/brand/brandAssetPaths";

type LexiennBrandLogoSize = "header-mobile" | "header-desktop" | "install" | "icon";

const SIZE_PX: Record<LexiennBrandLogoSize, number> = {
  icon: 28,
  "header-mobile": 32,
  "header-desktop": 40,
  install: 128,
};

const SIZE_CLASS: Record<LexiennBrandLogoSize, string> = {
  icon: "h-7 w-7",
  "header-mobile": "h-8 w-8",
  "header-desktop": "h-10 w-10",
  install: "h-32 w-32",
};

function logoSrcForSize(size: LexiennBrandLogoSize): string {
  if (size === "icon" || size === "header-mobile") {
    return brandAssetUrl(HEADER_LOGO_ICON_PATH);
  }
  if (size === "install") {
    return brandAssetUrl(INSTALL_GATE_LOGO_PATH);
  }
  return brandAssetUrl(HEADER_LOGO_MARK_PATH);
}

interface LexiennBrandLogoProps {
  size?: LexiennBrandLogoSize;
  className?: string;
  priority?: boolean;
}

export function LexiennBrandLogo({
  size = "header-mobile",
  className = "",
  priority = false,
}: LexiennBrandLogoProps) {
  const px = SIZE_PX[size];
  const src = logoSrcForSize(size);

  return (
    <span className="inline-flex shrink-0 items-center justify-center bg-transparent">
      <Image
        src={src}
        alt="Lexienn"
        width={px}
        height={px}
        className={`bg-transparent object-contain ${SIZE_CLASS[size]} ${className}`}
        priority={priority}
        unoptimized
      />
    </span>
  );
}
