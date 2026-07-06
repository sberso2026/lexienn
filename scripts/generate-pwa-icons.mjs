/**
 * Generate PWA icon sizes from public/brand/lexienn-logo.png
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "public/brand/lexienn-logo.png");
const iconsDir = join(root, "public/icons");
const publicDir = join(root, "public");

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const MASKABLE_BG = { r: 22, g: 58, b: 99, alpha: 1 };
const LOGO_FIT = 0.88;
const MASKABLE_FIT = 0.72;

async function renderIcon(size, { maskable = false } = {}) {
  const fit = maskable ? MASKABLE_FIT : LOGO_FIT;
  const logoSize = Math.round(size * fit);
  const logo = await sharp(source)
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
  await mkdir(iconsDir, { recursive: true });

  for (const size of SIZES) {
    await renderIcon(size);
    if (size === 192 || size === 512) {
      await renderIcon(size, { maskable: true });
    }
  }

  await sharp(source)
    .resize(180, 180, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));

  await sharp(source)
    .resize(32, 32, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(publicDir, "favicon.png"));

  console.log("Generated PWA icons in public/icons/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
