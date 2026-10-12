import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { createStudioStore } from "./studio";
import { initialParams } from "../content/patterns";
import type { Draft, DraftRepository } from "../shared/types";
import type { DyeWork } from "../shared/types";
const sample = (): Draft => ({
  params: initialParams(),
  templateId: "four",
  defaultRadius: 0.13,
  updatedAt: new Date().toISOString(),
});
function repository(value: unknown = undefined): DraftRepository {
  return {
    readDraft: vi.fn().mockResolvedValue(value),
    writeDraft: vi.fn().mockResolvedValue(undefined),
    deleteDraft: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  };
}
describe("studio recovery and saves", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());
  it("does not save defaults before recovery and restores saved parameters", async () => {
    const draft = sample();
    draft.params.depth = "light";
    const repo = repository(draft),
      store = createStudioStore(repo)();
    store.setDepth("medium");
    expect(repo.writeDraft).not.toHaveBeenCalled();
    await store.initialize();
    expect(store.params.depth).toBe("light");
    expect(repo.writeDraft).not.toHaveBeenCalled();
    store.dispose();
  });
  it("debounces 500ms, retains failed edits and retries", async () => {
    const repo = repository(),
      store = createStudioStore(repo)();
    await store.initialize();
    vi.mocked(repo.writeDraft).mockRejectedValueOnce(new Error("quota"));
    store.setDepth("light");
    await vi.advanceTimersByTimeAsync(499);
    expect(repo.writeDraft).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(store.saveState).toBe("error");
    expect(store.params.depth).toBe("light");
    await store.saveNow();
    expect(store.saveState).toBe("saved");
    store.dispose();
  });
  it("protects invalid drafts until explicit reset", async () => {
    const repo = repository({
        ...sample(),
        params: { ...initialParams(), engineVersion: "future" },
      }),
      store = createStudioStore(repo)();
    await store.initialize();
    expect(store.recovery).toBe("invalid");
    store.setDepth("light");
    await store.saveNow();
    expect(repo.writeDraft).not.toHaveBeenCalled();
    await store.resetDraft();
    expect(repo.deleteDraft).toHaveBeenCalledOnce();
    expect(store.params.depth).toBe("deep");
    expect(repo.writeDraft).toHaveBeenCalledOnce();
    store.dispose();
  });
  it("does not report an old save as the latest saved revision", async () => {
    const repo = repository(),
      store = createStudioStore(repo)();
    await store.initialize();
    let finish!: () => void;
    vi.mocked(repo.writeDraft).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    store.setDepth("light");
    const saving = store.saveNow();
    store.setDepth("medium");
    finish();
    await saving;
    expect(store.saveState).toBe("pending");
    await vi.advanceTimersByTimeAsync(500);
    expect(store.saveState).toBe("saved");
    expect(vi.mocked(repo.writeDraft).mock.calls.at(-1)?.[0].params.depth).toBe(
      "medium",
    );
    store.dispose();
  });
  it("groups drag and radius edits and cancels uncommitted additions", async () => {
    const repo = repository(),
      store = createStudioStore(repo)();
    await store.initialize();
    const id = store.params.knots[0].id,
      original = store.params.knots[0].x;
    store.beginEdit();
    store.selectKnot(id);
    store.moveKnot(id, 0.4, 0.4, false, false, true);
    store.moveKnot(id, 0.5, 0.5, false, false, true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(repo.writeDraft).not.toHaveBeenCalled();
    expect(store.history).toHaveLength(0);
    store.commitEdit();
    expect(store.history).toHaveLength(1);
    store.undo();
    expect(store.params.knots[0].x).toBe(original);
    store.selectKnot(null);
    store.setRadius(0.2, true);
    store.setRadius(0.21, true);
    store.setRadius(0.22, true);
    store.commitEdit();
    expect(store.history).toHaveLength(1);
    store.undo();
    expect(store.defaultRadius).toBe(0.13);
    store.beginEdit();
    store.addKnot(0.6, 0.6, true);
    store.cancelEdit();
    expect(store.params.knots).toHaveLength(4);
    expect(store.selectedId).toBeNull();
    store.dispose();
  });
  it("ignores noops, caps history and knot count, and distinguishes radius scope", async () => {
    const store = createStudioStore(repository())();
    await store.initialize();
    store.selectKnot(store.params.knots[0].id);
    store.setDepth("deep");
    store.beginEdit();
    store.commitEdit();
    expect(store.history).toHaveLength(0);
    store.setRadius(0.2);
    expect(store.params.knots[0].radius).toBe(0.2);
    expect(store.params.knots[1].radius).toBe(0.13);
    expect(store.defaultRadius).toBe(0.13);
    store.selectKnot(null);
    store.setRadius(0.18);
    expect(store.params.knots.every((k) => k.radius === 0.18)).toBe(true);
    expect(store.defaultRadius).toBe(0.18);
    for (let i = 0; i < 40; i++) store.setDepth(i % 2 ? "deep" : "light");
    expect(store.history).toHaveLength(30);
    while (store.params.knots.length < 12) store.addKnot();
    const length = store.history.length;
    expect(store.addKnot()).toBeNull();
    expect(store.history).toHaveLength(length);
    store.dispose();
  });
  it("moves a reflected knot through the original id and clamps coordinates", async () => {
    const store = createStudioStore(repository())();
    await store.initialize();
    const id = store.params.knots[0].id;
    store.setFold("quarter");
    store.moveKnot(id, 0.8, 0.9, true, true);
    expect(store.params.knots[0].x).toBeCloseTo(0.2);
    expect(store.params.knots[0].y).toBeCloseTo(0.1);
    store.moveKnot(id, -4, 10);
    expect(store.params.knots[0].x).toBe(0.025);
    expect(store.params.knots[0].y).toBe(0.975);
    store.dispose();
  });
  it("locks every edit action during production and isolates completed snapshots", async () => {
    const store = createStudioStore(repository())();
    await store.initialize();
    const snapshot = store.beginProcess()!,
      before = JSON.stringify(store.params);
    store.addKnot();
    store.clearKnots();
    store.setDepth("light");
    store.selectPattern("flower");
    store.undo();
    await store.resetDraft();
    expect(JSON.stringify(store.params)).toBe(before);
    store.updateProcess("unfold", 1);
    store.finishProcess({
      params: snapshot,
      image: new Blob(),
      thumbnail: new Blob(),
      createdAt: new Date().toISOString(),
    });
    store.reedit();
    store.setDepth("light");
    expect(store.currentResult?.params.depth).toBe("deep");
    for (let i = 0; i < 2; i++) {
      const params = store.beginProcess()!;
      store.updateProcess("unfold", 1);
      store.finishProcess({
        params,
        image: new Blob(),
        thumbnail: new Blob(),
        createdAt: new Date().toISOString(),
      });
      store.reedit();
    }
    expect(store.results).toHaveLength(2);
    store.dispose();
  });
  it("undo during a gesture cancels that gesture without consuming an older edit", async () => {
    const store = createStudioStore(repository())();
    await store.initialize();
    const id = store.params.knots[0].id;
    store.setFold("half");
    store.moveKnot(id, 0.4, 0.4, false, false, true);
    store.undo();
    expect(store.params.knots[0].x).toBe(0.27);
    expect(store.params.fold).toBe("half");
    expect(store.history).toHaveLength(1);
    store.undo();
    expect(store.params.fold).toBe("none");
    store.dispose();
  });
  it("loads a separate editable copy with exact editor metadata and does not add a session result", async () => {
    const repositoryInstance = repository(),
      store = createStudioStore(repositoryInstance)();
    await store.initialize();
    store.setDepth("light");
    const work: DyeWork = {
      id: "saved",
      name: "蓝布",
      params: initialParams(),
      editor: { templateId: "custom", defaultRadius: 0.21 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      image: new Blob(["png"], { type: "image/png" }),
      thumbnail: new Blob(["thumb"], { type: "image/png" }),
    };
    expect(store.differsFromWork(work)).toBe(true);
    await store.loadWorkForEditing(work);
    expect(store.history).toHaveLength(0);
    expect(store.results).toHaveLength(0);
    expect(store.defaultRadius).toBe(0.21);
    expect(store.templateId).toBe("custom");
    expect(store.differsFromWork(work)).toBe(false);
    store.setRadius(0.18);
    expect(work.params.knots[0].radius).toBe(0.13);
    expect(repositoryInstance.writeDraft).toHaveBeenCalled();
    store.dispose();
  });
  it("blocks loading works over a broken draft and retains loaded params when saving fails", async () => {
    const work: DyeWork = {
      id: "saved",
      name: "蓝布",
      params: initialParams(),
      editor: { templateId: "four", defaultRadius: 0.13 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      image: new Blob(["png"], { type: "image/png" }),
      thumbnail: new Blob(["thumb"], { type: "image/png" }),
    };
    const repositoryInstance = repository({ bad: true }),
      store = createStudioStore(repositoryInstance)();
    await store.initialize();
    await expect(store.loadWorkForEditing(work)).rejects.toThrow("草稿");
    expect(repositoryInstance.writeDraft).not.toHaveBeenCalled();
    await store.resetDraft();
    vi.mocked(repositoryInstance.writeDraft).mockRejectedValueOnce(
      new Error("quota"),
    );
    await store.loadWorkForEditing(work);
    expect(store.saveState).toBe("error");
    expect(store.params).toEqual(work.params);
    store.dispose();
  });
});
