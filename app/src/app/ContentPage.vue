<script setup lang="ts">
import { useRouter } from "vue-router";
import CultureModule from "../modules/culture/CultureModule.vue";
import StoriesModule from "../modules/stories/StoriesModule.vue";
import { contentRepository as content } from "../services/content";
import { useStudioStore } from "../stores/studio";
import type { PatternId } from "../shared/types";
defineProps<{ kind: "culture" | "stories" }>();
const router = useRouter(),
  studio = useStudioStore();
function selectPattern(id: PatternId) {
  studio.selectPattern(id);
  void router.push("/studio");
}
</script>
<template>
  <section class="page-heading">
    <span class="eyebrow">{{
      kind === "culture" ? "TRACES OF THE CRAFT" : "STORIES IN BLUE AND WHITE"
    }}</span>
    <h1>{{ kind === "culture" ? "染艺寻踪" : "白乡故事" }}</h1>
    <p>
      {{
        kind === "culture"
          ? "认识白族扎染，沿着资料发现工艺。"
          : "从一处留白，打开一段创作的故事。"
      }}
    </p>
  </section>
  <CultureModule
    v-if="kind === 'culture'"
    :entries="content.cultures()"
    :sources="content.sources()"
  /><StoriesModule
    v-else
    :entries="content.stories()"
    :sources="content.sources()"
    @select-pattern="selectPattern"
  />
</template>
