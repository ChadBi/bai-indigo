<script setup lang="ts">
import { ref } from "vue";
import type { CultureEntry, SourceRef } from "../../shared/types";
import ContentCard from "../../shared/components/ContentCard.vue";
import DetailDialog from "../../shared/components/DetailDialog.vue";
import SourceList from "../../shared/components/SourceList.vue";
import EmptyState from "../../shared/components/EmptyState.vue";
defineProps<{
  entries: readonly CultureEntry[];
  sources: readonly SourceRef[];
}>();
const selected = ref<CultureEntry>();
</script>
<template>
  <div class="content-grid">
    <ContentCard
      v-for="entry in entries"
      :key="entry.id"
      :entry="entry"
      @open="selected = entry"
    />
  </div>
  <EmptyState
    v-if="!entries.length"
    title="还没有资料"
    description="文化资料将在核对来源后加入。"
  /><DetailDialog
    v-if="selected"
    :title="selected.title"
    @close="selected = undefined"
    ><p v-for="paragraph in selected.body" :key="paragraph">{{ paragraph }}</p>
    <SourceList :refs="selected.sourceRefs" :sources="sources"
  /></DetailDialog>
</template>
