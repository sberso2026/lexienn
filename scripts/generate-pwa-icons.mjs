/**
 * Generate PWA icon sizes from public/brand/lexienn-logo-icon.png
 * Run: npm run generate:icons
 */
import { access, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { removeCheckerboardToBuffer } from "./process-brand-logo.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const brandDir = join(root, "public/brand");
const iconsDir = join(root, "public/icons");
const publicDir = join(root, "public");

const transparentSource = join(brandDir, "lexienn-logo-transparent.png");
const iconSource = join(brandDir, "lexienn-logo-icon.png");
const markSource = join(brandDir, "lexienn-logo-mark.png");

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];
/** Lexienn navy #163a63 — intentional background for home-screen / favicon icons */
const LEXIENN_NAVY = { r: 22, g: 58, b: 99, alpha: 1 };
const ICON_FIT = 0.82;
const MASKABLE_FIT = 0.68;

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureBrandAssets() {
  await mkdir(brandDir, { recursive: true });
  const fallback = join(brandDir, "lexienn-logo.png");

  if (!(await fileExists(fallback))) {
    throw new Error(
      "Missing public/brand/lexienn-logo.png. Copy the Lexienn master logo first.",
    );
  }

  const transparent = await removeCheckerboardToBuffer(fallback);
  await transparent.clone().toFile(transparentSource);

  const trimmed = await removeCheckerboardToBuffer(fallback).then((img) => img.trim());

  await trimmed
    .clone()
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(iconSource);

  await trimmed
    .clone()
    .resize(256, 256, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(markSource);
}

async function renderIcon(size, { maskable = false } = {}) {
  const fit = maskable ? MASKABLE_FIT : ICON_FIT;
  const logoSize = Math.round(size * fit);
  const logo = await sharp(iconSource)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const left = Math.round((size - logoSize) / 2);
  const top = Math.round((size - logoSize) / 2);

  const filename = maskable
    ? `maskable-icon-${size}x${size}.png`
    : `icon-${size}x${size}.png`;

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: LEXIENN_NAVY,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(join(iconsDir, filename));

  return filename;
}

async function renderBrandedAppIcon(size, outputPath, fit = ICON_FIT) {
  const logoSize = Math.round(size * fit);
  const logo = await sharp(iconSource)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const left = Math.round((size - logoSize) / 2);
  const top = Math.round((size - logoSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: LEXIENN_NAVY,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(outputPath);
}

async function main() {
  await ensureBrandAssets();
  await mkdir(iconsDir, { recursive: true });

  for (const size of SIZES) {
    await renderIcon(size);
    if (size === 192 || size === 512) {
      await renderIcon(size, { maskable: true });
    }
  }

  await renderBrandedAppIcon(180, join(publicDir, "apple-touch-icon.png"));
  await renderBrandedAppIcon(32, join(publicDir, "favicon.png"), 0.78);

  console.log("Generated PWA icons with Lexienn navy backgrounds");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
