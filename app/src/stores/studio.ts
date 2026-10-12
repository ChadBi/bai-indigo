import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type {
  Depth,
  Draft,
  DraftRepository,
  DyeParams,
  Fold,
  PatternId,
  TemplateSelection,
} from "../shared/types";
import { assertDraft, cloneParams } from "../shared/validation";
import { patterns, initialParams } from "../content/patterns";
import { IndexedDbDraftRepository } from "../services/storage";

export function createStudioStore(repository: DraftRepository) {
  return defineStore("studio", () => {
    const params = ref<DyeParams>(initialParams()),
      templateId = ref<TemplateSelection>("four");
    const defaultRadius = ref(0.13),
      initialized = ref(false),
      revision = ref(0);
    const saveState = ref<"idle" | "pending" | "saving" | "saved" | "error">(
      "idle",
    );
    const storageMessage = ref("正在读取本地草稿…");
    const recovery = ref<"none" | "invalid" | "read-error">("none");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingSaves = 0,
      disposed = false;
    const cancelTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    async function initialize() {
      if (disposed) return;
      cancelTimer();
      try {
        const value = await repository.readDraft();
        if (disposed) return;
        if (value !== undefined) {
          try {
            assertDraft(value);
          } catch (error) {
            recovery.value = "invalid";
            saveState.value = "error";
            storageMessage.value =
              error instanceof Error ? error.message : "草稿格式无效。";
            return;
          }
          if (revision.value === 0) {
            params.value = cloneParams(value.params);
            templateId.value = value.templateId;
            defaultRadius.value = value.defaultRadius;
          }
          storageMessage.value =
            revision.value === 0 ? "已恢复本地草稿" : "已重新连接本地存储";
        } else storageMessage.value = "草稿保存在当前浏览器";
        recovery.value = "none";
        saveState.value = "idle";
        if (revision.value > 0) void saveNow();
      } catch {
        if (disposed) return;
        recovery.value = "read-error";
        saveState.value = "error";
        storageMessage.value = "读取本地草稿失败，当前方案保留在页面中。";
      } finally {
        if (!disposed) initialized.value = true;
      }
    }
    function changed() {
      revision.value++;
    }
    function selectPattern(id: PatternId) {
      if (!initialized.value) return;
      const pattern = patterns.find((p) => p.id === id)!;
      params.value = cloneParams(pattern.params);
      defaultRadius.value = pattern.defaultRadius;
      templateId.value = id;
      changed();
    }
    function setFold(value: Fold) {
      if (initialized.value) {
        params.value.fold = value;
        changed();
      }
    }
    function setDepth(value: Depth) {
      if (initialized.value) {
        params.value.depth = value;
        changed();
      }
    }
    function setRadius(value: number) {
      if (
        !initialized.value ||
        !Number.isFinite(value) ||
        value < 0.06 ||
        value > 0.24
      )
        return;
      defaultRadius.value = value;
      params.value.knots.forEach((k) => (k.radius = value));
      changed();
    }
    function snapshot(): Draft {
      return {
        params: cloneParams(params.value),
        templateId: templateId.value,
        defaultRadius: defaultRadius.value,
        updatedAt: new Date().toISOString(),
      };
    }
    async function saveNow(): Promise<void> {
      cancelTimer();
      if (!initialized.value || recovery.value !== "none" || disposed) return;
      const currentRevision = revision.value,
        draft = snapshot();
      pendingSaves++;
      saveState.value = "saving";
      try {
        await repository.writeDraft(draft);
        if (!disposed && currentRevision === revision.value) {
          saveState.value = "saved";
          storageMessage.value = "草稿已保存";
        }
      } catch {
        if (!disposed && currentRevision === revision.value) {
          saveState.value = "error";
          storageMessage.value = "草稿保存失败，当前方案保留在页面中。请重试。";
        }
      } finally {
        pendingSaves--;
        if (
          !disposed &&
          currentRevision !== revision.value &&
          pendingSaves === 0 &&
          !timer
        )
          void saveNow();
      }
    }
    async function resetDraft(): Promise<void> {
      cancelTimer();
      try {
        await repository.deleteDraft();
        params.value = initialParams();
        templateId.value = "four";
        defaultRadius.value = 0.13;
        recovery.value = "none";
        initialized.value = true;
        changed();
        await saveNow();
      } catch {
        saveState.value = "error";
        storageMessage.value = "重置失败，原草稿仍保留。请重试。";
      }
    }
    const stop = watch(
      revision,
      () => {
        cancelTimer();
        if (!initialized.value || recovery.value !== "none" || disposed) return;
        saveState.value = "pending";
        storageMessage.value = "有修改，等待保存…";
        timer = setTimeout(() => {
          timer = undefined;
          void saveNow();
        }, 500);
      },
      { flush: "sync" },
    );
    function dispose() {
      disposed = true;
      cancelTimer();
      stop();
      repository.close();
    }
    return {
      params,
      templateId,
      defaultRadius,
      initialized,
      revision,
      saveState,
      storageMessage,
      recovery,
      initialize,
      selectPattern,
      setFold,
      setDepth,
      setRadius,
      saveNow,
      resetDraft,
      dispose,
    };
  });
}
export const useStudioStore = createStudioStore(new IndexedDbDraftRepository());
