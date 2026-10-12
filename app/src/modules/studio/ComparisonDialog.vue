<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import type { SessionDyeResult } from "../../shared/types";
import { effectiveKnots } from "../../engine/dye";
import DetailDialog from "../../shared/components/DetailDialog.vue";
const props = defineProps<{
  previous: SessionDyeResult;
  current: SessionDyeResult;
}>();
defineEmits<{ close: [] }>();
const urls = [
  URL.createObjectURL(props.previous.image),
  URL.createObjectURL(props.current.image),
];
function summary(result: SessionDyeResult) {
  const sizes = result.params.knots.map((k) => Math.round(k.radius * 100)),
    min = Math.min(...sizes),
    max = Math.max(...sizes);
  return `${effectiveKnots(result.params).length} 处扎结 · 留白 ${min === max ? min : min + "—" + max}% · ${{ none: "不折叠", half: "对折", quarter: "四折" }[result.params.fold]} · ${{ light: "浅染", medium: "中染", deep: "深染" }[result.params.depth]}`;
}
onBeforeUnmount(() => urls.forEach((url) => URL.revokeObjectURL(url)));
</script>
<template>
  <DetailDialog title="两次染作，一眼看见变化。" @close="$emit('close')"
    ><div class="comparison">
      <figure v-for="(result, index) in [previous, current]" :key="urls[index]">
        <img
          :src="urls[index]"
          :alt="index === 0 ? '上一次扎染作品' : '本次扎染作品'"
        />
        <figcaption>{{ index === 0 ? "上一次染作" : "本次染作" }}</figcaption>
        <p>{{ summary(result) }}</p>
      </figure>
    </div></DetailDialog
  >
</template>
