import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type {
  Depth,
  Draft,
  DraftRepository,
  DyeParams,
  EditSnapshot,
  Fold,
  PatternId,
  SessionDyeResult,
  StudioPhase,
  TemplateSelection,
} from "../shared/types";
import { assertDraft, cloneParams } from "../shared/validation";
import { patterns, initialParams } from "../content/patterns";
import { IndexedDbDraftRepository } from "../services/storage";

export function createStudioStore(repository: DraftRepository) {
  return defineStore("studio", () => {
    const params = ref<DyeParams>(initialParams()),
      templateId = ref<TemplateSelection>("four"),
      defaultRadius = ref(0.13);
    const initialized = ref(false),
      revision = ref(0),
      selectedId = ref<string | null>(null),
      inTransaction = ref(false),
      resetting = ref(false);
    const phase = ref<StudioPhase>("edit"),
      progress = ref(0),
      processError = ref(""),
      notice = ref("");
    const history = shallowRef<EditSnapshot[]>([]),
      results = shallowRef<SessionDyeResult[]>([]);
    const saveState = ref<"idle" | "pending" | "saving" | "saved" | "error">(
      "idle",
    );
    const storageMessage = ref("正在读取本地草稿…"),
      recovery = ref<"none" | "invalid" | "read-error">("none");
    const canEdit = computed(
      () =>
        initialized.value &&
        phase.value === "edit" &&
        !disposed &&
        !resetting.value,
    );
    const selectedKnot = computed(() =>
      params.value.knots.find((k) => k.id === selectedId.value),
    );
    const currentResult = computed(() => results.value.at(-1)),
      previousResult = computed(() => results.value.at(-2));
    let timer: ReturnType<typeof setTimeout> | undefined,
      beforeEdit: EditSnapshot | undefined;
    let committedRevision = 0,
      savedRevision = 0,
      pendingSaves = 0,
      disposed = false;
    const cancelTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const capture = (): EditSnapshot => ({
      params: cloneParams(params.value),
      templateId: templateId.value,
      defaultRadius: defaultRadius.value,
    });
    const equal = (a: EditSnapshot, b: EditSnapshot) =>
      JSON.stringify(a) === JSON.stringify(b);
    function restore(value: EditSnapshot) {
      params.value = cloneParams(value.params);
      templateId.value = value.templateId;
      defaultRadius.value = value.defaultRadius;
      revision.value++;
      if (!params.value.knots.some((k) => k.id === selectedId.value))
        selectedId.value = null;
    }
    function scheduleSave() {
      cancelTimer();
      if (
        !initialized.value ||
        recovery.value !== "none" ||
        disposed ||
        inTransaction.value ||
        committedRevision <= savedRevision
      )
        return;
      saveState.value = "pending";
      storageMessage.value = "有修改，等待保存…";
      timer = setTimeout(() => {
        timer = undefined;
        void saveNow();
      }, 500);
    }
    async function initialize() {
      if (disposed || phase.value !== "edit" || inTransaction.value) return;
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
          if (committedRevision === 0) {
            restore(value);
            history.value = [];
            selectedId.value = null;
          }
          storageMessage.value =
            committedRevision === 0 ? "已恢复本地草稿" : "已重新连接本地存储";
        } else storageMessage.value = "草稿保存在当前浏览器";
        recovery.value = "none";
        saveState.value = "idle";
      } catch {
        if (disposed) return;
        recovery.value = "read-error";
        saveState.value = "error";
        storageMessage.value = "读取本地草稿失败，当前方案保留在页面中。";
      } finally {
        if (!disposed) {
          initialized.value = true;
          if (recovery.value === "none" && committedRevision > 0)
            void saveNow();
        }
      }
    }
    function beginEdit(): boolean {
      if (disposed || !canEdit.value) return false;
      if (!beforeEdit) {
        beforeEdit = capture();
        inTransaction.value = true;
        cancelTimer();
      }
      return true;
    }
    function commitEdit(): boolean {
      if (!beforeEdit) return false;
      const previous = beforeEdit;
      beforeEdit = undefined;
      inTransaction.value = false;
      const changed = !equal(previous, capture());
      if (changed) {
        history.value = [...history.value, previous].slice(-30);
        committedRevision++;
      }
      scheduleSave();
      return changed;
    }
    function cancelEdit(): boolean {
      if (!beforeEdit) return false;
      const previous = beforeEdit;
      beforeEdit = undefined;
      inTransaction.value = false;
      const changed = !equal(previous, capture());
      if (changed) restore(previous);
      scheduleSave();
      return changed;
    }
    function mutate(action: () => void, continuous = false) {
      if (!beginEdit()) return;
      const previous = capture();
      action();
      if (!equal(previous, capture())) {
        revision.value++;
        notice.value = "";
        processError.value = "";
      }
      if (!continuous) commitEdit();
    }
    function selectPattern(id: PatternId) {
      if (phase.value === "done") reedit();
      const pattern = patterns.find((p) => p.id === id);
      if (!pattern) return;
      mutate(() => {
        params.value = cloneParams(pattern.params);
        defaultRadius.value = pattern.defaultRadius;
        templateId.value = id;
        selectedId.value = null;
      });
    }
    function selectKnot(id: string | null) {
      if (canEdit.value)
        selectedId.value =
          id && params.value.knots.some((k) => k.id === id) ? id : null;
    }
    function addKnot(x = 0.5, y = 0.5, continuous = false): string | null {
      if (!canEdit.value) return null;
      if (params.value.knots.length >= 12) {
        notice.value = "最多放置 12 个扎结点，可先移动或删除已有扎结。";
        return null;
      }
      const id = crypto.randomUUID();
      mutate(() => {
        params.value.knots.push({
          id,
          x: clamp(x),
          y: clamp(y),
          radius: defaultRadius.value,
        });
        templateId.value = "custom";
        selectedId.value = id;
      }, continuous);
      return id;
    }
    function moveKnot(
      id: string,
      x: number,
      y: number,
      fx = false,
      fy = false,
      continuous = false,
    ) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      mutate(() => {
        const knot = params.value.knots.find((k) => k.id === id);
        if (!knot) return;
        const nextX = clamp(fx ? 1 - clamp(x) : x),
          nextY = clamp(fy ? 1 - clamp(y) : y);
        if (knot.x !== nextX || knot.y !== nextY) {
          knot.x = nextX;
          knot.y = nextY;
          templateId.value = "custom";
        }
      }, continuous);
    }
    function removeSelected() {
      if (!selectedKnot.value) return;
      mutate(() => {
        params.value.knots = params.value.knots.filter(
          (k) => k.id !== selectedId.value,
        );
        selectedId.value = null;
        templateId.value = "custom";
      });
    }
    function clearKnots() {
      if (!params.value.knots.length) return;
      mutate(() => {
        params.value.knots = [];
        selectedId.value = null;
        templateId.value = "free";
      });
    }
    function setFold(value: Fold) {
      if (["none", "half", "quarter"].includes(value))
        mutate(() => {
          params.value.fold = value;
        });
    }
    function setDepth(value: Depth) {
      if (["light", "medium", "deep"].includes(value))
        mutate(() => {
          params.value.depth = value;
        });
    }
    function setRadius(value: number, continuous = false) {
      if (!Number.isFinite(value) || value < 0.06 || value > 0.24) return;
      mutate(() => {
        if (selectedKnot.value) selectedKnot.value.radius = value;
        else {
          defaultRadius.value = value;
          params.value.knots.forEach((k) => (k.radius = value));
        }
      }, continuous);
    }
    function undo() {
      if (!canEdit.value) return;
      if (cancelEdit()) return;
      const previous = history.value.at(-1);
      if (!previous) return;
      history.value = history.value.slice(0, -1);
      restore(previous);
      selectedId.value = null;
      committedRevision++;
      scheduleSave();
    }
    function snapshot(): Draft {
      return { ...capture(), updatedAt: new Date().toISOString() };
    }
    async function saveNow(): Promise<void> {
      cancelTimer();
      if (
        !initialized.value ||
        recovery.value !== "none" ||
        disposed ||
        inTransaction.value
      )
        return;
      const version = committedRevision,
        draft = snapshot();
      pendingSaves++;
      saveState.value = "saving";
      try {
        await repository.writeDraft(draft);
        savedRevision = Math.max(savedRevision, version);
        if (
          !disposed &&
          version === committedRevision &&
          !inTransaction.value
        ) {
          saveState.value = "saved";
          storageMessage.value = "草稿已保存";
        }
      } catch {
        if (
          !disposed &&
          version === committedRevision &&
          !inTransaction.value
        ) {
          saveState.value = "error";
          storageMessage.value = "草稿保存失败，当前方案保留在页面中。请重试。";
        }
      } finally {
        pendingSaves--;
        if (
          !disposed &&
          version !== committedRevision &&
          pendingSaves === 0 &&
          !timer &&
          !inTransaction.value
        )
          void saveNow();
      }
    }
    async function resetDraft() {
      if (!canEdit.value) return;
      cancelEdit();
      cancelTimer();
      resetting.value = true;
      try {
        await repository.deleteDraft();
        restore({
          params: initialParams(),
          templateId: "four",
          defaultRadius: 0.13,
        });
        history.value = [];
        selectedId.value = null;
        recovery.value = "none";
        committedRevision++;
        await saveNow();
      } catch {
        saveState.value = "error";
        storageMessage.value = "重置失败，原草稿仍保留。请重试。";
      } finally {
        resetting.value = false;
      }
    }
    function beginProcess(): DyeParams | null {
      if (!canEdit.value) return null;
      commitEdit();
      if (!params.value.knots.length) {
        notice.value = "先在布面添加扎结，或选择一个纹样模板。";
        return null;
      }
      selectedId.value = null;
      processError.value = "";
      notice.value = "";
      phase.value = "preparing";
      progress.value = 0;
      void saveNow();
      return cloneParams(params.value);
    }
    function updateProcess(next: StudioPhase, value = 0) {
      phase.value = next;
      progress.value = value;
    }
    function finishProcess(result: SessionDyeResult) {
      if (phase.value !== "unfold") return;
      results.value = [
        ...results.value,
        { ...result, params: cloneParams(result.params) },
      ].slice(-2);
      phase.value = "done";
      progress.value = 1;
    }
    function failProcess(message: string) {
      phase.value = "edit";
      progress.value = 0;
      processError.value = message;
    }
    function reedit() {
      if (phase.value !== "done") return;
      phase.value = "edit";
      progress.value = 0;
      selectedId.value = null;
      processError.value = "";
    }
    function leaveStudio() {
      cancelEdit();
      if (phase.value !== "done") {
        phase.value = "edit";
        progress.value = 0;
      }
      selectedId.value = null;
      void saveNow();
    }
    function dispose() {
      disposed = true;
      cancelTimer();
      repository.close();
    }
    return {
      params,
      templateId,
      defaultRadius,
      initialized,
      revision,
      selectedId,
      selectedKnot,
      inTransaction,
      history,
      canEdit,
      phase,
      progress,
      processError,
      notice,
      results,
      currentResult,
      previousResult,
      saveState,
      storageMessage,
      recovery,
      initialize,
      beginEdit,
      commitEdit,
      cancelEdit,
      selectPattern,
      selectKnot,
      addKnot,
      moveKnot,
      removeSelected,
      clearKnots,
      setFold,
      setDepth,
      setRadius,
      undo,
      saveNow,
      resetDraft,
      beginProcess,
      updateProcess,
      finishProcess,
      failProcess,
      reedit,
      leaveStudio,
      dispose,
    };
  });
}
function clamp(value: number): number {
  return Math.max(0.025, Math.min(0.975, Number.isFinite(value) ? value : 0.5));
}
export const useStudioStore = createStudioStore(new IndexedDbDraftRepository());
