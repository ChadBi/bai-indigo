<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { navigation } from "./router";
import { useStudioStore } from "../stores/studio";
import { useWorksStore } from "../stores/works";
const studio = useStudioStore();
const works = useWorksStore();
onMounted(() => {
  void studio.initialize();
});
onBeforeUnmount(() => {
  studio.dispose();
  works.dispose();
});
</script>
<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header">
    <RouterLink class="brand" to="/studio" aria-label="染见白乡首页"
      ><span class="seal" aria-hidden="true">染</span
      ><span>染见白乡<small>BAI INDIGO</small></span></RouterLink
    >
    <nav aria-label="主要导航">
      <RouterLink v-for="item in navigation" :key="item.path" :to="item.path">{{
        item.name
      }}</RouterLink>
    </nav>
  </header>
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer class="site-footer">
    <span>一束线，一缸蓝，一方白布。</span><span>白族扎染工艺的数字体验</span>
  </footer>
</template>
