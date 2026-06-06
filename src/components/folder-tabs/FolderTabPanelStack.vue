<script setup lang="ts">
import { computed } from 'vue';
import Folder from './Folder.vue';
import FolderBinder from './FolderBinder.vue';
import {
  getFolderTabOrientationForEdge,
  normalizeFolderActiveIndex,
  normalizeFolderBinderDepth,
  normalizeFolderLayerCount,
  normalizeFolderTabEdge,
  normalizeFolderTabOrientation,
  normalizeFolderTone,
  type FolderTabEdge,
  type FolderTabOrientation,
  type FolderTabPanelStackDepth,
  type FolderTone,
} from './folderTabs';

const props = withDefaults(defineProps<{
  orientation?: FolderTabOrientation;
  edge?: FolderTabEdge | null;
  depth?: FolderTabPanelStackDepth;
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

const legacyClasses = computed(() => [
  'folder-tab-panel-stack',
  `folder-tab-panel-stack--${physicalOrientation.value}`,
  `folder-tab-panel-stack--edge-${normalizedEdge.value}`,
  `folder-tab-panel-stack--depth-${normalizedDepth.value}`,
  `folder-tab-panel-stack--layers-${boundedLayers.value}`,
  `folder-tab-panel-stack--tone-${normalizedTone.value}`,
  { 'is-pulled': isPulled.value },
]);
</script>

<template>
  <FolderBinder
    :class="legacyClasses"
    :orientation="physicalOrientation"
    :edge="normalizedEdge"
    :depth="normalizedDepth"
    :layers="boundedLayers"
    :active-index="boundedActiveIndex"
    :tone="normalizedTone"
    :pulled="isPulled"
  >
    <Folder :tone="normalizedTone">
      <slot />
    </Folder>
  </FolderBinder>
</template>
