import Image from "next/image";

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
  const src =
    size === "icon" || size === "header-mobile"
      ? "/brand/lexienn-logo-icon.png"
      : "/brand/lexienn-logo-transparent.png";

  return (
    <Image
      src={src}
      alt="Lexienn"
      width={px}
      height={px}
      className={`shrink-0 object-contain ${SIZE_CLASS[size]} ${className}`}
      priority={priority}
    />
  );
}
