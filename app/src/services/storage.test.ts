import { describe, it, expect } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbDraftRepository } from "./storage";
import { initialParams } from "../content/patterns";
import type { Draft } from "../shared/types";
const draft = (): Draft => ({
  params: initialParams(),
  updatedAt: new Date().toISOString(),
  templateId: "four",
  defaultRadius: 0.13,
});

describe("draft repository", () => {
  it("creates both stores and reads committed data after reopen", async () => {
    const factory = new IDBFactory(),
      repository = new IndexedDbDraftRepository(factory);
    const saved = draft();
    expect(await repository.readDraft()).toBeUndefined();
    await repository.writeDraft(saved);
    repository.close();
    const second = new IndexedDbDraftRepository(factory);
    expect(await second.readDraft()).toEqual(saved);
    await second.deleteDraft();
    expect(await second.readDraft()).toBeUndefined();
    second.close();
    const request = factory.open("bai-indigo", 1);
    await new Promise<void>((resolve) => {
      request.onsuccess = () => {
        expect([...request.result.objectStoreNames]).toEqual([
          "drafts",
          "works",
        ]);
        request.result.close();
        resolve();
      };
    });
  });
  it("serializes writes and snapshots caller data", async () => {
    const repository = new IndexedDbDraftRepository(new IDBFactory());
    const old = draft(),
      latest = draft();
    latest.params.depth = "light";
    const first = repository.writeDraft(old),
      second = repository.writeDraft(latest);
    latest.params.depth = "deep";
    await Promise.all([first, second]);
    expect(((await repository.readDraft()) as Draft).params.depth).toBe(
      "light",
    );
    repository.close();
  });
  it("rejects unavailable storage and allows a later retry", async () => {
    const factory = new IDBFactory(),
      open = factory.open.bind(factory);
    let fail = true;
    factory.open = ((...args: Parameters<IDBFactory["open"]>) => {
      if (fail) throw new DOMException("No space", "QuotaExceededError");
      return open(...args);
    }) as IDBFactory["open"];
    const repository = new IndexedDbDraftRepository(factory);
    await expect(repository.writeDraft(draft())).rejects.toThrow();
    fail = false;
    await repository.writeDraft(draft());
    expect(await repository.readDraft()).toBeDefined();
    repository.close();
  });
});
