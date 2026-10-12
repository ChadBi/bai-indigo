<script setup lang="ts">
import { ref } from "vue";
import type { ContentImage } from "../types";
defineProps<{ image: ContentImage }>();
const failed = ref(false);
</script>
<template>
  <figure class="content-image">
    <p v-if="failed" role="status">图片暂时无法显示：{{ image.alt }}</p>
    <img
      v-else
      :src="image.src"
      :alt="image.alt"
      loading="lazy"
      @error="failed = true"
    />
    <figcaption>{{ image.caption }} · {{ image.credit }}</figcaption>
  </figure>
</template>
