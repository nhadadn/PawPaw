import { describe, it, expect } from 'vitest';

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function srgbToLinear(channel: number) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(fgHex: string, bgHex: string) {
  const L1 = luminance(fgHex);
  const L2 = luminance(bgHex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG Contrast Ratios', () => {
  it('body text on light background meets AA (≥4.5:1)', () => {
    const ratio = contrastRatio('#2D3748', '#FFFFFF');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('off-white text on dark background meets AA (≥4.5:1)', () => {
    const ratio = contrastRatio('#F7FAFC', '#1A202C');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
