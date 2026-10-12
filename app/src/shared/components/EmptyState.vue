<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>
<template>
  <div class="empty-state">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>
