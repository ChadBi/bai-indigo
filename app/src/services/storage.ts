import type {
  Draft,
  DraftRepository,
  DyeWork,
  WorksListResult,
  WorksRepository,
} from "../shared/types";
import {
  assertDraft,
  assertWork,
  normalizeWorkName,
} from "../shared/validation";
type StoreOperation<T> = (
  store: IDBObjectStore,
  set: (value: T) => void,
  fail: (error: unknown) => void,
) => void;

// A shared schema/transaction helper; each repository closes its own connection
// only after its queued writes settle.
class LocalDatabase {
  private opening?: Promise<IDBDatabase>;
  private writes: Promise<void> = Promise.resolve();
  constructor(
    private factory: IDBFactory | undefined,
    private name: string,
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
  private async transact<T>(
    name: "drafts" | "works",
    mode: IDBTransactionMode,
    operation: StoreOperation<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(name, mode);
      let value: T, error: unknown;
      const fail = (reason: unknown) => {
        error = reason;
        try {
          tx.abort();
        } catch {
          reject(reason);
        }
      };
      tx.oncomplete = () => resolve(value);
      tx.onabort = () =>
        reject(error ?? tx.error ?? new Error("本地存储操作失败，请重试。"));
      tx.onerror = () => {};
      try {
        operation(
          tx.objectStore(name),
          (next) => {
            value = next;
          },
          fail,
        );
      } catch (reason) {
        fail(reason);
      }
    });
  }
  async read<T>(
    name: "drafts" | "works",
    operation: StoreOperation<T>,
  ): Promise<T> {
    await this.writes;
    return this.transact(name, "readonly", operation);
  }
  write<T>(name: "drafts" | "works", operation: StoreOperation<T>): Promise<T> {
    const job = this.writes.then(() =>
      this.transact(name, "readwrite", operation),
    );
    this.writes = job.then(
      () => {},
      () => {},
    );
    return job;
  }
  close() {
    void this.writes
      .then(() => {
        const opening = this.opening;
        this.opening = undefined;
        return opening?.then((db) => db.close());
      })
      .catch(() => {});
  }
}
export class IndexedDbDraftRepository implements DraftRepository {
  private db: LocalDatabase;
  constructor(
    factory: IDBFactory | undefined = globalThis.indexedDB,
    name = "bai-indigo",
  ) {
    this.db = new LocalDatabase(factory, name);
  }
  readDraft(): Promise<unknown | undefined> {
    return this.db.read("drafts", (store, set) => {
      const request = store.get("current");
      request.onsuccess = () => set(request.result);
    });
  }
  writeDraft(draft: Draft): Promise<void> {
    assertDraft(draft);
    const copy = structuredClone(draft);
    return this.db.write("drafts", (store) => {
      store.put(copy, "current");
    });
  }
  deleteDraft(): Promise<void> {
    return this.db.write("drafts", (store) => {
      store.delete("current");
    });
  }
  close() {
    this.db.close();
  }
}
export class IndexedDbWorksRepository implements WorksRepository {
  private db: LocalDatabase;
  constructor(
    factory: IDBFactory | undefined = globalThis.indexedDB,
    name = "bai-indigo",
  ) {
    this.db = new LocalDatabase(factory, name);
  }
  listWorks(): Promise<WorksListResult> {
    return this.db.read("works", (store, set) => {
      const items: DyeWork[] = [],
        request = store.openCursor();
      let invalidCount = 0;
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          set({
            items: items.sort(
              (a, b) =>
                b.createdAt.localeCompare(a.createdAt) ||
                a.id.localeCompare(b.id),
            ),
            invalidCount,
          });
          return;
        }
        try {
          assertWork(cursor.value);
          if (cursor.value.id !== cursor.primaryKey)
            throw new Error("ID 不匹配");
          items.push(cursor.value);
        } catch {
          invalidCount++;
        }
        cursor.continue();
      };
    });
  }
  getWork(id: string): Promise<DyeWork | undefined> {
    return this.db.read("works", (store, set, fail) => {
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          const value: unknown = request.result;
          if (value === undefined) {
            set(undefined);
            return;
          }
          assertWork(value);
          if (value.id !== id) throw new Error("作品 ID 不匹配。");
          set(value);
        } catch (error) {
          fail(error);
        }
      };
    });
  }
  saveWork(work: DyeWork): Promise<DyeWork> {
    assertWork(work);
    const copy = structuredClone(work);
    return this.db.write("works", (store, set, fail) => {
      const read = store.get(copy.id);
      read.onsuccess = () => {
        try {
          if (read.result === undefined) {
            store.add(copy);
            set(copy);
          } else {
            assertWork(read.result);
            if (read.result.id !== copy.id) throw new Error("作品 ID 不匹配。");
            set(read.result);
          }
        } catch (error) {
          fail(error);
        }
      };
    });
  }
  renameWork(id: string, name: string): Promise<DyeWork> {
    const normalized = normalizeWorkName(name);
    return this.db.write("works", (store, set, fail) => {
      const read = store.get(id);
      read.onsuccess = () => {
        try {
          if (read.result === undefined)
            throw new Error("这件作品已不存在，请刷新列表。");
          assertWork(read.result);
          const updated: DyeWork = {
            ...read.result,
            name: normalized,
            updatedAt: new Date().toISOString(),
          };
          store.put(updated);
          set(updated);
        } catch (error) {
          fail(error);
        }
      };
    });
  }
  deleteWork(id: string): Promise<void> {
    return this.db.write("works", (store) => {
      store.delete(id);
    });
  }
  close() {
    this.db.close();
  }
}
