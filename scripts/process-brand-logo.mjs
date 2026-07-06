/**
 * Strip checkerboard / white JPEG backgrounds and emit true-alpha brand PNGs.
 * Run: node scripts/process-brand-logo.mjs
 */
import { access, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const brandDir = join(root, "public/brand");

const masterSource = join(brandDir, "lexienn-logo.png");
const transparentOutput = join(brandDir, "lexienn-logo-transparent.png");
const iconOutput = join(brandDir, "lexienn-logo-icon.png");
const markOutput = join(brandDir, "lexienn-logo-mark.png");

export function isCheckerboardBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const lightness = (r + g + b) / 3;
  return lightness > 190 && saturation < 0.12;
}

export async function removeCheckerboardToBuffer(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isCheckerboardBackground(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(brandDir, { recursive: true });

  if (!(await fileExists(masterSource))) {
    throw new Error(
      "Missing public/brand/lexienn-logo.png — copy the Lexienn master logo first.",
    );
  }

  const transparent = await removeCheckerboardToBuffer(masterSource);
  await transparent.clone().toFile(transparentOutput);

  const trimmed = await removeCheckerboardToBuffer(masterSource).then((img) => img.trim());

  await trimmed
    .clone()
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(iconOutput);

  await trimmed
    .clone()
    .resize(256, 256, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(markOutput);

  console.log("Processed brand logos with transparent backgrounds:");
  console.log("  - public/brand/lexienn-logo-transparent.png");
  console.log("  - public/brand/lexienn-logo-icon.png");
  console.log("  - public/brand/lexienn-logo-mark.png");
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
