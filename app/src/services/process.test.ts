import { describe, it, expect, vi } from "vitest";
import { DyeProcess } from "./process";
import type { AnimationClock } from "./process";
import type { Renderer, SessionDyeResult, StudioPhase } from "../shared/types";
import { initialParams } from "../content/patterns";
class Clock implements AnimationClock {
  time = 0;
  id = 0;
  tasks = new Map<number, (now: number) => void>();
  now = () => this.time;
  request = (callback: (now: number) => void) => {
    this.tasks.set(++this.id, callback);
    return this.id;
  };
  cancel = (id: number) => {
    this.tasks.delete(id);
  };
  step(ms: number) {
    this.time += ms;
    const tasks = [...this.tasks.values()];
    this.tasks.clear();
    tasks.forEach((task) => task(this.time));
  }
}
function fixture() {
  const clock = new Clock(),
    states: StudioPhase[] = [],
    complete = vi.fn(),
    error = vi.fn();
  const renderer: Renderer = {
    render: vi.fn<Renderer["render"]>(async (request) => ({
      ok: true,
      requestId: request.requestId,
      size: 1024,
      pixels: new Uint8ClampedArray(4),
    })),
    dispose: vi.fn(),
  };
  const encode = vi.fn(
    async (_pixels, params): Promise<SessionDyeResult> => ({
      params,
      image: new Blob(["image"]),
      thumbnail: new Blob(["thumb"]),
      createdAt: new Date().toISOString(),
    }),
  );
  const process = new DyeProcess({
    renderer,
    encode,
    clock,
    onState: (phase) => states.push(phase),
    onComplete: complete,
    onError: error,
  });
  return { clock, states, complete, error, renderer, encode, process };
}
describe("dye process", () => {
  it("freezes params and runs dye, oxidation, tied, and unfolding exactly once", async () => {
    const f = fixture(),
      params = initialParams(),
      start = f.process.start(params);
    params.depth = "light";
    await start;
    expect(f.states.at(-1)).toBe("dye");
    expect(f.encode.mock.calls[0][1].depth).toBe("deep");
    f.clock.step(2200);
    expect(f.states.at(-1)).toBe("oxidize");
    f.clock.step(1200);
    expect(f.states.at(-1)).toBe("tied");
    expect(f.complete).not.toHaveBeenCalled();
    f.process.untie();
    f.clock.step(1100);
    expect(f.complete).toHaveBeenCalledOnce();
    f.process.untie();
    f.clock.step(5000);
    expect(f.complete).toHaveBeenCalledOnce();
    f.process.dispose();
  });
  it("skips animation but still requires untying, including reduced motion", async () => {
    const f = fixture();
    await f.process.start(initialParams());
    f.process.skip();
    expect(f.states.at(-1)).toBe("tied");
    expect(f.complete).not.toHaveBeenCalled();
    f.process.untie();
    f.clock.step(1100);
    expect(f.complete).toHaveBeenCalledOnce();
    await f.process.start(initialParams(), true);
    expect(f.states.at(-1)).toBe("tied");
    expect(f.clock.tasks.size).toBe(0);
    f.process.untie();
    expect(f.complete).toHaveBeenCalledTimes(2);
    f.process.dispose();
  });
  it("ignores stale computation and encoding after cancellation", async () => {
    const f = fixture();
    let finish!: () => void;
    f.encode.mockImplementationOnce(async (_pixels, params) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return {
        params,
        image: new Blob(),
        thumbnail: new Blob(),
        createdAt: new Date().toISOString(),
      };
    });
    const old = f.process.start(initialParams());
    await Promise.resolve();
    await Promise.resolve();
    f.process.dispose();
    finish();
    await old;
    expect(f.states.at(-1)).toBe("preparing");
    expect(f.complete).not.toHaveBeenCalled();
    expect(f.clock.tasks.size).toBe(0);
    await f.process.start(initialParams(), true);
    f.process.untie();
    expect(f.complete).toHaveBeenCalledOnce();
    f.process.dispose();
  });
  it("reports encoding failures and can retry without losing parameters", async () => {
    const f = fixture();
    f.encode.mockRejectedValueOnce(new Error("PNG 编码失败"));
    await f.process.start(initialParams());
    expect(f.error).toHaveBeenCalledWith("PNG 编码失败");
    expect(f.complete).not.toHaveBeenCalled();
    await f.process.start(initialParams(), true);
    f.process.untie();
    expect(f.complete).toHaveBeenCalledOnce();
    f.process.dispose();
  });
  it("cancels a scheduled animation on disposal", async () => {
    const f = fixture();
    await f.process.start(initialParams());
    f.process.dispose();
    f.clock.step(5000);
    expect(f.clock.tasks.size).toBe(0);
    expect(f.complete).not.toHaveBeenCalled();
  });
  it("never encodes an obsolete worker result", async () => {
    const f = fixture();
    let finish!: (result: Awaited<ReturnType<Renderer["render"]>>) => void;
    vi.mocked(f.renderer.render).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const old = f.process.start(initialParams());
    f.process.dispose();
    finish({
      ok: true,
      requestId: 1,
      size: 1024,
      pixels: new Uint8ClampedArray(4),
    });
    await old;
    expect(f.encode).not.toHaveBeenCalled();
    expect(f.complete).not.toHaveBeenCalled();
    expect(f.error).not.toHaveBeenCalled();
  });
});
