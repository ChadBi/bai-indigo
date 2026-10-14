import type { CultureEntry } from "../../shared/types";

export const ALL_CATEGORIES = "全部";

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
