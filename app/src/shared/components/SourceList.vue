<script setup lang="ts">
import type { SourceRef } from "../types";
defineProps<{ refs: readonly string[]; sources: readonly SourceRef[] }>();
</script>
<template>
  <div v-if="refs.length" class="sources">
    <strong>资料来源</strong>
    <ul>
      <li
        v-for="source in sources.filter((s) => refs.includes(s.id))"
        :key="source.id"
      >
        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{
          source.title
        }}</a
        ><span> · {{ source.publisher }}</span>
      </li>
    </ul>
  </div>
</template>
