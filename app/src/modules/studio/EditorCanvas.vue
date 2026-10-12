<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useStudioStore } from "../../stores/studio";
import { effectiveKnots } from "../../engine/dye";
import { drawStudio } from "./drawing";
import BaseButton from "../../shared/components/BaseButton.vue";
const props = defineProps<{ image: CanvasImageSource | null }>();
const studio = useStudioStore(),
  canvas = ref<HTMLCanvasElement>();
let drag:
  | { id: string; fx: boolean; fy: boolean; pointerId: number }
  | undefined;
const labels = {
  edit: "白棉布 / 扎结",
  preparing: "准备染色图像",
  dye: "浸染 / 靛蓝浸透布面",
  oxidize: "氧化 / 蓝色逐渐加深",
  tied: "染色完成 / 等待拆线",
  unfold: "拆线 / 展开纹样",
  done: "拆线完成 / 你的染作",
};
const instruction = computed(() =>
  studio.phase === "edit"
    ? studio.selectedId
      ? "拖动调整位置，或单独改变大小"
      : "点击布面，添加一处扎结"
    : studio.phase === "tied"
      ? "解开线结，展开你的纹样"
      : studio.phase === "done"
        ? "纹样已展开，下载作品或再染一次"
        : "制作中，参数已锁定",
);
watch(
  () => [
    studio.revision,
    studio.selectedId,
    studio.phase,
    studio.progress,
    props.image,
    canvas.value,
  ],
  () => {
    if (canvas.value)
      drawStudio(
        canvas.value,
        studio.params,
        studio.selectedId,
        studio.phase,
        studio.progress,
        props.image,
      );
  },
  { flush: "post", immediate: true },
);
function position(event: PointerEvent) {
  const bounds = canvas.value!.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) / bounds.width,
    y: (event.clientY - bounds.top) / bounds.height,
  };
}
function down(event: PointerEvent) {
  if (!studio.canEdit || !event.isPrimary || event.button !== 0 || drag) return;
  event.preventDefault();
  canvas.value!.focus({ preventScroll: true });
  const pos = position(event);
  let hit: ReturnType<typeof effectiveKnots>[number] | undefined,
    best = 0.055;
  for (const knot of effectiveKnots(studio.params)) {
    const distance = Math.hypot(knot.x - pos.x, knot.y - pos.y);
    if (distance < best) {
      best = distance;
      hit = knot;
    }
  }
  studio.beginEdit();
  if (hit) {
    studio.selectKnot(hit.id);
    drag = { id: hit.id, fx: hit.fx, fy: hit.fy, pointerId: event.pointerId };
  } else {
    const id = studio.addKnot(pos.x, pos.y, true);
    if (!id) {
      studio.commitEdit();
      return;
    }
    drag = { id, fx: false, fy: false, pointerId: event.pointerId };
  }
  canvas.value!.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointerId || !studio.canEdit) return;
  const pos = position(event);
  studio.moveKnot(drag.id, pos.x, pos.y, drag.fx, drag.fy, true);
}
function end(event: PointerEvent, cancel = false) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag = undefined;
  if (cancel) studio.cancelEdit();
  else studio.commitEdit();
  if (canvas.value?.hasPointerCapture(event.pointerId))
    canvas.value.releasePointerCapture(event.pointerId);
}
function lost(event: PointerEvent) {
  if (drag && event.pointerId === drag.pointerId) end(event, true);
}
watch(
  () => studio.inTransaction,
  (active) => {
    if (!active && drag) {
      const id = drag.pointerId;
      drag = undefined;
      if (canvas.value?.hasPointerCapture(id))
        canvas.value.releasePointerCapture(id);
    }
  },
);
function key(event: KeyboardEvent) {
  if (!studio.canEdit) return;
  if (event.key === "Escape") {
    event.preventDefault();
    if (drag) {
      const pointerId = drag.pointerId;
      drag = undefined;
      studio.cancelEdit();
      if (canvas.value?.hasPointerCapture(pointerId))
        canvas.value.releasePointerCapture(pointerId);
    }
    studio.selectKnot(null);
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    studio.removeSelected();
  }
  const knot = studio.selectedKnot;
  if (
    knot &&
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    event.preventDefault();
    studio.moveKnot(
      knot.id,
      knot.x +
        (event.key === "ArrowRight"
          ? 0.012
          : event.key === "ArrowLeft"
            ? -0.012
            : 0),
      knot.y +
        (event.key === "ArrowDown"
          ? 0.012
          : event.key === "ArrowUp"
            ? -0.012
            : 0),
    );
  }
}
onBeforeUnmount(() => {
  if (drag) {
    drag = undefined;
    studio.cancelEdit();
  }
});
</script>
<template>
  <div class="editor-stage">
    <div class="editor-toolbar">
      <span>{{ labels[studio.phase] }}</span>
      <div>
        <BaseButton
          variant="text"
          :disabled="!studio.canEdit || !studio.history.length"
          @click="studio.undo"
          >撤销</BaseButton
        ><BaseButton
          variant="text"
          :disabled="!studio.canEdit || !studio.selectedId"
          @click="studio.removeSelected"
          >删除</BaseButton
        ><BaseButton
          variant="text"
          :disabled="!studio.canEdit || !studio.params.knots.length"
          @click="studio.clearKnots"
          >清空</BaseButton
        >
      </div>
    </div>
    <div class="cloth-frame">
      <canvas
        ref="canvas"
        width="600"
        height="600"
        tabindex="0"
        aria-label="扎结画布，点击添加扎结，拖动调整位置"
        :data-phase="studio.phase"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="end($event)"
        @pointercancel="end($event, true)"
        @lostpointercapture="lost"
        @keydown="key"
      />
    </div>
    <div class="editor-caption">
      <span role="status">{{ instruction }}</span
      ><span>{{ effectiveKnots(studio.params).length }} 处扎结</span>
    </div>
    <div class="accessible-editor">
      <BaseButton
        variant="secondary"
        :disabled="!studio.canEdit"
        @click="studio.addKnot()"
        >添加扎结</BaseButton
      ><label for="knot-selection">选择扎结</label
      ><select
        id="knot-selection"
        :value="studio.selectedId ?? ''"
        :disabled="!studio.canEdit"
        @change="
          studio.selectKnot(($event.target as HTMLSelectElement).value || null)
        "
      >
        <option value="">全部扎结</option>
        <option
          v-for="(knot, index) in studio.params.knots"
          :key="knot.id"
          :value="knot.id"
        >
          扎结 {{ index + 1 }}
        </option>
      </select>
    </div>
    <slot />
  </div>
</template>
