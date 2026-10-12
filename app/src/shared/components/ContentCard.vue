<script setup lang="ts">
import type { ContentEntry } from "../types";
import BaseButton from "./BaseButton.vue";
defineProps<{ entry: ContentEntry }>();
defineEmits<{ open: [] }>();
</script>
<template>
  <article class="content-card">
    <span class="eyebrow">{{
      entry.kind === "traditional" ? "传统工艺资料" : "原创内容"
    }}</span>
    <h2>{{ entry.title }}</h2>
    <p>{{ entry.summary }}</p>
    <BaseButton variant="secondary" @click="$emit('open')"
      >查看详情<span aria-hidden="true"> ↗</span></BaseButton
    >
  </article>
</template>
