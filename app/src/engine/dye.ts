import type { DyeParams, Knot } from "../shared/types";
import { assertParams } from "../shared/validation";

export interface EffectiveKnot extends Knot {
  index: number;
  fx: boolean;
  fy: boolean;
}
export function effectiveKnots(params: DyeParams): EffectiveKnot[] {
  const out: EffectiveKnot[] = [],
    seen = new Set<string>();
  params.knots.forEach((p, index) => {
    const flips = [[false, false]];
    if (params.fold !== "none") flips.push([true, false]);
    if (params.fold === "quarter") flips.push([false, true], [true, true]);
    for (const [fx, fy] of flips) {
      const q = {
        ...p,
        x: fx ? 1 - p.x : p.x,
        y: fy ? 1 - p.y : p.y,
        index,
        fx,
        fy,
      };
      const key = `${q.x.toFixed(3)},${q.y.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(q);
      }
    }
  });
  return out;
}
function smooth(a: number, b: number, t: number): number {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function hash(x: number, y: number, seed: number): number {
  let n =
    Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 144269);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  let a = x - ix,
    b = y - iy;
  a = a * a * (3 - 2 * a);
  b = b * b * (3 - 2 * b);
  return (
    (hash(ix, iy, seed) * (1 - a) + hash(ix + 1, iy, seed) * a) * (1 - b) +
    (hash(ix, iy + 1, seed) * (1 - a) + hash(ix + 1, iy + 1, seed) * a) * b
  );
}
// Artistic resist-dye approximation, extracted from the retained Demo.
export function computeDye(
  params: DyeParams,
  size: number,
): Uint8ClampedArray<ArrayBuffer> {
  assertParams(params);
  if (!Number.isInteger(size) || size < 2 || size > 1024)
    throw new Error("图像尺寸须在 2—1024 之间。");
  const pixels = new Uint8ClampedArray(size * size * 4),
    pts = effectiveKnots(params);
  const ink = {
    light: [111, 149, 177],
    medium: [47, 94, 134],
    deep: [20, 58, 96],
  }[params.depth];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1),
        v = y / (size - 1),
        coarse = noise(u * 8, v * 8, params.seed),
        fine = noise(u * 74, v * 74, params.seed + 4),
        grain = hash(x, y, params.seed);
      let resist = 0;
      for (const p of pts) {
        const dx = u - p.x,
          dy = v - p.y;
        if (params.style === "stripe") {
          const d =
            Math.abs(dy) + (noise(u * 14, p.y * 29, params.seed) - 0.5) * 0.014;
          resist = Math.max(
            resist,
            (1 - smooth(p.radius * 0.23, p.radius * 0.64, d)) * 0.97,
          );
          continue;
        }
        const q = dx * dx + dy * dy;
        if (q > p.radius * p.radius * 2.2) continue;
        const angle = Math.atan2(dy, dx),
          w =
            0.038 * Math.sin(angle * 7 + p.index) +
            0.025 * Math.sin(angle * 13 + params.seed * 0.1) +
            (fine - 0.5) * 0.095;
        const d = Math.sqrt(q) / p.radius,
          t = d * (1 + w),
          core = 1 - smooth(0.2, 0.39, t);
        const r1 = Math.exp(
          -Math.pow((t - 0.56) / (0.075 + coarse * 0.014), 2),
        );
        const r2 = Math.exp(-Math.pow((t - 0.87) / 0.042, 2));
        const fibers =
          (0.5 + 0.5 * Math.sin(angle * 55 + d * 24 + params.seed)) *
          0.045 *
          Math.exp(-Math.pow((t - 0.7) / 0.3, 2));
        resist = Math.max(
          resist,
          Math.min(1, core * 0.98 + r1 * 0.87 + r2 * 0.6 + fibers),
        );
      }
      const saturation = Math.max(
        0,
        Math.min(
          1,
          (0.94 + (coarse - 0.5) * 0.105 + (fine - 0.5) * 0.08) * (1 - resist),
        ),
      );
      const weave =
          (x % 3 === 0 ? 1.2 : 0) +
          (y % 3 === 0 ? 1.4 : 0) +
          (grain - 0.5) * 3.1,
        i = (y * size + x) * 4;
      for (let ch = 0; ch < 3; ch++)
        pixels[i + ch] = Math.max(
          0,
          Math.min(
            255,
            ink[ch] * saturation +
              [249, 250, 244][ch] * (1 - saturation) +
              weave,
          ),
        );
      pixels[i + 3] = 255;
    }
  return pixels;
}
