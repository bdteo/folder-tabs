<script setup lang="ts">
import { computed } from 'vue';
import {
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderSurfaceTexture,
  normalizeFolderTone,
  type FolderSurfaceTextColor,
  type FolderSurfaceTextureBlendMode,
  type FolderSurfaceTexture,
  type FolderTone,
} from './folderTabs';

const props = withDefaults(defineProps<{
  tone?: FolderTone;
  texture?: FolderSurfaceTexture;
  textureBlendMode?: FolderSurfaceTextureBlendMode;
  textColor?: FolderSurfaceTextColor;
}>(), {
  tone: 'slate',
  texture: 'none',
  textureBlendMode: 'auto',
  textColor: 'auto',
});

const rootClasses = computed(() => [
  'folder',
  `folder--tone-${normalizeFolderTone(props.tone)}`,
  `folder--texture-${normalizeFolderSurfaceTexture(props.texture)}`,
  `folder--texture-blend-${normalizeFolderSurfaceTextureBlendMode(props.textureBlendMode)}`,
  `folder--text-color-${normalizeFolderSurfaceTextColor(props.textColor)}`,
]);
</script>

<template>
  <section :class="rootClasses">
    <slot />
  </section>
</template>
