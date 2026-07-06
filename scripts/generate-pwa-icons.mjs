/**
 * Generate PWA icon sizes from public/brand/lexienn-logo-icon.png
 * Run: npm run generate:icons
 */
import { access, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const brandDir = join(root, "public/brand");
const iconsDir = join(root, "public/icons");
const publicDir = join(root, "public");

const transparentSource = join(brandDir, "lexienn-logo-transparent.png");
const iconSource = join(brandDir, "lexienn-logo-icon.png");
const markSource = join(brandDir, "lexienn-logo-mark.png");

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const MASKABLE_BG = { r: 22, g: 58, b: 99, alpha: 1 };
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
  const master = (await fileExists(transparentSource))
    ? transparentSource
    : (await fileExists(fallback))
      ? fallback
      : null;

  if (!master) {
    throw new Error(
      "Missing public/brand/lexienn-logo-transparent.png (or lexienn-logo.png). Copy the Lexienn logo first.",
    );
  }

  if (!(await fileExists(transparentSource))) {
    await sharp(master).png().toFile(transparentSource);
  }

  if (!(await fileExists(iconSource))) {
    const meta = await sharp(transparentSource).metadata();
    const side = Math.min(meta.width ?? 512, meta.height ?? 512);
    const inset = Math.round(side * 0.06);
    await sharp(transparentSource)
      .extract({
        left: inset,
        top: inset,
        width: side - inset * 2,
        height: side - inset * 2,
      })
      .png()
      .toFile(iconSource);
  }

  if (!(await fileExists(markSource))) {
    await sharp(transparentSource)
      .resize(256, 256, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(markSource);
  }
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
  const background = maskable
    ? MASKABLE_BG
    : { r: 0, g: 0, b: 0, alpha: 0 };

  const filename = maskable
    ? `maskable-icon-${size}x${size}.png`
    : `icon-${size}x${size}.png`;

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(join(iconsDir, filename));

  return filename;
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

  await sharp(iconSource)
    .resize(180, 180, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));

  await sharp(iconSource)
    .resize(32, 32, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(publicDir, "favicon.png"));

  console.log("Generated PWA icons from public/brand/lexienn-logo-icon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
