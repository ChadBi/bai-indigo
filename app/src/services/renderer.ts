import type { Renderer, RenderRequest, RenderResponse } from "../shared/types";

export class WorkerRenderer implements Renderer {
  private cancelCurrent?: () => void;
  constructor(
    private createWorker: () => Worker = () =>
      new Worker(new URL("../engine/dye.worker.ts", import.meta.url), {
        type: "module",
      }),
  ) {}
  render(
    request: RenderRequest,
    signal?: AbortSignal,
  ): Promise<Extract<RenderResponse, { ok: true }>> {
    this.cancelCurrent?.();
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("已取消", "AbortError"));
        return;
      }
      let worker: Worker;
      try {
        worker = this.createWorker();
      } catch (error) {
        reject(error);
        return;
      }
      let settled = false;
      const finish = (
        error?: unknown,
        result?: Extract<RenderResponse, { ok: true }>,
      ) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
        worker.terminate();
        if (this.cancelCurrent === abort) this.cancelCurrent = undefined;
        if (result) resolve(result);
        else reject(error);
      };
      const abort = () => finish(new DOMException("已取消", "AbortError"));
      const timeout = setTimeout(
        () => finish(new Error("染色计算超时，请重试。")),
        15000,
      );
      this.cancelCurrent = abort;
      signal?.addEventListener("abort", abort, { once: true });
      worker.onmessage = ({ data }: MessageEvent<RenderResponse>) => {
        if (data.requestId !== request.requestId) return;
        if (data.ok) finish(undefined, data);
        else finish(new Error(data.message));
      };
      worker.onerror = () =>
        finish(new Error("染色线程启动或计算失败，请重试。"));
      worker.onmessageerror = () => finish(new Error("无法读取染色结果。"));
      try {
        worker.postMessage(request);
      } catch (error) {
        finish(error);
      }
    });
  }
  dispose(): void {
    this.cancelCurrent?.();
  }
}
