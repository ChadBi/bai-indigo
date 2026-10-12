import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import type {
  DyeWork,
  SessionDyeResult,
  WorksRepository,
} from "../shared/types";
import { assertWork, cloneParams } from "../shared/validation";
import { IndexedDbWorksRepository } from "../services/storage";

export type WorkSaveState = "saving" | "saved" | "error" | "removed";
export function defaultWorkName(iso: string): string {
  const d = new Date(iso),
    pad = (v: number) => String(v).padStart(2, "0");
  return `染作 ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
export function createWorksStore(repository: WorksRepository) {
  return defineStore("works", () => {
    const items = shallowRef<readonly DyeWork[]>([]),
      pending = shallowRef<readonly DyeWork[]>([]);
    const statuses = ref<Record<string, WorkSaveState>>(Object.create(null)),
      busy = ref<Record<string, boolean>>(Object.create(null));
    const loading = ref(false),
      loaded = ref(false),
      error = ref(""),
      invalidCount = ref(0);
    let loadId = 0,
      mutationRevision = 0,
      disposed = false;
    function insert(work: DyeWork) {
      items.value = [
        ...items.value.filter((item) => item.id !== work.id),
        work,
      ].sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
      );
    }
    async function load(): Promise<void> {
      if (disposed) return;
      const id = ++loadId,
        version = mutationRevision;
      loading.value = true;
      error.value = "";
      try {
        const result = await repository.listWorks();
        if (disposed || id !== loadId) return;
        if (version !== mutationRevision) {
          void load();
          return;
        }
        items.value = result.items;
        invalidCount.value = result.invalidCount;
        loaded.value = true;
      } catch {
        if (!disposed && id === loadId)
          error.value = "读取我的作品失败，请重试。";
      } finally {
        if (!disposed && id === loadId) loading.value = false;
      }
    }
    async function attempt(id: string): Promise<void> {
      const work = pending.value.find((item) => item.id === id);
      if (
        !work ||
        disposed ||
        statuses.value[id] === "saving" ||
        busy.value[id]
      )
        return;
      statuses.value[id] = "saving";
      mutationRevision++;
      try {
        const saved = await repository.saveWork(work);
        if (disposed) return;
        mutationRevision++;
        insert(saved);
        pending.value = pending.value.filter((item) => item.id !== id);
        statuses.value[id] = "saved";
      } catch {
        if (!disposed) statuses.value[id] = "error";
      }
    }
    async function saveResult(result: SessionDyeResult): Promise<void> {
      if (
        disposed ||
        ["saving", "saved", "removed"].includes(statuses.value[result.id])
      )
        return;
      if (!pending.value.some((item) => item.id === result.id)) {
        const work: DyeWork = {
          ...result,
          params: cloneParams(result.params),
          editor: { ...result.editor },
          name: defaultWorkName(result.createdAt),
          updatedAt: result.createdAt,
        };
        assertWork(work);
        pending.value = [...pending.value, work];
      }
      await attempt(result.id);
    }
    function discard(id: string) {
      if (statuses.value[id] === "saving") return;
      pending.value = pending.value.filter((item) => item.id !== id);
      statuses.value[id] = "removed";
    }
    async function get(id: string): Promise<DyeWork> {
      const work = await repository.getWork(id);
      if (!work) throw new Error("这件作品已不存在，请刷新列表。");
      return work;
    }
    async function rename(id: string, name: string): Promise<void> {
      if (busy.value[id] || statuses.value[id] === "saving")
        throw new Error("这件作品正在处理，请稍后重试。");
      busy.value[id] = true;
      mutationRevision++;
      try {
        const work = await repository.renameWork(id, name);
        if (!disposed) {
          mutationRevision++;
          insert(work);
        }
      } finally {
        busy.value[id] = false;
      }
    }
    async function remove(id: string): Promise<void> {
      if (busy.value[id] || statuses.value[id] === "saving")
        throw new Error("这件作品正在处理，请稍后重试。");
      busy.value[id] = true;
      mutationRevision++;
      try {
        await repository.deleteWork(id);
        if (!disposed) {
          mutationRevision++;
          items.value = items.value.filter((item) => item.id !== id);
          pending.value = pending.value.filter((item) => item.id !== id);
          statuses.value[id] = "removed";
        }
      } finally {
        busy.value[id] = false;
      }
    }
    function dispose() {
      disposed = true;
      loadId++;
      repository.close();
    }
    return {
      items,
      pending,
      statuses,
      busy,
      loading,
      loaded,
      error,
      invalidCount,
      load,
      saveResult,
      retry: attempt,
      discard,
      get,
      rename,
      remove,
      dispose,
    };
  });
}
export const useWorksStore = createWorksStore(new IndexedDbWorksRepository());
