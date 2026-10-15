<script setup lang="ts">
import type { CultureEntry } from "../../shared/types";
import BaseButton from "../../shared/components/BaseButton.vue";

defineProps<{ entry: CultureEntry }>();
defineEmits<{ open: [] }>();
</script>

<template>
  <article class="content-card">
    <span class="eyebrow">{{ entry.category }}</span>
    <h2>{{ entry.title }}</h2>
    <p>{{ entry.summary }}</p>
    <p class="culture-card-kind">
      {{ entry.kind === "traditional" ? "传统资料" : "原创内容" }}
    </p>
    <BaseButton variant="secondary" @click="$emit('open')">
      查看详情<span aria-hidden="true"> ↗</span>
    </BaseButton>
  </article>
</template>

<style scoped>
.culture-card-kind {
  color: var(--muted);
  font-size: 12px;
}
</style>
