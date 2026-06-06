<script setup lang="ts">
import { computed } from 'vue';
import {
  getFolderTabOrientationForEdge,
  normalizeFolderActiveIndex,
  normalizeFolderBinderDepth,
  normalizeFolderLayerCount,
  normalizeFolderTabEdge,
  normalizeFolderTabOrientation,
  normalizeFolderTone,
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

const normalizedOrientation = computed(() => normalizeFolderTabOrientation(props.orientation));
const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, normalizedOrientation.value));
const physicalOrientation = computed(() => getFolderTabOrientationForEdge(normalizedEdge.value));
const normalizedDepth = computed(() => normalizeFolderBinderDepth(props.depth));
const normalizedTone = computed(() => normalizeFolderTone(props.tone));
const boundedLayers = computed(() => normalizeFolderLayerCount(props.layers));
const boundedActiveIndex = computed(() => normalizeFolderActiveIndex(props.activeIndex));
const isPulled = computed(() => props.pulled === true);

const rootClasses = computed(() => [
  'folder-binder',
  `folder-binder--${physicalOrientation.value}`,
  `folder-binder--edge-${normalizedEdge.value}`,
  `folder-binder--depth-${normalizedDepth.value}`,
  `folder-binder--layers-${boundedLayers.value}`,
  `folder-binder--tone-${normalizedTone.value}`,
  { 'is-pulled': isPulled.value },
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
