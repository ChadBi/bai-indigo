<script setup lang="ts">
import GlossaryModule from "./glossary/GlossaryModule.vue";
import SourceList from "../../shared/components/SourceList.vue";
import { contentRepository as content } from "../../services/content";
</script>
<template>
  <section class="page-heading">
    <span class="eyebrow">LEARN THE CRAFT</span>
    <h1>一布一染</h1>
    <p>从扎花、浸染到拆线，认识蓝与白之间的关系。</p>
  </section>
  <div class="learning-layout">
    <article class="reading">
      <h2>线扎住的，是留白。</h2>
      <p>把布料扎缠后浸染，扎紧的部分不易着色。拆开线结，留白与色晕显现。</p>
      <p>
        数字创作使用平面镜像表达折叠，使用像素计算表达防染，是工艺原理的艺术化近似。
      </p>
      <SourceList
        :refs="['ihchina-zhoucheng']"
        :sources="content.sources()"
      /><RouterLink class="button button--primary" to="/studio"
        >进入掌上扎染 ↗</RouterLink
      >
    </article>
    <GlossaryModule
      :terms="content.glossary()"
      :faqs="content.faqs()"
      :sources="content.sources()"
    />
  </div>
</template>
