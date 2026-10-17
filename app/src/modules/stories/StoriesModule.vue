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
    <div v-for="entry in entries" :key="entry.id" class="story-card">
      <span class="eyebrow">{{ entry.category }}</span>
      <ContentCard :entry="entry" @open="selected = entry" />
    </div>
  </div>
  <EmptyState v-if="!entries.length" title="还没有故事" description="图文故事将在资料与素材核对后加入。" />
 <DetailDialog
  v-if="selected"
  :title="selected.title"
  @close="selected = undefined">
  <span class="eyebrow">
    {{ selected.kind === "original" ? "原创内容" : "传统工艺资料" }}
  </span>
    <div class="story-detail">
      <div class="story-detail__body">
        <template v-if="selected.body.length">
          <p v-for="(paragraph, index) in selected.body" :key="index" class="story-detail__paragraph">
            {{ paragraph }}
          </p>
        </template>
        <EmptyState v-else title="暂无正文" description="这篇故事暂时没有正文内容。" />
      </div>

      <div class="story-detail__images">
        <template v-if="selected.images.length">
          <div v-for="image in selected.images" :key="image.src" class="story-detail__image">
            <ContentImage :image="image" />

            <p class="story-detail__license">
              <strong>许可：</strong>{{ image.license }}
            </p>

          </div>
        </template>
        <EmptyState v-else title="暂无图片" description="这篇故事暂时没有配图。" />
 </div> <!-- 关闭 story-detail__images -->

      <SourceList
  :refs="[
    ...new Set([
      ...selected.sourceRefs,
      ...selected.images.flatMap((image) => image.sourceRefs),
    ]),
  ]"
  :sources="sources"
/>

      <div v-if="selected.relatedPatternIds.length">
        <BaseButton
          v-for="id in selected.relatedPatternIds"
          :key="id"
          @click="select(id)"
        >
          从相关模板开始
        </BaseButton>
      </div>
      <p v-else class="story-detail__empty">
        暂无关联模板。
      </p>
    </div> <!-- 关闭 story-detail -->
  </DetailDialog>
</template>
<style scoped>
.story-detail__body {
  display: grid;
  gap: 1rem;
}

.story-detail__paragraph {
  margin: 0;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.story-detail__image :deep(.content-image) {
  margin: 1.5rem 0 0.5rem;
}

.story-detail__image :deep(.content-image img) {
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 430px;
  object-fit: contain;
  background: var(--white);
}

.story-detail__license {
  margin: 0.5rem 0 1rem;
  color: var(--muted);
  font-size: 0.875rem;
}

.story-detail__empty {
  color: var(--muted);
  font-size: 0.875rem;
  margin-top: 1rem;
}
</style>
