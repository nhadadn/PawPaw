export function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const hex = input.trim();
  if (hex.startsWith('#')) {
    const h = hex.slice(1);
    const n =
      h.length === 3
        ? h
            .split('')
            .map((c) => c + c)
            .join('')
        : h;
    const num = parseInt(n, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, a: 1 };
  }
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((p) => p.trim());
  const r = parseFloat(parts[0]);
  const g = parseFloat(parts[1]);
  const b = parseFloat(parts[2]);
  const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
  return { r, g, b, a };
}

function srgbToLinear(channel: number) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number }
) {
  const L1 = luminance(fg);
  const L2 = luminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getTextColorForBackground(bgColor: string) {
  const parsed = parseColor(bgColor);
  if (!parsed) return { cssColor: 'rgb(23 25 35)', tailwindClass: 'text-neutral-900' };
  const bg = { r: parsed.r, g: parsed.g, b: parsed.b };
  const light = { r: 247, g: 250, b: 252 };
  const dark = { r: 17, g: 24, b: 39 };
  const ratioWithDark = contrastRatio(dark, bg);
  const ratioWithLight = contrastRatio(light, bg);
  if (ratioWithDark >= 4.5) return { cssColor: 'rgb(17 24 39)', tailwindClass: 'text-neutral-100' };
  if (ratioWithLight >= 4.5)
    return { cssColor: 'rgb(247 250 252)', tailwindClass: 'text-neutral-50' };
  return ratioWithDark > ratioWithLight
    ? { cssColor: 'rgb(17 24 39)', tailwindClass: 'text-neutral-100' }
    : { cssColor: 'rgb(247 250 252)', tailwindClass: 'text-neutral-50' };
}

export function applyAutoContrast(container: HTMLElement) {
  const style = getComputedStyle(container);
  let bg = style.backgroundColor;
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
    let el: HTMLElement | null = container;
    while (el) {
      const s = getComputedStyle(el);
      if (
        s.backgroundColor &&
        s.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        s.backgroundColor !== 'transparent'
      ) {
        bg = s.backgroundColor;
        break;
      }
      el = el.parentElement as HTMLElement | null;
    }
  }
  const { cssColor } = getTextColorForBackground(bg);
  container.style.setProperty('--on-bg', cssColor);
}
