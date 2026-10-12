<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useStudioStore } from "../../stores/studio";
import { useWorksStore } from "../../stores/works";
import { contentRepository } from "../../services/content";
import { WorkerRenderer } from "../../services/renderer";
import { DyeProcess } from "../../services/process";
import {
  canvasFromPixels,
  encodeDye,
  downloadResult,
} from "../../services/images";
import type { Fold, Depth } from "../../shared/types";
import BaseButton from "../../shared/components/BaseButton.vue";
import DyeCanvas from "./DyeCanvas.vue";
import EditorCanvas from "./EditorCanvas.vue";
import ProcessControls from "./ProcessControls.vue";
import ComparisonDialog from "./ComparisonDialog.vue";
const studio = useStudioStore(),
  patterns = contentRepository.patterns(),
  comparison = ref(false);
const works = useWorksStore();
const image = shallowRef<CanvasImageSource | null>(null);
let disposed = false,
  decodeId = 0,
  decoded: ImageBitmap | undefined,
  preparedBlob: Blob | undefined;
const process = new DyeProcess({
  renderer: new WorkerRenderer(),
  encode: async (result, params, signal) => {
    const canvas = canvasFromPixels(result),
      encoded = await encodeDye(canvas, params, signal);
    if (!signal.aborted && !disposed) {
      image.value = canvas;
      preparedBlob = encoded.image;
    }
    return encoded;
  },
  onState: (phase, progress) => studio.updateProcess(phase, progress),
  onComplete: (result) => {
    const completed = studio.finishProcess(result);
    if (completed) void works.saveResult(completed);
  },
  onError: (message) => {
    image.value = null;
    preparedBlob = undefined;
    studio.failProcess(message);
  },
});
watch(
  () => [studio.phase, studio.currentResult] as const,
  async () => {
    const id = ++decodeId;
    if (
      studio.phase === "done" &&
      studio.currentResult &&
      studio.currentResult.image !== preparedBlob
    ) {
      try {
        const bitmap = await createImageBitmap(studio.currentResult.image);
        if (id !== decodeId || disposed || studio.phase !== "done") {
          bitmap.close();
          return;
        }
        decoded?.close();
        decoded = bitmap;
        image.value = bitmap;
      } catch {
        if (id === decodeId && !disposed)
          studio.processError = "成品显示失败，可尝试重新进入创作页。";
      }
    }
  },
  { immediate: true },
);
function start() {
  const params = studio.beginProcess();
  if (!params) return;
  image.value = null;
  decoded?.close();
  decoded = undefined;
  preparedBlob = undefined;
  void process.start(
    params,
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}
function reedit() {
  process.dispose();
  studio.reedit();
  image.value = null;
  preparedBlob = undefined;
  decoded?.close();
  decoded = undefined;
}
function download() {
  if (studio.phase === "done" && studio.currentResult)
    downloadResult(studio.currentResult);
}
function shortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (target.closest('input,textarea,select,[contenteditable="true"],dialog'))
    return;
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "z" &&
    studio.canEdit
  ) {
    event.preventDefault();
    studio.undo();
  }
}
onBeforeUnmount(() => {
  disposed = true;
  decodeId++;
  process.dispose();
  studio.leaveStudio();
  decoded?.close();
  image.value = null;
});
const folds: readonly { id: Fold; name: string }[] = [
  { id: "none", name: "不折叠" },
  { id: "half", name: "对折" },
  { id: "quarter", name: "四折" },
];
const depths: readonly { id: Depth; name: string }[] = [
  { id: "light", name: "浅染" },
  { id: "medium", name: "中染" },
  { id: "deep", name: "深染" },
];
const steps = ["选布", "扎结", "浸染", "氧化", "拆线"];
const stepIndex = computed(() =>
  studio.phase === "edit" || studio.phase === "preparing"
    ? 1
    : studio.phase === "dye"
      ? 2
      : studio.phase === "oxidize"
        ? 3
        : 4,
);
const radius = computed(() =>
  Math.round((studio.selectedKnot?.radius ?? studio.defaultRadius) * 100),
);
</script>
<template>
  <section class="studio-page" @keydown="shortcut">
    <section class="page-heading studio-heading">
      <div>
        <span class="eyebrow">A THREAD, A BLUE, A WHITE</span>
        <h1>掌上扎染</h1>
        <p>在一方白布上，让靛蓝留下自己的纹路。</p>
      </div>
      <ol class="making-steps" aria-label="制作步骤">
        <li
          v-for="(step, index) in steps"
          :key="step"
          :class="{
            active: stepIndex === index && studio.phase !== 'done',
            done: index < stepIndex || studio.phase === 'done',
          }"
          :aria-current="stepIndex === index ? 'step' : undefined"
        >
          <span>{{ index + 1 }}</span
          >{{ step }}
        </li>
      </ol>
    </section>
    <div class="studio-layout">
      <aside class="studio-controls" aria-label="创作参数">
        <fieldset :disabled="!studio.canEdit">
          <legend class="sr-only">创作参数</legend>
          <div class="control-section">
            <h2><span>01</span> 从一种纹样开始</h2>
            <div class="preset-grid">
              <button
                v-for="pattern in patterns"
                :key="pattern.id"
                class="preset"
                :aria-pressed="studio.templateId === pattern.id"
                @click="studio.selectPattern(pattern.id)"
              >
                <svg class="preset-icon" viewBox="0 0 60 35" aria-hidden="true">
                  <template v-if="pattern.id === 'four'">
                    <circle cx="18" cy="10" r="6" />
                    <circle cx="42" cy="10" r="6" />
                    <circle cx="18" cy="26" r="6" />
                    <circle cx="42" cy="26" r="6" />
                  </template>
                  <template v-else-if="pattern.id === 'flower'">
                    <circle cx="30" cy="18" r="12" />
                    <circle cx="30" cy="18" r="7" />
                  </template>
                  <path
                    v-else-if="pattern.id === 'stripe'"
                    d="M10 6h40M10 13h40M10 21h40M10 29h40"
                  />
                  <path v-else d="M30 9v18M21 18h18" /></svg
                >{{ pattern.title }}
              </button>
            </div>
            <p class="control-note">原创体验模板</p>
          </div>
          <div class="control-section">
            <h2><span>02</span> 折叠方式</h2>
            <div class="segmented">
              <button
                v-for="fold in folds"
                :key="fold.id"
                :aria-pressed="studio.params.fold === fold.id"
                @click="studio.setFold(fold.id)"
              >
                {{ fold.name }}
              </button>
            </div>
          </div>
          <div class="control-section">
            <h2><span>03</span> 留白大小</h2>
            <label class="range-label" for="radius"
              >{{ studio.selectedKnot ? "选中扎结半径" : "全部扎结半径"
              }}<output>{{ radius }}%</output></label
            ><input
              id="radius"
              type="range"
              min="6"
              max="24"
              :value="radius"
              @input="
                studio.setRadius(
                  Number(($event.target as HTMLInputElement).value) / 100,
                  true,
                )
              "
              @change="studio.commitEdit()"
              @blur="studio.commitEdit()"
              @pointercancel="studio.cancelEdit()"
            />
            <div class="range-ends"><span>细密</span><span>舒展</span></div>
          </div>
          <div class="control-section">
            <h2><span>04</span> 靛蓝深浅</h2>
            <div class="dye-options">
              <button
                v-for="depth in depths"
                :key="depth.id"
                :aria-pressed="studio.params.depth === depth.id"
                @click="studio.setDepth(depth.id)"
              >
                <i class="swatch" :class="`swatch--${depth.id}`" />{{
                  depth.name
                }}
              </button>
            </div>
          </div>
        </fieldset>
        <div class="draft-actions">
          <p
            role="status"
            :class="{ 'error-text': studio.saveState === 'error' }"
          >
            {{ studio.storageMessage }}
          </p>
          <template v-if="studio.recovery === 'invalid'"
            ><p>重置将删除原草稿，并恢复四方纹方案。</p>
            <BaseButton
              variant="secondary"
              :disabled="!studio.canEdit"
              @click="studio.resetDraft"
              >重置本地草稿</BaseButton
            ></template
          ><BaseButton
            v-else-if="studio.recovery === 'read-error'"
            variant="secondary"
            :disabled="!studio.canEdit"
            @click="studio.initialize"
            >重试读取草稿</BaseButton
          ><BaseButton
            v-else
            variant="secondary"
            :disabled="
              !studio.initialized ||
              studio.saveState === 'saving' ||
              studio.inTransaction
            "
            @click="studio.saveNow"
            >{{
              studio.saveState === "error" ? "重试保存" : "立即保存草稿"
            }}</BaseButton
          >
        </div>
      </aside>
      <EditorCanvas :image="image"
        ><ProcessControls
          :phase="studio.phase"
          :progress="studio.progress"
          :initialized="studio.initialized"
          @start="start"
          @untie="process.untie()"
          @skip="process.skip()"
          @reedit="reedit"
        />
        <p v-if="studio.notice" class="studio-notice" role="status">
          {{ studio.notice }}
        </p>
        <p
          v-if="studio.processError"
          class="studio-notice error-text"
          role="alert"
        >
          {{ studio.processError }}
        </p></EditorCanvas
      >
      <aside class="studio-explanation">
        <DyeCanvas /><span class="eyebrow">THE ART OF RESIST DYEING</span>
        <h2>线扎住的，<br />是留白。</h2>
        <p>
          位置、大小与折叠共同决定留白的布局。调整参数，观察蓝白之间的变化。
        </p>
        <RouterLink to="/learning">认识防染原理 ↗</RouterLink>
        <div class="result-actions">
          <BaseButton
            variant="secondary"
            :disabled="
              studio.phase !== 'done' ||
              !studio.previousResult ||
              !studio.currentResult
            "
            @click="comparison = true"
            >对比两次染作</BaseButton
          ><BaseButton
            variant="secondary"
            :disabled="studio.phase !== 'done' || !studio.currentResult"
            @click="download"
            >下载 PNG</BaseButton
          ><small
            >完成两次制作后可对比。<br />会话对比刷新后清空，已保存作品仍可找回。</small
          >
          <p
            v-if="studio.currentResult && studio.phase === 'done'"
            class="work-save-status"
            role="status"
          >
            {{
              works.statuses[studio.currentResult.id] === "saving"
                ? "作品正在保存…"
                : works.statuses[studio.currentResult.id] === "saved"
                  ? "作品已保存到我的作品"
                  : works.statuses[studio.currentResult.id] === "error"
                    ? "作品保存失败，当前结果留在内存中。"
                    : "当前结果未保留在我的作品。"
            }}
            <BaseButton
              v-if="works.statuses[studio.currentResult.id] === 'error'"
              variant="secondary"
              @click="works.retry(studio.currentResult.id)"
              >重试保存作品</BaseButton
            >
          </p>
          <RouterLink to="/works">查看我的作品 ↗</RouterLink>
        </div>
      </aside>
    </div>
    <p class="local-note">
      圆点与条纹为原创体验方案；画面是防染原理的算法近似。草稿仅保存在当前浏览器。
    </p>
    <ComparisonDialog
      v-if="comparison && studio.previousResult && studio.currentResult"
      :previous="studio.previousResult"
      :current="studio.currentResult"
      @close="comparison = false"
    />
  </section>
</template>
