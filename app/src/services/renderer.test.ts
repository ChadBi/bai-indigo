import { describe, it, expect, vi } from "vitest";
import { WorkerRenderer } from "./renderer";
import { initialParams } from "../content/patterns";
import type { RenderRequest } from "../shared/types";
class FakeWorker {
  onmessage: Worker["onmessage"] = null;
  onerror: Worker["onerror"] = null;
  onmessageerror: Worker["onmessageerror"] = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  reply(id: number) {
    this.onmessage?.call(
      this as unknown as Worker,
      new MessageEvent("message", {
        data: {
          ok: true,
          requestId: id,
          size: 2,
          pixels: new Uint8ClampedArray(16),
        },
      }),
    );
  }
}
const request = (id: number): RenderRequest => ({
  params: initialParams(),
  size: 2,
  requestId: id,
});
describe("worker renderer", () => {
  it("cancels obsolete jobs and only accepts the matching request", async () => {
    const workers: FakeWorker[] = [],
      renderer = new WorkerRenderer(() => {
        const w = new FakeWorker();
        workers.push(w);
        return w as unknown as Worker;
      });
    const old = renderer.render(request(1));
    const rejected = expect(old).rejects.toMatchObject({ name: "AbortError" });
    const latest = renderer.render(request(2));
    workers[0].reply(1);
    workers[1].reply(1);
    workers[1].reply(2);
    await rejected;
    expect((await latest).requestId).toBe(2);
    expect(workers.every((w) => w.terminate.mock.calls.length === 1)).toBe(
      true,
    );
  });
  it("aborts on signal and disposes outstanding work", async () => {
    const worker = new FakeWorker(),
      renderer = new WorkerRenderer(() => worker as unknown as Worker),
      controller = new AbortController();
    const promise = renderer.render(request(1), controller.signal);
    const check = expect(promise).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await check;
    const second = renderer.render(request(2));
    const check2 = expect(second).rejects.toMatchObject({ name: "AbortError" });
    renderer.dispose();
    await check2;
  });
  it("rejects worker errors", async () => {
    const worker = new FakeWorker(),
      renderer = new WorkerRenderer(() => worker as unknown as Worker);
    const pending = renderer.render(request(1));
    const check = expect(pending).rejects.toThrow("染色线程");
    worker.onerror?.call(
      worker as unknown as Worker,
      new Event("error") as ErrorEvent,
    );
    await check;
  });
});
