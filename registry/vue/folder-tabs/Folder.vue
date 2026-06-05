<script setup lang="ts">
import { computed } from 'vue';
import type { FolderTone } from './folderTabs';

const props = withDefaults(defineProps<{
  tone?: FolderTone;
}>(), {
  tone: 'slate',
});

const rootClasses = computed(() => [
  'folder',
  `folder--tone-${props.tone}`,
]);
</script>

<template>
  <section :class="rootClasses">
    <slot />
  </section>
</template>
