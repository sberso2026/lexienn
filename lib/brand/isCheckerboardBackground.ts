/** Detect JPEG/checkerboard neutral background pixels for transparency extraction. */
export function isCheckerboardBackground(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const lightness = (r + g + b) / 3;
  return lightness > 190 && saturation < 0.12;
}
