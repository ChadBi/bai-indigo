import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createWorksStore } from "./works";
import { initialParams } from "../content/patterns";
import type {
  DyeWork,
  SessionDyeResult,
  WorksListResult,
  WorksRepository,
} from "../shared/types";
function result(id = "result-1"): SessionDyeResult {
  return {
    id,
    params: initialParams(),
    editor: { templateId: "four", defaultRadius: 0.13 },
    createdAt: "2026-10-12T12:00:00.000Z",
    image: new Blob(["pixels"], { type: "image/png" }),
    thumbnail: new Blob(["thumb"], { type: "image/png" }),
  };
}
function repo() {
  const records = new Map<string, DyeWork>();
  const repository: WorksRepository = {
    listWorks: vi.fn(async () => ({
      items: [...records.values()],
      invalidCount: 0,
    })),
    getWork: vi.fn(async (id) => records.get(id)),
    saveWork: vi.fn(async (work) => {
      if (!records.has(work.id)) records.set(work.id, structuredClone(work));
      return records.get(work.id)!;
    }),
    renameWork: vi.fn(async (id, name) => {
      const work = { ...records.get(id)!, name };
      records.set(id, work);
      return work;
    }),
    deleteWork: vi.fn(async (id) => {
      records.delete(id);
    }),
    close: vi.fn(),
  };
  return { repository, records };
}
beforeEach(() => setActivePinia(createPinia()));
describe("automatic works saving", () => {
  it("supports valid string IDs that also name JavaScript prototype properties", async () => {
    const { repository } = repo(),
      store = createWorksStore(repository)();
    await store.saveResult(result("constructor"));
    expect(store.statuses["constructor"]).toBe("saved");
    await store.rename("constructor", "蓝白之间");
    expect(store.items[0].name).toBe("蓝白之间");
    await store.remove("constructor");
    expect(store.items).toHaveLength(0);
    store.dispose();
  });
  it("keeps failed snapshots for same-id retry and records success only after commit", async () => {
    const { repository, records } = repo(),
      store = createWorksStore(repository)(),
      original = result();
    vi.mocked(repository.saveWork).mockRejectedValueOnce(new Error("quota"));
    await store.saveResult(original);
    expect(store.statuses[original.id]).toBe("error");
    expect(store.items).toHaveLength(0);
    original.params.depth = "light";
    expect(store.pending[0].params.depth).toBe("deep");
    await store.retry(original.id);
    expect(store.statuses[original.id]).toBe("saved");
    expect(store.pending).toHaveLength(0);
    expect(records.size).toBe(1);
    await store.saveResult(original);
    expect(repository.saveWork).toHaveBeenCalledTimes(2);
    store.dispose();
  });
  it("does not duplicate in-flight saves or resurrect deleted results", async () => {
    const { repository, records } = repo(),
      store = createWorksStore(repository)(),
      original = result();
    let finish!: (work: DyeWork) => void;
    vi.mocked(repository.saveWork).mockImplementationOnce(
      (work) =>
        new Promise((resolve) => {
          finish = (saved) => {
            records.set(work.id, saved);
            resolve(saved);
          };
        }),
    );
    const saving = store.saveResult(original);
    await store.saveResult(original);
    expect(repository.saveWork).toHaveBeenCalledOnce();
    expect(store.statuses[original.id]).toBe("saving");
    store.discard(original.id);
    expect(store.pending).toHaveLength(1);
    finish(store.pending[0]);
    await saving;
    await store.remove(original.id);
    await store.saveResult(original);
    expect(records.size).toBe(0);
    expect(repository.saveWork).toHaveBeenCalledOnce();
    store.dispose();
  });
  it("does not let an old list response remove a newly saved record", async () => {
    const { repository } = repo(),
      store = createWorksStore(repository)();
    let finish!: (list: WorksListResult) => void;
    vi.mocked(repository.listWorks).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const loading = store.load();
    await store.saveResult(result());
    finish({ items: [], invalidCount: 0 });
    await loading;
    await Promise.resolve();
    await Promise.resolve();
    expect(store.items).toHaveLength(1);
    expect(repository.listWorks).toHaveBeenCalledTimes(2);
    store.dispose();
  });
  it("leaves records unchanged on failed rename/delete and removes only failed pending items", async () => {
    const { repository } = repo(),
      store = createWorksStore(repository)();
    await store.saveResult(result());
    vi.mocked(repository.renameWork).mockRejectedValueOnce(
      new Error("rename failed"),
    );
    await expect(store.rename("result-1", "新名称")).rejects.toThrow();
    expect(store.items[0].name).toMatch(/^染作 /);
    vi.mocked(repository.deleteWork).mockRejectedValueOnce(
      new Error("delete failed"),
    );
    await expect(store.remove("result-1")).rejects.toThrow();
    expect(store.items).toHaveLength(1);
    vi.mocked(repository.saveWork).mockRejectedValueOnce(new Error("quota"));
    await store.saveResult(result("failed"));
    store.discard("failed");
    expect(store.pending).toHaveLength(0);
    expect(store.items).toHaveLength(1);
    store.dispose();
  });
});
