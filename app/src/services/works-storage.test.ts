import { afterEach, describe, expect, it, vi } from "vitest";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { IndexedDbDraftRepository, IndexedDbWorksRepository } from "./storage";
import { initialParams } from "../content/patterns";
import type { DyeWork } from "../shared/types";
export function sampleWork(id = "work-1"): DyeWork {
  return {
    id,
    name: "第一块蓝布",
    params: initialParams(),
    editor: { templateId: "four", defaultRadius: 0.13 },
    createdAt: "2026-10-12T12:00:00.000Z",
    updatedAt: "2026-10-12T12:00:00.000Z",
    image: new Blob(["pixels"], { type: "image/png" }),
    thumbnail: new Blob(["thumb"], { type: "image/png" }),
  };
}
afterEach(() => vi.restoreAllMocks());
describe("local works repository", () => {
  it("persists images and editor data without changing existing drafts", async () => {
    const factory = new IDBFactory(),
      drafts = new IndexedDbDraftRepository(factory),
      works = new IndexedDbWorksRepository(factory),
      work = sampleWork();
    const draft = {
      params: initialParams(),
      templateId: "four" as const,
      defaultRadius: 0.13,
      updatedAt: new Date().toISOString(),
    };
    await drafts.writeDraft(draft);
    await works.saveWork(work);
    works.close();
    const reopened = new IndexedDbWorksRepository(factory),
      loaded = await reopened.getWork(work.id);
    expect(loaded?.editor).toEqual(work.editor);
    expect(await loaded?.image.text()).toBe("pixels");
    expect(await drafts.readDraft()).toEqual(draft);
    expect((await reopened.listWorks()).items).toHaveLength(1);
    drafts.close();
    reopened.close();
  });
  it("snapshots queued inputs, retries by id and never overwrites a renamed original", async () => {
    const repository = new IndexedDbWorksRepository(new IDBFactory()),
      work = sampleWork();
    const saving = repository.saveWork(work);
    work.params.depth = "light";
    await saving;
    expect((await repository.getWork(work.id))?.params.depth).toBe("deep");
    const renamed = await repository.renameWork(work.id, "  蓝白之间  ");
    expect(renamed.name).toBe("蓝白之间");
    await repository.saveWork(work);
    expect((await repository.getWork(work.id))?.name).toBe("蓝白之间");
    expect((await repository.listWorks()).items).toHaveLength(1);
    expect(await renamed.image.text()).toBe("pixels");
    expect(renamed.createdAt).toBe(work.createdAt);
    repository.close();
  });
  it("keeps successful records on failed add, rename and delete, then permits retries", async () => {
    const repository = new IndexedDbWorksRepository(new IDBFactory()),
      work = sampleWork();
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementationOnce(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    await expect(repository.saveWork(work)).rejects.toThrow();
    expect((await repository.listWorks()).items).toHaveLength(0);
    await repository.saveWork(work);
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => {
      throw new Error("rename failed");
    });
    await expect(repository.renameWork(work.id, "新名称")).rejects.toThrow();
    expect((await repository.getWork(work.id))?.name).toBe(work.name);
    vi.spyOn(IDBObjectStore.prototype, "delete").mockImplementationOnce(() => {
      throw new Error("delete failed");
    });
    await expect(repository.deleteWork(work.id)).rejects.toThrow();
    expect(await repository.getWork(work.id)).toBeDefined();
    await repository.deleteWork(work.id);
    expect(await repository.getWork(work.id)).toBeUndefined();
    await expect(repository.renameWork(work.id, "新名称")).rejects.toThrow(
      "不存在",
    );
    repository.close();
  });
  it("isolates corrupt records and sorts valid records newest first", async () => {
    const factory = new IDBFactory(),
      repository = new IndexedDbWorksRepository(factory),
      old = sampleWork(),
      latest = {
        ...sampleWork("work-2"),
        createdAt: "2026-10-12T13:00:00.000Z",
      };
    await repository.saveWork(old);
    await repository.saveWork(latest);
    await new Promise<void>((resolve, reject) => {
      const open = factory.open("bai-indigo", 1);
      open.onsuccess = () => {
        const db = open.result,
          tx = db.transaction("works", "readwrite");
        tx.objectStore("works").put({ id: "broken", name: "broken" });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => reject(tx.error);
      };
    });
    const list = await repository.listWorks();
    expect(list.invalidCount).toBe(1);
    expect(list.items.map((item) => item.id)).toEqual(["work-2", "work-1"]);
    await expect(repository.getWork("broken")).rejects.toThrow();
    expect((await repository.listWorks()).invalidCount).toBe(1);
    repository.close();
  });
  it("rejects invalid names and versions without rewriting the original", async () => {
    const repository = new IndexedDbWorksRepository(new IDBFactory()),
      work = sampleWork();
    await repository.saveWork(work);
    expect(() => repository.renameWork(work.id, "   ")).toThrow();
    expect(() => repository.renameWork(work.id, "字".repeat(41))).toThrow();
    expect(() =>
      repository.saveWork({
        ...work,
        params: { ...work.params, engineVersion: "future" },
      } as unknown as DyeWork),
    ).toThrow();
    expect((await repository.getWork(work.id))?.name).toBe(work.name);
    repository.close();
  });
});
