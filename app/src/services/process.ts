import type {
  DyeParams,
  Renderer,
  RenderResponse,
  EncodedDyeResult,
  StudioPhase,
} from "../shared/types";
import { cloneParams } from "../shared/validation";

export interface AnimationClock {
  now(): number;
  request(callback: (now: number) => void): number;
  cancel(id: number): void;
}
interface ProcessOptions {
  renderer: Renderer;
  encode(
    result: Extract<RenderResponse, { ok: true }>,
    params: DyeParams,
    signal: AbortSignal,
  ): Promise<EncodedDyeResult>;
  onState(phase: StudioPhase, progress: number): void;
  onComplete(result: EncodedDyeResult): void;
  onError(message: string): void;
  clock?: AnimationClock;
}
export class DyeProcess {
  private generation = 0;
  private controller?: AbortController;
  private frame?: number;
  private candidate?: EncodedDyeResult;
  private phase: StudioPhase = "edit";
  private reduced = false;
  private clock: AnimationClock;
  constructor(private options: ProcessOptions) {
    this.clock = options.clock ?? {
      now: () => performance.now(),
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
    };
  }
  private state(phase: StudioPhase, progress = 0) {
    this.phase = phase;
    this.options.onState(phase, progress);
  }
  async start(params: DyeParams, reducedMotion = false): Promise<void> {
    this.dispose();
    const generation = this.generation,
      controller = new AbortController();
    this.controller = controller;
    this.reduced = reducedMotion;
    const snapshot = cloneParams(params);
    this.state("preparing");
    try {
      const pixels = await this.options.renderer.render(
        { params: snapshot, size: 1024, requestId: generation },
        controller.signal,
      );
      if (generation !== this.generation) return;
      const candidate = await this.options.encode(
        pixels,
        snapshot,
        controller.signal,
      );
      if (generation !== this.generation || controller.signal.aborted) return;
      this.candidate = candidate;
      if (this.reduced) {
        this.state("tied", 1);
        return;
      }
      this.state("dye");
      const start = this.clock.now();
      const tick = (now: number) => {
        if (generation !== this.generation) return;
        const t = Math.min(1, (now - start) / 3400);
        this.state(t < 0.62 ? "dye" : "oxidize", t);
        if (t < 1) this.frame = this.clock.request(tick);
        else {
          this.frame = undefined;
          this.state("tied", 1);
        }
      };
      this.frame = this.clock.request(tick);
    } catch (error) {
      if (generation !== this.generation || controller.signal.aborted) return;
      this.dispose();
      this.phase = "edit";
      this.options.onError(
        error instanceof Error ? error.message : "制作失败，请重试。",
      );
    }
  }
  skip() {
    if (!this.candidate || !["dye", "oxidize"].includes(this.phase)) return;
    if (this.frame !== undefined) this.clock.cancel(this.frame);
    this.frame = undefined;
    this.state("tied", 1);
  }
  untie() {
    if (this.phase !== "tied" || !this.candidate) return;
    this.state("unfold");
    const generation = this.generation;
    const finish = () => {
      if (generation !== this.generation || !this.candidate) return;
      this.frame = undefined;
      this.state("unfold", 1);
      const result = this.candidate;
      this.candidate = undefined;
      this.options.onComplete(result);
      this.phase = "done";
    };
    if (this.reduced) {
      finish();
      return;
    }
    const start = this.clock.now();
    const tick = (now: number) => {
      if (generation !== this.generation) return;
      const t = Math.min(1, (now - start) / 1100);
      this.state("unfold", t);
      if (t < 1) this.frame = this.clock.request(tick);
      else finish();
    };
    this.frame = this.clock.request(tick);
  }
  dispose() {
    this.generation++;
    this.controller?.abort();
    this.controller = undefined;
    this.options.renderer.dispose();
    if (this.frame !== undefined) this.clock.cancel(this.frame);
    this.frame = undefined;
    this.candidate = undefined;
    this.phase = "edit";
  }
}
