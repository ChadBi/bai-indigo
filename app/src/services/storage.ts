import type { Draft, DraftRepository } from "../shared/types";
import { assertDraft } from "../shared/validation";

export class IndexedDbDraftRepository implements DraftRepository {
  private opening?: Promise<IDBDatabase>;
  private writes: Promise<void> = Promise.resolve();
  constructor(
    private factory: IDBFactory | undefined = globalThis.indexedDB,
    private name = "bai-indigo",
  ) {}
  private open(): Promise<IDBDatabase> {
    if (this.opening) return this.opening;
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      if (!this.factory) {
        reject(new Error("浏览器未开放本地存储。"));
        return;
      }
      const request = this.factory.open(this.name, 1);
      let abandoned = false;
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("drafts"))
          db.createObjectStore("drafts");
        if (!db.objectStoreNames.contains("works"))
          db.createObjectStore("works", { keyPath: "id" });
      };
      request.onblocked = () => {
        abandoned = true;
        reject(new Error("本地数据被其他页面占用，请关闭旧页面后重试。"));
      };
      request.onerror = () =>
        reject(request.error ?? new Error("无法打开本地存储。"));
      request.onsuccess = () => {
        const db = request.result;
        if (abandoned) {
          db.close();
          return;
        }
        db.onversionchange = () => {
          db.close();
          this.opening = undefined;
        };
        resolve(db);
      };
    });
    this.opening = opening;
    void opening.catch(() => {
      if (this.opening === opening) this.opening = undefined;
    });
    return opening;
  }
  async readDraft(): Promise<unknown | undefined> {
    await this.writes;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", "readonly"),
        request = tx.objectStore("drafts").get("current");
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () =>
        reject(tx.error ?? request.error ?? new Error("无法读取草稿。"));
      tx.onerror = () => {};
    });
  }
  private enqueue(operation: (store: IDBObjectStore) => void): Promise<void> {
    const job = this.writes.then(async () => {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("drafts", "readwrite");
        tx.oncomplete = () => resolve();
        tx.onabort = () =>
          reject(tx.error ?? new Error("草稿保存失败，请检查浏览器存储空间。"));
        tx.onerror = () => {};
        try {
          operation(tx.objectStore("drafts"));
        } catch (error) {
          tx.abort();
          reject(error);
        }
      });
    });
    this.writes = job.catch(() => {});
    return job;
  }
  writeDraft(draft: Draft): Promise<void> {
    assertDraft(draft);
    const snapshot = structuredClone(draft);
    return this.enqueue((store) => {
      store.put(snapshot, "current");
    });
  }
  deleteDraft(): Promise<void> {
    return this.enqueue((store) => {
      store.delete("current");
    });
  }
  close(): void {
    const opening = this.opening;
    this.opening = undefined;
    void this.writes
      .then(() => opening?.then((db) => db.close()))
      .catch(() => {});
  }
}
