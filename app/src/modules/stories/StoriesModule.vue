<script setup lang="ts">
import { ref } from "vue";
import type { StoryEntry, SourceRef, PatternId } from "../../shared/types";
import ContentCard from "../../shared/components/ContentCard.vue";
import DetailDialog from "../../shared/components/DetailDialog.vue";
import SourceList from "../../shared/components/SourceList.vue";
import ContentImage from "../../shared/components/ContentImage.vue";
import BaseButton from "../../shared/components/BaseButton.vue";
import EmptyState from "../../shared/components/EmptyState.vue";
defineProps<{
  entries: readonly StoryEntry[];
  sources: readonly SourceRef[];
}>();
const emit = defineEmits<{ selectPattern: [id: PatternId] }>();
const selected = ref<StoryEntry>();
function select(id: PatternId) {
  selected.value = undefined;
  emit("selectPattern", id);
}
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
    title="还没有故事"
    description="图文故事将在资料与素材核对后加入。"
  /><DetailDialog
    v-if="selected"
    :title="selected.title"
    @close="selected = undefined"
    ><span class="eyebrow">{{
      selected.kind === "original" ? "原创内容" : "传统工艺资料"
    }}</span>
    <p v-for="paragraph in selected.body" :key="paragraph">{{ paragraph }}</p>
    <ContentImage
      v-for="image in selected.images"
      :key="image.src"
      :image="image"
    /><SourceList :refs="selected.sourceRefs" :sources="sources" /><BaseButton
      v-for="id in selected.relatedPatternIds"
      :key="id"
      @click="select(id)"
      >从相关模板开始</BaseButton
    ></DetailDialog
  >
</template>
