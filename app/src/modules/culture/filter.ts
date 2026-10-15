import type { CultureEntry } from "../../shared/types";

export const ALL_CATEGORIES = "全部";

export interface CultureEmptyState {
  title: string;
  description: string;
  canShowAll: boolean;
}

export function getCultureEmptyState(
  entries: readonly CultureEntry[],
  visibleEntries: readonly CultureEntry[],
  category: string,
): CultureEmptyState | undefined {
  if (visibleEntries.length) return undefined;
  if (!entries.length) {
    return {
      title: "暂无资料",
      description: "文化资料将在核对来源后加入。",
      canShowAll: false,
    };
  }
  return {
    title: "该分类暂无内容",
    description: `“${category}”分类下暂无内容。`,
    canShowAll: true,
  };
}

export function getCultureCategories(
  entries: readonly CultureEntry[],
): string[] {
  return [ALL_CATEGORIES, ...new Set(entries.map((entry) => entry.category))];
}

export function filterCultureEntries(
  entries: readonly CultureEntry[],
  category: string,
): readonly CultureEntry[] {
  return category === ALL_CATEGORIES
    ? entries
    : entries.filter((entry) => entry.category === category);
}
