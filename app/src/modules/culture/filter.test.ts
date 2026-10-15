import { describe, expect, it } from "vitest";
import type { CultureEntry } from "../../shared/types";
import {
  ALL_CATEGORIES,
  filterCultureEntries,
  getCultureEmptyState,
  getCultureCategories,
} from "./filter";

const entries: readonly CultureEntry[] = [
  {
    id: "test-a",
    title: "测试条目 A",
    category: "测试分类 A",
    kind: "original",
    summary: "仅用于分类筛选测试。",
    body: [],
    images: [],
    sourceRefs: [],
    relatedPatternIds: [],
  },
  {
    id: "test-b",
    title: "测试条目 B",
    category: "测试分类 B",
    kind: "original",
    summary: "仅用于分类筛选测试。",
    body: [],
    images: [],
    sourceRefs: [],
    relatedPatternIds: [],
  },
];

describe("culture category filtering", () => {
  it("extracts unique categories dynamically after 全部", () => {
    expect(getCultureCategories(entries)).toEqual([
      ALL_CATEGORIES,
      "测试分类 A",
      "测试分类 B",
    ]);
  });

  it("returns all entries or only the selected category", () => {
    expect(filterCultureEntries(entries, ALL_CATEGORIES)).toEqual(entries);
    expect(filterCultureEntries(entries, "测试分类 B")).toEqual([entries[1]]);
  });

  it("handles an empty entry list", () => {
    expect(getCultureCategories([])).toEqual([ALL_CATEGORIES]);
    expect(filterCultureEntries([], ALL_CATEGORIES)).toEqual([]);
    expect(getCultureEmptyState([], [], ALL_CATEGORIES)).toEqual({
      title: "暂无资料",
      description: "文化资料将在核对来源后加入。",
      canShowAll: false,
    });
  });

  it("shows a category-specific empty state with a way back to all", () => {
    expect(
      getCultureEmptyState(entries, [], "测试分类 A"),
    ).toEqual({
      title: "该分类暂无内容",
      description: "“测试分类 A”分类下暂无内容。",
      canShowAll: true,
    });
    expect(getCultureEmptyState(entries, [entries[0]], "测试分类 A")).toBe(
      undefined,
    );
  });
});
