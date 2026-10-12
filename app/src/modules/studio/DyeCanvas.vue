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
  completedId = ref(0);
let requestId = 0,
  disposed = false;
async function render() {
  if (!studio.initialized || !canvas.value || disposed) return;
  const id = ++requestId;
  loading.value = true;
  error.value = "";
  try {
    const result = await renderer.render({
      requestId: id,
      size: 260,
      params: cloneParams(studio.params),
    });
    if (id !== requestId || disposed) return;
    const context = canvas.value?.getContext("2d");
    if (!context) throw new Error("浏览器无法显示画布。");
    context.putImageData(
      new ImageData(result.pixels, result.size, result.size),
      0,
      0,
    );
    completedId.value = id;
  } catch (reason) {
    if (id === requestId && !disposed)
      error.value =
        reason instanceof Error ? reason.message : "计算失败，请重试。";
  } finally {
    if (id === requestId && !disposed) loading.value = false;
  }
}
watch(
  () => [studio.initialized, studio.revision, canvas.value],
  () => {
    void render();
  },
  { flush: "post", immediate: true },
);
onBeforeUnmount(() => {
  disposed = true;
  requestId++;
  renderer.dispose();
  loading.value = false;
});
</script>
<template>
  <div class="canvas-stage" :aria-busy="loading">
    <div class="canvas-meta">
      <span>靛蓝 · 留白</span
      ><span>{{ studio.params.knots.length }} 处原始扎结</span>
    </div>
    <div class="cloth-frame">
      <canvas
        ref="canvas"
        width="260"
        height="260"
        aria-label="当前方案的数字扎染效果"
        :data-render-id="completedId"
        :data-revision="studio.revision"
      />
    </div>
    <div class="canvas-caption">
      <span>防染原理的数字表达</span
      ><span role="status">{{
        loading ? "正在生成…" : error ? "生成失败" : "预览已生成"
      }}</span>
    </div>
    <p v-if="error" role="alert">
      {{ error }}
      <BaseButton variant="secondary" @click="render">重新生成</BaseButton>
    </p>
  </div>
</template>
