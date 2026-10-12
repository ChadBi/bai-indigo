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
    description="在掌上扎染完成制作后，可下载 PNG 并对比两次染作。当前版本保存创作草稿；成品收藏、命名和重新打开将在作品库版本加入。"
    ><RouterLink class="button button--primary" to="/studio"
      >继续创作 ↗</RouterLink
    ></EmptyState
  >
</template>
