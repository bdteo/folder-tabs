<script setup lang="ts">
import { computed } from 'vue';
import Folder from './Folder.vue';
import FolderBinder from './FolderBinder.vue';
import {
  normalizeFolderTabEdge,
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

const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, props.orientation));
const boundedLayers = computed(() => Math.min(Math.max(Math.round(props.layers), 0), 2));

const legacyClasses = computed(() => [
  'folder-tab-panel-stack',
  `folder-tab-panel-stack--${props.orientation}`,
  `folder-tab-panel-stack--edge-${normalizedEdge.value}`,
  `folder-tab-panel-stack--depth-${props.depth}`,
  `folder-tab-panel-stack--layers-${boundedLayers.value}`,
  `folder-tab-panel-stack--tone-${props.tone}`,
  { 'is-pulled': props.pulled },
]);
</script>

<template>
  <FolderBinder
    :class="legacyClasses"
    :orientation="props.orientation"
    :edge="props.edge"
    :depth="props.depth"
    :layers="props.layers"
    :active-index="props.activeIndex"
    :tone="props.tone"
    :pulled="props.pulled"
  >
    <Folder :tone="props.tone">
      <slot />
    </Folder>
  </FolderBinder>
</template>
