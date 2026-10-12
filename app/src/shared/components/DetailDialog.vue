<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import BaseButton from "./BaseButton.vue";
const props = defineProps<{ title: string; returnFocus?: HTMLElement }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
let previous: HTMLElement | null = null;
onMounted(() => {
  previous = props.returnFocus ?? (document.activeElement as HTMLElement);
  dialog.value?.showModal();
});
onBeforeUnmount(() => {
  dialog.value?.close();
  if (previous?.isConnected) previous.focus();
});
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return;
  const bounds = dialog.value.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    emit("close");
}
</script>
<template>
  <dialog
    ref="dialog"
    aria-labelledby="detail-title"
    @cancel.prevent="emit('close')"
    @click="backdrop"
  >
    <div class="dialog-heading">
      <h2 id="detail-title">{{ title }}</h2>
      <BaseButton
        variant="text"
        aria-label="关闭详情"
        autofocus
        @click="emit('close')"
        >关闭 ×</BaseButton
      >
    </div>
    <slot />
  </dialog>
</template>
