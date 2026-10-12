<script setup lang="ts">
import EmptyState from "../../shared/components/EmptyState.vue";
</script>
<template>
  <section class="page-heading">
    <span class="eyebrow">YOUR INDIGO WORKS</span>
    <h1>染作生成</h1>
    <p>让每次创作都有自己的名字。</p>
  </section>
  <EmptyState
    title="作品库正在建设"
    description="当前版本保存创作草稿。命名、作品收藏、对比和 PNG 导出将在完整制作流程迁移后加入。"
    ><RouterLink class="button button--primary" to="/studio"
      >继续创作 ↗</RouterLink
    ></EmptyState
  >
</template>
