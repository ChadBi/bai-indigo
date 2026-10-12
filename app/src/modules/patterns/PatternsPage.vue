<script setup lang="ts">
import { useRouter } from "vue-router";
import { contentRepository } from "../../services/content";
import { useStudioStore } from "../../stores/studio";
import type { PatternId } from "../../shared/types";
import BaseButton from "../../shared/components/BaseButton.vue";
const router = useRouter(),
  studio = useStudioStore();
function choose(id: PatternId) {
  studio.selectPattern(id);
  void router.push("/studio");
}
</script>
<template>
  <section class="page-heading">
    <span class="eyebrow">PATTERNS TO EXPLORE</span>
    <h1>纹样工坊</h1>
    <p>四个原创体验方案，和掌上扎染共用一方画布。</p>
  </section>
  <div class="content-grid patterns-grid">
    <article
      v-for="pattern in contentRepository.patterns()"
      :key="pattern.id"
      class="content-card"
    >
      <span class="eyebrow">原创体验模板</span>
      <h2>{{ pattern.title }}</h2>
      <p>{{ pattern.summary }}</p>
      <BaseButton
        variant="secondary"
        :disabled="!studio.initialized"
        @click="choose(pattern.id)"
        >使用{{ pattern.title }}</BaseButton
      >
    </article>
  </div>
</template>
