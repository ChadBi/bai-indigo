import { describe, it, expect } from "vitest";
import { computeDye, effectiveKnots } from "./dye";
import { initialParams } from "../content/patterns";
import { assertParams } from "../shared/validation";

describe("deterministic dye engine", () => {
  it("repeats identical seeded pixels and changes with seed", () => {
    const params = initialParams(),
      first = computeDye(params, 48);
    expect(computeDye(params, 48)).toEqual(first);
    params.seed++;
    expect(computeDye(params, 48)).not.toEqual(first);
    expect(first.filter((_, i) => i % 4 === 3).every((v) => v === 255)).toBe(
      true,
    );
  });
  it("mirrors knots and deduplicates fold-axis positions", () => {
    const params = initialParams();
    params.knots = [{ id: "one", x: 0.2, y: 0.3, radius: 0.13 }];
    params.fold = "quarter";
    expect(effectiveKnots(params).map((k) => [k.x, k.y])).toEqual([
      [0.2, 0.3],
      [0.8, 0.3],
      [0.2, 0.7],
      [0.8, 0.7],
    ]);
    params.knots[0].x = 0.5;
    params.knots[0].y = 0.5;
    expect(effectiveKnots(params)).toHaveLength(1);
  });
  it("keeps knot centres white across preview and export sizes", () => {
    const params = initialParams();
    params.knots = [{ id: "middle", x: 0.5, y: 0.5, radius: 0.23 }];
    for (const size of [260, 1024]) {
      const pixels = computeDye(params, size),
        centre = (Math.floor(size / 2) * size + Math.floor(size / 2)) * 4;
      expect(pixels[centre]).toBeGreaterThan(230);
      expect(pixels[0]).toBeLessThan(80);
    }
  });
  it("rejects malformed params, versions, duplicate ids and oversized images", () => {
    expect(() =>
      assertParams({ ...initialParams(), engineVersion: "unknown" }),
    ).toThrow();
    const params = initialParams();
    params.knots[0].x = NaN;
    expect(() => computeDye(params, 20)).toThrow();
    params.knots[0].x = 0.3;
    params.knots[1].id = params.knots[0].id;
    expect(() => computeDye(params, 20)).toThrow();
    expect(() => computeDye(initialParams(), 1025)).toThrow();
  });
});
