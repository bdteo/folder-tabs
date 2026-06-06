<script setup lang="ts">
import { computed } from 'vue';
import { normalizeFolderTone, type FolderTone } from './folderTabs';

const props = withDefaults(defineProps<{
  tone?: FolderTone;
}>(), {
  tone: 'slate',
});

const rootClasses = computed(() => [
  'folder',
  `folder--tone-${normalizeFolderTone(props.tone)}`,
]);
</script>

<template>
  <section :class="rootClasses">
    <slot />
  </section>
</template>
