<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "text";
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "primary", type: "button" },
);
</script>
<template>
  <button :type="type" class="button" :class="`button--${variant}`">
    <slot />
  </button>
</template>
