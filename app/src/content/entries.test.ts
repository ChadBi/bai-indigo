import { describe, it, expect } from "vitest";
import { cultures, stories, glossary, faqs, sources } from "./entries";
import { patterns } from "./patterns";
describe("content provenance", () => {
  it("resolves every source and pattern reference", () => {
    const sourceIds = new Set(sources.map((s) => s.id)),
      patternIds = new Set(patterns.map((p) => p.id));
    for (const entry of [...cultures, ...stories, ...glossary, ...faqs])
      for (const id of entry.sourceRefs) expect(sourceIds.has(id)).toBe(true);
    for (const entry of [...cultures, ...stories]) {
      for (const id of entry.relatedPatternIds)
        expect(patternIds.has(id)).toBe(true);
      for (const image of entry.images) {
        expect(image.license).not.toBe("");
        for (const id of image.sourceRefs) expect(sourceIds.has(id)).toBe(true);
      }
    }
  });
  it("keeps experience templates and the illustrated story original", () => {
    expect(patterns.every((p) => p.kind === "original")).toBe(true);
    expect(stories[0].kind).toBe("original");
    expect(
      cultures.every(
        (c) => c.kind !== "traditional" || c.sourceRefs.length > 0,
      ),
    ).toBe(true);
  });
});
