# Mobile layout QA checklist

Use Chrome or Edge DevTools device mode at these widths before production testing:

- **360px** — small Android
- **390px** — iPhone 14 / common mobile
- **430px** — large phone / small tablet

Automated checks in `scripts/verify-lexienn-mvp.test.ts` (Batch 32) verify structural guards (`overflow-x: hidden`, `.safe-bottom`, touch targets). Visual layout still requires this manual pass.

## Global

- [ ] No horizontal scroll on any main route (`/dictionary`, `/translator`, `/offline`, `/phrase-packs`, `/settings`)
- [ ] Bottom nav does not cover sticky action bars or primary buttons
- [ ] Skip link and focus rings remain visible when tabbing

## Define (`/dictionary`)

- [ ] Lookup form, sample chips, and mic button fit within viewport
- [ ] Result card readable; bottom action bar (Save / Speak) tappable above nav
- [ ] No prototype wording in badges or warnings

## Translate (`/translator`)

- [ ] Text mode: language row, input, Translate, and result actions usable one-handed
- [ ] Camera mode: Open Camera, Upload Image, Review text, Translate, Speak fit without scroll fights
- [ ] Privacy shield icon opens info sheet (not a long inline paragraph)

## Offline (`/offline`)

- [ ] Status banner chips wrap cleanly (Online/Offline, pair, pack, text/audio coverage)
- [ ] Search bar placeholder visible: “Search: help, doctor, road…”
- [ ] Recent cards and category tabs scroll horizontally if needed without page overflow
- [ ] Phrase cards: Play, Slow, Large Text, Favorite all ≥ 44px touch targets

## Packs (`/phrase-packs`)

- [ ] Pack cards and download actions fit width; no clipped text

## Settings (`/settings`)

- [ ] Profile, Languages, Voice, Offline storage, Privacy sections do not overflow
- [ ] Developer Mode toggle **hidden** when `NEXT_PUBLIC_ENABLE_DEVELOPER_MODE=false`

## Developer Mode (only when flag enabled)

- [ ] Toggle off by default on fresh install / cleared storage
- [ ] Diagnostics collapsed by default; OCR internals hidden in Camera until expanded
