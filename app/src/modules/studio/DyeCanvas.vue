<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useStudioStore } from "../../stores/studio";
import { WorkerRenderer } from "../../services/renderer";
import { cloneParams } from "../../shared/validation";
import BaseButton from "../../shared/components/BaseButton.vue";
const studio = useStudioStore(),
  canvas = ref<HTMLCanvasElement>(),
  renderer = new WorkerRenderer();
const loading = ref(false),
  error = ref(""),
  completedId = ref(0),
  renderedRevision = ref(-1);
let requestId = 0,
  disposed = false,
  timer: ReturnType<typeof setTimeout> | undefined,
  lastStart = -Infinity;
function clearTimer() {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
}
async function render() {
  clearTimer();
  if (
    !studio.initialized ||
    !canvas.value ||
    disposed ||
    studio.phase !== "edit"
  )
    return;
  const id = ++requestId,
    revision = studio.revision;
  lastStart = performance.now();
  loading.value = true;
  error.value = "";
  try {
    const result = await renderer.render({
      requestId: id,
      size: 260,
      params: cloneParams(studio.params),
    });
    if (
      id !== requestId ||
      disposed ||
      revision !== studio.revision ||
      studio.phase !== "edit"
    )
      return;
    const context = canvas.value?.getContext("2d");
    if (!context) throw new Error("浏览器无法显示画布。");
    context.putImageData(
      new ImageData(result.pixels, result.size, result.size),
      0,
      0,
    );
    completedId.value = id;
    renderedRevision.value = revision;
  } catch (reason) {
    if (id === requestId && !disposed && revision === studio.revision)
      error.value =
        reason instanceof Error ? reason.message : "计算失败，请重试。";
  } finally {
    if (id === requestId && !disposed && revision === studio.revision)
      loading.value = false;
  }
}
async function refresh() {
  if (!studio.initialized || !canvas.value || disposed) return;
  if (studio.phase === "edit") {
    loading.value = true;
    clearTimer();
    timer = setTimeout(
      () => {
        timer = undefined;
        void render();
      },
      Math.max(0, 80 - (performance.now() - lastStart)),
    );
    return;
  }
  clearTimer();
  requestId++;
  renderer.dispose();
  loading.value = false;
  error.value = "";
  if (studio.phase === "done" && studio.currentResult) {
    const id = requestId;
    try {
      const bitmap = await createImageBitmap(studio.currentResult.thumbnail);
      if (id === requestId && !disposed) {
        canvas.value?.getContext("2d")?.drawImage(bitmap, 0, 0, 260, 260);
        completedId.value = id;
        renderedRevision.value = studio.revision;
      }
      bitmap.close();
    } catch {
      if (id === requestId && !disposed)
        error.value = "成品预览无法显示，请重新进入创作页。";
    }
  }
}
watch(
  () => [studio.initialized, studio.revision, studio.phase, canvas.value],
  () => {
    void refresh();
  },
  { flush: "post", immediate: true },
);
onBeforeUnmount(() => {
  disposed = true;
  clearTimer();
  requestId++;
  renderer.dispose();
  loading.value = false;
});
</script>
<template>
  <div class="dye-preview" :aria-busy="loading">
    <div class="preview-heading">
      <span>{{ studio.phase === "done" ? "本次染作" : "染后预览" }}</span
      ><span role="status">{{
        loading
          ? "正在生成…"
          : error
            ? "生成失败"
            : studio.phase === "edit"
              ? "随操作变化"
              : studio.phase === "done"
                ? "已完成"
                : "等待展开"
      }}</span>
    </div>
    <canvas
      ref="canvas"
      width="260"
      height="260"
      aria-label="当前方案的数字扎染效果"
      :data-render-id="completedId"
      :data-revision="renderedRevision"
    />
    <p v-if="error" role="alert">
      {{ error }}
      <BaseButton
        v-if="studio.phase === 'edit'"
        variant="secondary"
        @click="render"
        >重新生成</BaseButton
      >
    </p>
  </div>
</template>
