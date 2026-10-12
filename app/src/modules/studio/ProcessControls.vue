<script setup lang="ts">
import { computed } from "vue";
import type { StudioPhase } from "../../shared/types";
import BaseButton from "../../shared/components/BaseButton.vue";
const props = defineProps<{
  phase: StudioPhase;
  progress: number;
  initialized: boolean;
}>();
defineEmits<{ start: []; untie: []; reedit: []; skip: [] }>();
const labels: Record<StudioPhase, string> = {
  edit: "开始浸染 ↗",
  preparing: "正在准备图像…",
  dye: "正在浸染…",
  oxidize: "正在氧化显色…",
  tied: "拆线，展开纹样 ↗",
  unfold: "正在拆线…",
  done: "再染一次 ↻",
};
const event = computed(() =>
  props.phase === "edit"
    ? "start"
    : props.phase === "tied"
      ? "untie"
      : "reedit",
);
</script>
<template>
  <div class="process-actions">
    <BaseButton
      :disabled="!initialized || !['edit', 'tied', 'done'].includes(phase)"
      @click="
        event === 'start'
          ? $emit('start')
          : event === 'untie'
            ? $emit('untie')
            : $emit('reedit')
      "
      >{{ labels[phase] }}</BaseButton
    ><BaseButton
      v-if="phase === 'dye' || phase === 'oxidize'"
      variant="text"
      @click="$emit('skip')"
      >跳过动画</BaseButton
    >
  </div>
  <progress
    v-if="phase === 'dye' || phase === 'oxidize' || phase === 'unfold'"
    class="process-progress"
    :value="progress"
    max="1"
    aria-label="制作进度"
  />
</template>
