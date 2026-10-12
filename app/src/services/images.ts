import type {
  DyeParams,
  RenderResponse,
  SessionDyeResult,
} from "../shared/types";
import { cloneParams } from "../shared/validation";

export function canvasFromPixels(
  result: Extract<RenderResponse, { ok: true }>,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = result.size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法生成成品画布。");
  context.putImageData(
    new ImageData(result.pixels, result.size, result.size),
    0,
    0,
  );
  return canvas;
}
function toPng(canvas: HTMLCanvasElement, signal: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, blob?: Blob) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      if (blob) resolve(blob);
      else reject(error);
    };
    const abort = () => finish(new DOMException("已取消", "AbortError"));
    const timeout = setTimeout(
      () => finish(new Error("PNG 编码超时，请重试制作。")),
      15000,
    );
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    try {
      canvas.toBlob((blob) => {
        if (blob) finish(undefined, blob);
        else finish(new Error("PNG 编码失败，请重试制作。"));
      }, "image/png");
    } catch {
      finish(new Error("PNG 编码失败，请重试制作。"));
    }
  });
}
export async function encodeDye(
  canvas: HTMLCanvasElement,
  params: DyeParams,
  signal: AbortSignal,
): Promise<SessionDyeResult> {
  const assertActive = () => {
    if (signal.aborted) throw new DOMException("已取消", "AbortError");
  };
  assertActive();
  const image = await toPng(canvas, signal);
  assertActive();
  const thumbnailCanvas = document.createElement("canvas");
  thumbnailCanvas.width = thumbnailCanvas.height = 260;
  const context = thumbnailCanvas.getContext("2d");
  if (!context) throw new Error("无法生成成品预览。");
  context.drawImage(canvas, 0, 0, 260, 260);
  const thumbnail = await toPng(thumbnailCanvas, signal);
  assertActive();
  return {
    params: cloneParams(params),
    image,
    thumbnail,
    createdAt: new Date().toISOString(),
  };
}
export function downloadResult(result: SessionDyeResult): void {
  const url = URL.createObjectURL(result.image),
    anchor = document.createElement("a");
  anchor.href = url;
  const fold = { none: "不折叠", half: "对折", quarter: "四折" }[
      result.params.fold
    ],
    depth = { light: "浅染", medium: "中染", deep: "深染" }[
      result.params.depth
    ];
  anchor.download = `染见白乡-${depth}-${fold}.png`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
