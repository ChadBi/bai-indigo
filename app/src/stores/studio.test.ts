import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { createStudioStore } from "./studio";
import { initialParams } from "../content/patterns";
import type { Draft, DraftRepository } from "../shared/types";
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
});
