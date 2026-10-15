<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { CultureEntry, SourceRef } from "../../shared/types";
import CultureCard from "./CultureCard.vue";
import DetailDialog from "../../shared/components/DetailDialog.vue";
import SourceList from "../../shared/components/SourceList.vue";
import ContentImage from "../../shared/components/ContentImage.vue";
import EmptyState from "../../shared/components/EmptyState.vue";
import BaseButton from "../../shared/components/BaseButton.vue";
import {
  ALL_CATEGORIES,
  filterCultureEntries,
  getCultureCategories,
  getCultureEmptyState,
} from "./filter";
const props = defineProps<{
  entries: readonly CultureEntry[];
  sources: readonly SourceRef[];
}>();
const selected = ref<CultureEntry>();
const selectedCategory = ref(ALL_CATEGORIES);
const categories = computed(() => getCultureCategories(props.entries));
const visibleEntries = computed(() =>
  filterCultureEntries(props.entries, selectedCategory.value),
);
const emptyState = computed(() =>
  getCultureEmptyState(
    props.entries,
    visibleEntries.value,
    selectedCategory.value,
  ),
);
watch(categories, (nextCategories) => {
  if (!nextCategories.includes(selectedCategory.value)) {
    selectedCategory.value = ALL_CATEGORIES;
  }
});
</script>
<template>
  <nav class="culture-filters" aria-label="按分类筛选">
    <BaseButton
      v-for="category in categories"
      :key="category"
      variant="secondary"
      :aria-pressed="selectedCategory === category"
      @click="selectedCategory = category"
      >{{ category }}</BaseButton
    >
  </nav>
  <div class="content-grid">
    <CultureCard
      v-for="entry in visibleEntries"
      :key="entry.id"
      :entry="entry"
      @open="selected = entry"
    />
  </div>
  <EmptyState
    v-if="emptyState"
    :title="emptyState.title"
    :description="emptyState.description"
  >
    <BaseButton
      v-if="emptyState.canShowAll"
      variant="secondary"
      @click="selectedCategory = ALL_CATEGORIES"
      >查看全部资料</BaseButton
    >
  </EmptyState>
  <DetailDialog
    v-if="selected"
    :title="selected.title"
    @close="selected = undefined"
    ><div class="culture-detail">
      <p
        v-for="(paragraph, index) in selected.body"
        :key="`${index}-${paragraph}`"
      >
        {{ paragraph }}
      </p>
      <ContentImage
        v-for="(image, index) in selected.images"
        :key="`${image.src}-${index}`"
        :image="image"
      />
      <SourceList :refs="selected.sourceRefs" :sources="sources" />
    </div>
  /></DetailDialog>
</template>

<style scoped>
.culture-detail {
  min-width: 0;
  overflow-wrap: anywhere;
}

.culture-detail > p {
  line-height: 1.9;
}

:deep(.content-image) {
  max-width: 100%;
}

:deep(.content-image img) {
  width: auto;
  max-width: 100%;
  height: auto;
}
</style>
