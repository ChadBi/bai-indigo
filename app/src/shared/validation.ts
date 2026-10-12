import { ENGINE_VERSION, SCHEMA_VERSION } from "./types";
import type { Draft, DyeParams, DyeWork } from "./types";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function bounded(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export function assertParams(value: unknown): asserts value is DyeParams {
  if (
    !record(value) ||
    value.schemaVersion !== SCHEMA_VERSION ||
    value.engineVersion !== ENGINE_VERSION
  )
    throw new Error("创作方案版本不受支持，请保留原草稿或明确重置。");
  if (
    !Number.isInteger(value.seed) ||
    !bounded(value.seed, 0, 0x7fffffff) ||
    typeof value.style !== "string" ||
    !["circle", "stripe"].includes(value.style) ||
    typeof value.fold !== "string" ||
    !["none", "half", "quarter"].includes(value.fold) ||
    typeof value.depth !== "string" ||
    !["light", "medium", "deep"].includes(value.depth) ||
    !Array.isArray(value.knots) ||
    value.knots.length > 12
  )
    throw new Error("创作参数无效。");
  const ids = new Set<string>();
  for (const knot of value.knots) {
    if (
      !record(knot) ||
      typeof knot.id !== "string" ||
      !knot.id ||
      ids.has(knot.id) ||
      !bounded(knot.x, 0, 1) ||
      !bounded(knot.y, 0, 1) ||
      !bounded(knot.radius, 0.06, 0.24)
    )
      throw new Error("扎结参数无效。");
    ids.add(knot.id);
  }
}
export function assertDraft(value: unknown): asserts value is Draft {
  if (!record(value)) throw new Error("草稿格式无效。");
  assertParams(value.params);
  if (
    typeof value.templateId !== "string" ||
    !["four", "flower", "stripe", "free", "custom"].includes(
      value.templateId,
    ) ||
    !bounded(value.defaultRadius, 0.06, 0.24) ||
    typeof value.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(value.updatedAt))
  )
    throw new Error("草稿信息无效。");
}
export function cloneParams(params: DyeParams): DyeParams {
  return { ...params, knots: params.knots.map((knot) => ({ ...knot })) };
}
export function normalizeWorkName(value: string): string {
  const name = value.trim();
  if ([...name].length < 1 || [...name].length > 40)
    throw new Error("作品名称须为 1—40 个字符。");
  return name;
}
export function assertWork(value: unknown): asserts value is DyeWork {
  if (
    !record(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.name !== "string"
  )
    throw new Error("作品记录格式无效。");
  if (normalizeWorkName(value.name) !== value.name)
    throw new Error("作品名称格式无效。");
  assertParams(value.params);
  if (!record(value.editor)) throw new Error("作品缺少编辑信息。");
  assertDraft({
    params: value.params,
    templateId: value.editor.templateId,
    defaultRadius: value.editor.defaultRadius,
    updatedAt: value.updatedAt,
  });
  if (
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !(value.image instanceof Blob) ||
    value.image.type !== "image/png" ||
    !value.image.size ||
    !(value.thumbnail instanceof Blob) ||
    value.thumbnail.type !== "image/png" ||
    !value.thumbnail.size
  )
    throw new Error("作品时间或图片数据无效。");
}
