import { ENGINE_VERSION, SCHEMA_VERSION } from "../shared/types";
import type { DyeParams, PatternTemplate } from "../shared/types";
import { cloneParams } from "../shared/validation";

const base: DyeParams = {
  schemaVersion: SCHEMA_VERSION,
  engineVersion: ENGINE_VERSION,
  seed: 731,
  style: "circle",
  fold: "none",
  depth: "deep",
  knots: [],
};
export const patterns: readonly PatternTemplate[] = [
  {
    id: "four",
    title: "四方纹",
    summary: "四处扎结，观察位置与留白的关系。",
    kind: "original",
    sourceRefs: [],
    defaultRadius: 0.13,
    params: {
      ...base,
      knots: [
        [0.27, 0.28],
        [0.71, 0.32],
        [0.31, 0.72],
        [0.69, 0.68],
      ].map(([x, y], i) => ({ id: `four-${i}`, x, y, radius: 0.13 })),
    },
  },
  {
    id: "flower",
    title: "单花纹",
    summary: "从中央的一处扎结开始。",
    kind: "original",
    sourceRefs: [],
    defaultRadius: 0.23,
    params: {
      ...base,
      knots: [{ id: "flower-0", x: 0.5, y: 0.5, radius: 0.23 }],
    },
  },
  {
    id: "stripe",
    title: "折叠条纹",
    summary: "三道留白，形成条纹的节奏。",
    kind: "original",
    sourceRefs: [],
    defaultRadius: 0.13,
    params: {
      ...base,
      style: "stripe",
      knots: [0.22, 0.5, 0.78].map((y, i) => ({
        id: `stripe-${i}`,
        x: 0.5,
        y,
        radius: 0.13,
      })),
    },
  },
  {
    id: "free",
    title: "自由扎结",
    summary: "空白方案。自由加点将在编辑功能迁移后开放。",
    kind: "original",
    sourceRefs: [],
    defaultRadius: 0.13,
    params: { ...base, knots: [] },
  },
];
export function initialParams(): DyeParams {
  return cloneParams(patterns[0].params);
}
