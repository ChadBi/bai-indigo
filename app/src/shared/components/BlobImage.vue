<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ blob: Blob; alt: string }>();
const src = ref(""),
  failed = ref(false);
watch(
  () => props.blob,
  (blob, _old, onCleanup) => {
    failed.value = false;
    const url = URL.createObjectURL(blob);
    src.value = url;
    onCleanup(() => URL.revokeObjectURL(url));
  },
  { immediate: true },
);
</script>
<template>
  <p v-if="failed" class="image-fallback" role="status">
    图片暂时无法显示：{{ alt }}
  </p>
  <img v-else :src="src" :alt="alt" loading="lazy" @error="failed = true" />
</template>
