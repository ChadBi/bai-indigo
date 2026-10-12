<script setup lang="ts">
defineProps<{ title: string }>();
</script>
<template>
  <details class="disclosure">
    <summary>{{ title }}</summary>
    <div class="disclosure-body"><slot /></div>
  </details>
</template>
