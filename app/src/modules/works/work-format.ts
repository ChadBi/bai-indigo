import type { DyeWork } from "../../shared/types";
import { effectiveKnots } from "../../engine/dye";
export function workSummary(work: DyeWork): string {
  return `${effectiveKnots(work.params).length} 处扎结 · ${{ none: "不折叠", half: "对折", quarter: "四折" }[work.params.fold]} · ${{ light: "浅染", medium: "中染", deep: "深染" }[work.params.depth]}`;
}
export function workTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
