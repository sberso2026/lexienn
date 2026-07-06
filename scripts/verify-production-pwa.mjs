/**
 * Production PWA / brand asset smoke checks.
 * Run: node scripts/verify-production-pwa.mjs [baseUrl]
 */
import sharp from "sharp";

const BASE = (process.argv[2] ?? "https://lexienn.rtbea.com.au").replace(/\/$/, "");

const CHECKS = [
  { name: "service worker v3-brand2", path: "/sw.js", type: "text", includes: "lexienn-shell-v3-brand2" },
  {
    name: "versioned apple-touch-icon link in HTML",
    path: "/translator",
    type: "text",
    includes: "apple-touch-icon.png?v=2",
  },
  {
    name: "transparent brand asset",
    path: "/brand/lexienn-logo-transparent.png",
    type: "png-alpha",
    minTransparentPercent: 50,
    maxCheckerboardOpaque: 0,
  },
  {
    name: "versioned transparent brand asset",
    path: "/brand/lexienn-logo-transparent.png?v=2",
    type: "png-alpha",
    minTransparentPercent: 50,
    maxCheckerboardOpaque: 0,
  },
  {
    name: "favicon navy background",
    path: "/favicon.png",
    type: "png-navy",
    minNavyPercent: 20,
  },
  {
    name: "apple-touch-icon navy background",
    path: "/apple-touch-icon.png",
    type: "png-navy",
    minNavyPercent: 20,
  },
];

function isCheckerboardBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const lightness = (r + g + b) / 3;
  return lightness > 190 && saturation < 0.12;
}

function isNavyish(r, g, b) {
  return r <= 30 && g >= 45 && g <= 70 && b >= 90 && b <= 110;
}

async function analyzePng(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const pixelCount = info.width * info.height;
  let transparent = 0;
  let checkerboardOpaque = 0;
  let navyish = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 10) {
      transparent++;
      continue;
    }
    if (isCheckerboardBackground(r, g, b)) checkerboardOpaque++;
    if (isNavyish(r, g, b)) navyish++;
  }

  return {
    channels: info.channels,
    transparentPercent: (transparent / pixelCount) * 100,
    checkerboardOpaque,
    navyPercent: (navyish / pixelCount) * 100,
  };
}

async function main() {
  console.log(`Lexienn production PWA checks — ${BASE}\n`);
  let failed = 0;

  for (const check of CHECKS) {
    const url = `${BASE}${check.path}`;
    try {
      if (check.type === "text") {
        const response = await fetch(url, {
          headers: { "User-Agent": "LexiennProductionQA/1.0" },
        });
        const text = await response.text();
        const ok = text.includes(check.includes);
        console.log(`${ok ? "PASS" : "FAIL"}  ${check.name}`);
        if (!ok) {
          failed++;
          console.log(`       expected to include: ${check.includes}`);
        }
        continue;
      }

      if (check.type === "png-alpha") {
        const stats = await analyzePng(url);
        const ok =
          stats.channels >= 4 &&
          stats.transparentPercent >= check.minTransparentPercent &&
          stats.checkerboardOpaque <= check.maxCheckerboardOpaque;
        console.log(`${ok ? "PASS" : "FAIL"}  ${check.name}`);
        if (!ok) {
          failed++;
          console.log(`       ${JSON.stringify(stats)}`);
        }
        continue;
      }

      if (check.type === "png-navy") {
        const stats = await analyzePng(url);
        const ok = stats.navyPercent >= check.minNavyPercent;
        console.log(`${ok ? "PASS" : "FAIL"}  ${check.name}`);
        if (!ok) {
          failed++;
          console.log(`       ${JSON.stringify(stats)}`);
        }
      }
    } catch (error) {
      failed++;
      console.log(`FAIL  ${check.name}`);
      console.log(`       ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n${failed === 0 ? "All production checks passed." : `${failed} check(s) failed.`}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
