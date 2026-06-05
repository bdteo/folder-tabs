<script setup lang="ts">
import { computed } from 'vue';
import {
  normalizeFolderTabEdge,
  type FolderBinderDepth,
  type FolderTabEdge,
  type FolderTabOrientation,
  type FolderTone,
} from './folderTabs';

const props = withDefaults(defineProps<{
  orientation?: FolderTabOrientation;
  edge?: FolderTabEdge | null;
  depth?: FolderBinderDepth;
  layers?: number;
  activeIndex?: number;
  tone?: FolderTone;
  pulled?: boolean;
}>(), {
  orientation: 'horizontal',
  edge: null,
  depth: 'raised',
  layers: 2,
  activeIndex: 0,
  tone: 'slate',
  pulled: false,
});

const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, props.orientation));
const boundedLayers = computed(() => Math.min(Math.max(Math.round(props.layers), 0), 2));
const boundedActiveIndex = computed(() => Math.max(Math.round(props.activeIndex), 0));

const rootClasses = computed(() => [
  'folder-binder',
  `folder-binder--${props.orientation}`,
  `folder-binder--edge-${normalizedEdge.value}`,
  `folder-binder--depth-${props.depth}`,
  `folder-binder--layers-${boundedLayers.value}`,
  `folder-binder--tone-${props.tone}`,
  { 'is-pulled': props.pulled },
]);

const rootStyle = computed(() => ({
  '--folder-binder-active-index': boundedActiveIndex.value,
  '--folder-tab-panel-active-index': boundedActiveIndex.value,
}));
</script>

<template>
  <div :class="rootClasses" :style="rootStyle">
    <slot />
  </div>
</template>
