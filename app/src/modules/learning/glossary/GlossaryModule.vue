<script setup lang="ts">
import type { GlossaryEntry, FaqEntry, SourceRef } from "../../../shared/types";
import Disclosure from "../../../shared/components/Disclosure.vue";
import SourceList from "../../../shared/components/SourceList.vue";
defineProps<{
  terms: readonly GlossaryEntry[];
  faqs: readonly FaqEntry[];
  sources: readonly SourceRef[];
}>();
</script>
<template>
  <section class="glossary" aria-labelledby="glossary-heading">
    <h2 id="glossary-heading">术语与常见问题</h2>
    <Disclosure v-for="term in terms" :key="term.id" :title="term.term"
      ><p>{{ term.explanation }}</p>
      <SourceList :refs="term.sourceRefs" :sources="sources" /></Disclosure
    ><Disclosure v-for="faq in faqs" :key="faq.id" :title="faq.question"
      ><p>{{ faq.answer }}</p>
      <SourceList :refs="faq.sourceRefs" :sources="sources"
    /></Disclosure>
    <p v-if="!terms.length && !faqs.length">暂无解释内容。</p>
  </section>
</template>
