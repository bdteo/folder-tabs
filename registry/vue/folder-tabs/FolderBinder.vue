<script setup lang="ts">
import { computed } from 'vue';
import {
  getFolderTabOrientationForEdge,
  normalizeFolderActiveIndex,
  normalizeFolderBinderDepth,
  normalizeFolderLayerCount,
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderSurfaceTextureLayers,
  normalizeFolderSurfaceTexture,
  normalizeFolderTabEdge,
  normalizeFolderTabOrientation,
  normalizeFolderTone,
  type FolderBinderDepth,
  type FolderSurfaceTextColor,
  type FolderSurfaceTextureBlendMode,
  type FolderSurfaceTextureLayers,
  type FolderSurfaceTexture,
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
  texture?: FolderSurfaceTexture;
  textureLayers?: FolderSurfaceTextureLayers;
  textureBlendMode?: FolderSurfaceTextureBlendMode;
  textColor?: FolderSurfaceTextColor;
  pulled?: boolean;
}>(), {
  orientation: 'horizontal',
  edge: null,
  depth: 'raised',
  layers: 2,
  activeIndex: 0,
  tone: 'slate',
  texture: 'none',
  textureLayers: 'all',
  textureBlendMode: 'auto',
  textColor: 'auto',
  pulled: false,
});

const normalizedOrientation = computed(() => normalizeFolderTabOrientation(props.orientation));
const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, normalizedOrientation.value));
const physicalOrientation = computed(() => getFolderTabOrientationForEdge(normalizedEdge.value));
const normalizedDepth = computed(() => normalizeFolderBinderDepth(props.depth));
const normalizedTone = computed(() => normalizeFolderTone(props.tone));
const normalizedTexture = computed(() => normalizeFolderSurfaceTexture(props.texture));
const normalizedTextureLayers = computed(() => normalizeFolderSurfaceTextureLayers(props.textureLayers));
const normalizedTextureBlendMode = computed(() => normalizeFolderSurfaceTextureBlendMode(props.textureBlendMode));
const normalizedTextColor = computed(() => normalizeFolderSurfaceTextColor(props.textColor));
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
  `folder-binder--texture-${normalizedTexture.value}`,
  ...normalizedTextureLayers.value.map((layer) => `folder-binder--texture-layer-${layer}`),
  `folder-binder--texture-blend-${normalizedTextureBlendMode.value}`,
  `folder-binder--text-color-${normalizedTextColor.value}`,
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
