<script setup lang="ts">
import { computed } from 'vue';
import {
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderSurfaceTextureLayers,
  normalizeFolderSurfaceTexture,
  normalizeFolderTone,
  type FolderSurfaceTextColor,
  type FolderSurfaceTextureBlendMode,
  type FolderSurfaceTextureLayers,
  type FolderSurfaceTexture,
  type FolderTone,
} from './folderTabs';

const props = withDefaults(defineProps<{
  tone?: FolderTone;
  texture?: FolderSurfaceTexture;
  textureLayers?: FolderSurfaceTextureLayers;
  textureBlendMode?: FolderSurfaceTextureBlendMode;
  textColor?: FolderSurfaceTextColor;
}>(), {
  tone: 'slate',
  texture: 'none',
  textureLayers: 'all',
  textureBlendMode: 'auto',
  textColor: 'auto',
});

const rootClasses = computed(() => [
  'folder',
  `folder--tone-${normalizeFolderTone(props.tone)}`,
  `folder--texture-${normalizeFolderSurfaceTexture(props.texture)}`,
  ...normalizeFolderSurfaceTextureLayers(props.textureLayers).map((layer) => `folder--texture-layer-${layer}`),
  `folder--texture-blend-${normalizeFolderSurfaceTextureBlendMode(props.textureBlendMode)}`,
  `folder--text-color-${normalizeFolderSurfaceTextColor(props.textColor)}`,
]);
</script>

<template>
  <section :class="rootClasses">
    <slot />
  </section>
</template>
