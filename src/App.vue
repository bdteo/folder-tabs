<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import {
  FolderAttachment,
  FolderTabs,
  folderPaperTexturePresetOptions,
  getFolderPaperTextureStyle,
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderTabRotation,
  type FolderPaperTexturePresetKey,
  type FolderStackRotation,
  type FolderSurfaceTextColor,
  type FolderSurfaceTextureBlendMode,
  type FolderSurfaceTextureLayerPreset,
  type FolderSurfaceTexture,
  type FolderTabRotation,
  type FolderTabItem,
} from './components/folder-tabs';

type DemoSurfaceMode =
  | 'clean'
  | 'fiber'
  | FolderPaperTexturePresetKey;

const icon = (name: string, children: ReturnType<typeof h>[]) => defineComponent({
  name,
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }, children),
});

const Icons = {
  archive: icon('IconArchive', [
    h('path', { d: 'M3 7h18' }),
    h('path', { d: 'M5 7v14h14V7' }),
    h('path', { d: 'M8 3h8l2 4H6l2-4Z' }),
  ]),
  briefcase: icon('IconBriefcase', [
    h('path', { d: 'M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1' }),
    h('rect', { x: '3', y: '6', width: '18', height: '15', rx: '2' }),
    h('path', { d: 'M3 12h18' }),
  ]),
  camera: icon('IconCamera', [
    h('path', { d: 'M4 7h4l2-3h4l2 3h4v13H4V7Z' }),
    h('circle', { cx: '12', cy: '13', r: '4' }),
  ]),
  compass: icon('IconCompass', [
    h('circle', { cx: '12', cy: '12', r: '9' }),
    h('path', { d: 'm15 9-2 6-6 2 2-6 6-2Z' }),
  ]),
  graph: icon('IconGraph', [
    h('path', { d: 'M4 19V5' }),
    h('path', { d: 'M4 19h17' }),
    h('path', { d: 'm8 15 4-5 4 3 4-7' }),
  ]),
  grid: icon('IconGrid', [
    h('rect', { x: '4', y: '4', width: '7', height: '7' }),
    h('rect', { x: '13', y: '4', width: '7', height: '7' }),
    h('rect', { x: '4', y: '13', width: '7', height: '7' }),
    h('rect', { x: '13', y: '13', width: '7', height: '7' }),
  ]),
  pin: icon('IconPin', [
    h('path', { d: 'M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11Z' }),
    h('circle', { cx: '12', cy: '10', r: '2.5' }),
  ]),
  spark: icon('IconSpark', [
    h('path', { d: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z' }),
    h('path', { d: 'm19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z' }),
  ]),
  note: icon('IconNote', [
    h('path', { d: 'M6 3h9l3 3v18H6V3Z' }),
    h('path', { d: 'M14 3v6h6' }),
    h('path', { d: 'M9 13h6' }),
    h('path', { d: 'M9 17h7' }),
  ]),
};

const caseTabs: FolderTabItem[] = [
  { key: 'intake', label: 'Client intake', shortLabel: 'Intake', tone: 'copper', icon: Icons.archive, count: 8 },
  { key: 'evidence', label: 'Evidence cabinet', shortLabel: 'Evidence', tone: 'teal', icon: Icons.briefcase, count: 14 },
  { key: 'strategy', label: 'Strategy map', shortLabel: 'Strategy', tone: 'moss', icon: Icons.compass, count: 3 },
  { key: 'signals', label: 'Signal model', shortLabel: 'Signals', tone: 'violet', icon: Icons.graph, count: 6 },
  { key: 'review', label: 'Counsel review', shortLabel: 'Review', tone: 'slate', icon: Icons.note, count: 2 },
  { key: 'closing', label: 'Closing file', shortLabel: 'Closing', tone: 'steel', icon: Icons.archive, count: 1 },
];

const defaultClosingTint = '#7890a3';
const closingTint = ref(defaultClosingTint);
const closingColorPresets = [
  { label: 'Steel', color: defaultClosingTint },
  { label: 'Harbor', color: '#5f7896' },
  { label: 'Rain', color: '#8aa8b5' },
  { label: 'Ink', color: '#42627f' },
  { label: 'Juniper', color: '#6b8c89' },
];

const primaryBaseTabs: FolderTabItem[] = caseTabs.map((tab, index) => ({
  ...tab,
  edge: 'top',
  gravity: index < 2 ? 'start' : 'end',
}));
const closingAccent = computed(() => `color-mix(in srgb, ${closingTint.value} 42%, #ffffff)`);
const closingTintStyle = computed(() => ({ '--demo-closing-tint': closingTint.value }));
const primaryTabs = computed<FolderTabItem[]>(() => primaryBaseTabs.map((tab) => (
  tab.key === 'closing'
    ? { ...tab, tint: closingTint.value, accent: closingAccent.value }
    : tab
)));

const workbenchTabs: FolderTabItem[] = [
  {
    key: 'photos',
    label: 'Photo gallery',
    shortLabel: 'Photos',
    tone: 'teal',
    edge: 'top',
    gravity: 'start',
    icon: Icons.camera,
    count: 8,
  },
  {
    key: 'plans',
    label: 'Floor plans',
    shortLabel: 'Plans',
    tone: 'moss',
    edge: 'top',
    gravity: 'end',
    icon: Icons.grid,
    count: 2,
  },
  {
    key: 'exterior',
    label: 'Exterior photos',
    shortLabel: 'Ext.',
    tone: 'copper',
    edge: 'left',
    gravity: 'start',
    icon: Icons.archive,
    count: 4,
  },
  {
    key: 'interior',
    label: 'Interior rooms',
    shortLabel: 'Int.',
    tone: 'slate',
    edge: 'left',
    gravity: 'end',
    icon: Icons.briefcase,
    count: 5,
  },
  {
    key: 'maps',
    label: 'Maps',
    shortLabel: 'Maps',
    tone: 'violet',
    edge: 'right',
    gravity: 'start',
    icon: Icons.pin,
    count: 1,
  },
  {
    key: 'review',
    label: 'Review notes',
    shortLabel: 'Review',
    tone: 'moss',
    edge: 'right',
    gravity: 'end',
    icon: Icons.note,
    count: 2,
  },
  {
    key: 'timeline',
    label: 'Auction timeline',
    shortLabel: 'Timeline',
    tone: 'slate',
    edge: 'bottom',
    gravity: 'center',
    icon: Icons.spark,
    count: 3,
  },
];

const demoParams = new URLSearchParams(window.location.search);

function getDemoParam(paramNames: string | string[]): string | null {
  const names = Array.isArray(paramNames) ? paramNames : [paramNames];

  for (const name of names) {
    const value = demoParams.get(name);

    if (value) {
      return value;
    }
  }

  return null;
}

function replaceDemoQueryParam(
  name: string,
  value: string,
  options: { aliases?: string[]; defaultValue?: string } = {},
) {
  const url = new URL(window.location.href);

  for (const paramName of [name, ...(options.aliases ?? [])]) {
    url.searchParams.delete(paramName);
  }

  if (value !== options.defaultValue) {
    url.searchParams.set(name, value);
  }

  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function demoActiveKey(
  demoTabs: FolderTabItem[],
  paramNames: string | string[],
  fallbackKey: string,
): string {
  const requestedKey = getDemoParam(paramNames);

  if (!requestedKey) {
    return fallbackKey;
  }

  return demoTabs.some((tab) => !tab.disabled && String(tab.key) === requestedKey)
    ? requestedKey
    : fallbackKey;
}

function demoHoverKey(paramNames: string | string[]): string | null {
  return getDemoParam(paramNames);
}

function formatCount(tab: FolderTabItem | null | undefined): string {
  if (!tab) {
    return '';
  }

  return String(tab.countLabel ?? tab.count ?? '');
}

const primaryActive = ref(demoActiveKey(primaryBaseTabs, ['activePrimary', 'activeWrap', 'activeTop'], 'evidence'));
const workbenchActive = ref(demoActiveKey(
  workbenchTabs,
  ['activeWorkbench', 'activeMixed', 'activeLeft', 'activeRight', 'activeBottom'],
  'photos',
));
const railActive = ref(demoActiveKey(caseTabs, ['activeRail', 'activeStandalone'], 'strategy'));
const primaryHoverKey = ref(demoHoverKey(['hoverPrimary', 'hoverWrap', 'hoverTop', 'hover']));
const workbenchHoverKey = ref(demoHoverKey([
  'hoverWorkbench',
  'hoverMixed',
  'hoverLeft',
  'hoverRight',
  'hoverBottom',
  'hover',
]));
const stackRotationModes: Array<{ key: FolderStackRotation; label: string }> = [
  { key: 'none', label: 'Straight' },
  { key: 'folders', label: 'Folder sheets' },
  { key: 'pieces', label: 'Whole pieces' },
];
const tabRotationModes: Array<{ key: FolderTabRotation; label: string }> = [
  { key: 'straight', label: 'Straight tabs' },
  { key: 'rotated', label: 'Rotated tabs' },
];
const surfaceModes: Array<{ key: DemoSurfaceMode; label: string }> = [
  { key: 'clean', label: 'Clean' },
  { key: 'fiber', label: 'Fiber paper' },
  ...folderPaperTexturePresetOptions.map(({ key, label }) => ({ key, label })),
];
const textureLayerModes: Array<{ key: FolderSurfaceTextureLayerPreset; label: string }> = [
  { key: 'all', label: 'All layers' },
  { key: 'shell', label: 'Shell only' },
  { key: 'sheet', label: 'Sheets only' },
  { key: 'content', label: 'Content only' },
  { key: 'tab', label: 'Handles only' },
  { key: 'none', label: 'No texture layer' },
];
const textureBlendModes: Array<{ key: FolderSurfaceTextureBlendMode; label: string }> = [
  { key: 'auto', label: 'Auto' },
  { key: 'normal', label: 'Normal' },
  { key: 'multiply', label: 'Multiply' },
  { key: 'overlay', label: 'Overlay' },
  { key: 'soft-light', label: 'Soft light' },
  { key: 'hard-light', label: 'Hard light' },
  { key: 'color-burn', label: 'Color burn' },
  { key: 'luminosity', label: 'Luminosity' },
];
const textColorModes: Array<{ key: FolderSurfaceTextColor; label: string }> = [
  { key: 'auto', label: 'Auto' },
  { key: 'light', label: 'Light ink' },
  { key: 'dark', label: 'Dark ink' },
  { key: 'inherit', label: 'Inherit' },
];
const rotationModeParam = getDemoParam(['stackRotation', 'rotation']);
const stackRotationMode = ref<FolderStackRotation>(
  rotationModeParam === 'none' || rotationModeParam === 'folders' || rotationModeParam === 'pieces'
    ? rotationModeParam
    : 'folders',
);
const tabRotationParam = getDemoParam(['tabRotation', 'handleRotation', 'handles']);
const tabRotationMode = ref<FolderTabRotation>(normalizeFolderTabRotation(tabRotationParam));
const surfaceModeParam = getDemoParam(['paperTexture', 'paper', 'texture', 'surface']);
const surfaceMode = ref<DemoSurfaceMode>(normalizeDemoSurfaceMode(surfaceModeParam));
const textureLayerParam = getDemoParam(['textureLayers', 'paperLayers', 'layers']);
const textureLayerMode = ref<FolderSurfaceTextureLayerPreset>(normalizeDemoTextureLayerMode(textureLayerParam));
const textureBlendModeParam = getDemoParam(['textureBlendMode', 'textureBlend', 'paperBlend', 'blend']);
const textureBlendMode = ref<FolderSurfaceTextureBlendMode>(
  normalizeFolderSurfaceTextureBlendMode(textureBlendModeParam),
);
const textColorParam = getDemoParam(['textColor', 'text', 'ink']);
const textColor = ref<FolderSurfaceTextColor>(normalizeFolderSurfaceTextColor(textColorParam));

function setStackRotationMode(mode: FolderStackRotation) {
  stackRotationMode.value = mode;
  replaceDemoQueryParam('stackRotation', mode, {
    aliases: ['rotation'],
    defaultValue: 'folders',
  });
}

function setTabRotationMode(mode: FolderTabRotation) {
  tabRotationMode.value = mode;
  replaceDemoQueryParam('tabRotation', mode, {
    aliases: ['handleRotation', 'handles'],
    defaultValue: 'straight',
  });
}

function setSurfaceMode(mode: DemoSurfaceMode) {
  surfaceMode.value = mode;
  replaceDemoQueryParam('texture', mode, {
    aliases: ['paperTexture', 'paper', 'surface'],
    defaultValue: 'clean',
  });
}

function setTextureLayerMode(mode: FolderSurfaceTextureLayerPreset) {
  textureLayerMode.value = mode;
  replaceDemoQueryParam('textureLayers', mode, {
    aliases: ['paperLayers', 'layers'],
    defaultValue: 'all',
  });
}

function setTextureBlendMode(mode: FolderSurfaceTextureBlendMode) {
  textureBlendMode.value = mode;
  replaceDemoQueryParam('blend', mode, {
    aliases: ['textureBlendMode', 'textureBlend', 'paperBlend'],
    defaultValue: 'auto',
  });
}

function setTextColor(mode: FolderSurfaceTextColor) {
  textColor.value = mode;
  replaceDemoQueryParam('ink', mode, {
    aliases: ['textColor', 'text'],
    defaultValue: 'auto',
  });
}

function setClosingTint(color: string) {
  const normalizedColor = color.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(normalizedColor)) {
    closingTint.value = normalizedColor;
  }
}

const activePrimary = computed(() => primaryTabs.value.find((tab) => String(tab.key) === primaryActive.value) ?? null);
const activeWorkbench = computed(() => workbenchTabs.find((tab) => String(tab.key) === workbenchActive.value) ?? null);
const activeRail = computed(() => caseTabs.find((tab) => String(tab.key) === railActive.value) ?? null);
const primaryCount = computed(() => formatCount(activePrimary.value));
const workbenchCount = computed(() => formatCount(activeWorkbench.value));
const surfaceTexture = computed<FolderSurfaceTexture>(() => (surfaceMode.value === 'clean' ? 'none' : 'paper'));
const surfaceStyle = computed(() => getFolderPaperTextureStyle(surfaceMode.value));
const workbenchEdgeLabel = computed(() => {
  const edge = activeWorkbench.value?.edge ?? 'top';

  return `${edge} edge`;
});
const workbenchCaption = computed(() => {
  switch (activeWorkbench.value?.edge) {
    case 'left':
      return 'Left-side folders behave like a pulled-out side index while the media stays inside the same binder.';
    case 'right':
      return 'Right-side folders mirror the same physical rules without needing a second component.';
    case 'bottom':
      return 'Bottom folders tuck under the sheet and keep the thumbnail tray visually attached.';
    default:
      return 'Top folders can split into start and end groups while sharing one continuous binder surface.';
  }
});

function normalizeDemoSurfaceMode(value: string | null): DemoSurfaceMode {
  if (value === 'watercolor' || value === 'image' || value === 'asset') {
    return 'watercolor';
  }

  if (
    value === 'paper03HybridStrong'
    || value === 'paper3HybridStrong'
    || value === 'paper03'
    || value === 'paper3'
    || value === 'hybrid3'
    || value === '3'
  ) {
    return 'paper03HybridStrong';
  }

  if (
    value === 'paper03HybridStrongRepeat'
    || value === 'paper3HybridStrongRepeat'
    || value === 'paper03Repeat'
    || value === 'paper3Repeat'
    || value === 'hybrid3Repeat'
    || value === '3Repeat'
  ) {
    return 'paper03HybridStrongRepeat';
  }

  if (
    value === 'paper05HybridStrong'
    || value === 'paper5HybridStrong'
    || value === 'paper05'
    || value === 'paper5'
    || value === 'hybrid5'
    || value === '5'
  ) {
    return 'paper05HybridStrong';
  }

  if (
    value === 'paper05HybridStrongRepeat'
    || value === 'paper5HybridStrongRepeat'
    || value === 'paper05Repeat'
    || value === 'paper5Repeat'
    || value === 'hybrid5Repeat'
    || value === '5Repeat'
  ) {
    return 'paper05HybridStrongRepeat';
  }

  if (value === 'paper' || value === 'fiber' || value === 'fibers' || value === 'procedural') {
    return 'fiber';
  }

  return 'clean';
}

function normalizeDemoTextureLayerMode(value: string | null): FolderSurfaceTextureLayerPreset {
  if (
    value === 'all'
    || value === 'shell'
    || value === 'sheet'
    || value === 'content'
    || value === 'tab'
    || value === 'none'
  ) {
    return value;
  }

  if (value === 'handles' || value === 'tabs') {
    return 'tab';
  }

  return 'all';
}
</script>

<template>
  <main
    class="demo-shell"
    :class="[
      `demo-shell--surface-${surfaceMode}`,
      { 'demo-shell--paper': surfaceTexture === 'paper' },
    ]"
    :style="surfaceStyle"
  >
    <section id="primary-binder-demo" class="demo-showcase" aria-label="FolderTabs primary binder demo">
      <div class="demo-showcase__copy">
        <p class="demo-kicker">Vue physical primitive</p>
        <h1>FolderTabs</h1>
        <p class="demo-lede">
          Atomic folder pieces with attached handles, remembered stack depth,
          and direction-aware pull motion.
        </p>
        <div class="demo-proofline" aria-hidden="true">
          <span>split lanes</span>
          <span>surface tilt</span>
          <span>paper grain</span>
          <span>roving focus</span>
        </div>
        <div class="demo-controls">
          <div class="demo-controls__group">
            <span class="demo-controls__label">Rotation</span>
            <div class="demo-mode-switch" aria-label="Stack rotation mode">
              <button
                v-for="mode in stackRotationModes"
                :key="mode.key"
                :data-demo-control="`rotation:${mode.key}`"
                type="button"
                :class="{ 'is-active': stackRotationMode === mode.key }"
                :aria-pressed="stackRotationMode === mode.key"
                @click="setStackRotationMode(mode.key)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="demo-controls__group">
            <span class="demo-controls__label">Tab handles</span>
            <div class="demo-mode-switch" aria-label="Tab handle rotation mode">
              <button
                v-for="mode in tabRotationModes"
                :key="mode.key"
                :data-demo-control="`tab-rotation:${mode.key}`"
                type="button"
                :class="{ 'is-active': tabRotationMode === mode.key }"
                :aria-pressed="tabRotationMode === mode.key"
                @click="setTabRotationMode(mode.key)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="demo-controls__group">
            <span class="demo-controls__label">Surface</span>
            <div class="demo-mode-switch" aria-label="Surface texture mode">
              <button
                v-for="mode in surfaceModes"
                :key="mode.key"
                :data-demo-control="`surface:${mode.key}`"
                type="button"
                :class="{ 'is-active': surfaceMode === mode.key }"
                :aria-pressed="surfaceMode === mode.key"
                @click="setSurfaceMode(mode.key)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="demo-controls__group">
            <span class="demo-controls__label">Blend</span>
            <div class="demo-mode-switch" aria-label="Texture blend mode">
              <button
                v-for="mode in textureBlendModes"
                :key="mode.key"
                :data-demo-control="`blend:${mode.key}`"
                type="button"
                :class="{ 'is-active': textureBlendMode === mode.key }"
                :aria-pressed="textureBlendMode === mode.key"
                @click="setTextureBlendMode(mode.key)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="demo-controls__group">
            <span class="demo-controls__label">Paper layers</span>
            <div class="demo-mode-switch" aria-label="Texture layer mode">
              <button
                v-for="mode in textureLayerModes"
                :key="mode.key"
                :data-demo-control="`layers:${mode.key}`"
                type="button"
                :class="{ 'is-active': textureLayerMode === mode.key }"
                :aria-pressed="textureLayerMode === mode.key"
                @click="setTextureLayerMode(mode.key)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="demo-controls__group">
            <span class="demo-controls__label">Ink</span>
            <div class="demo-mode-switch" aria-label="Text color mode">
              <button
                v-for="mode in textColorModes"
                :key="mode.key"
                :data-demo-control="`ink:${mode.key}`"
                type="button"
                :class="{ 'is-active': textColor === mode.key }"
                :aria-pressed="textColor === mode.key"
                @click="setTextColor(mode.key)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <FolderAttachment
        v-model="primaryActive"
        class="demo-stage demo-stage--primary"
        folder-class="demo-folder demo-folder--primary"
        :tabs="primaryTabs"
        ariaLabel="Case binder sections"
        orientation="horizontal"
        edge="top"
        appearance="stack"
        expand-on="hover"
        depth="deep"
        tone="slate"
        :stack-rotation="stackRotationMode"
        :tab-rotation="tabRotationMode"
        :texture="surfaceTexture"
        :texture-layers="textureLayerMode"
        :texture-blend-mode="textureBlendMode"
        :text-color="textColor"
        :layers="2"
        :emulated-hover-key="primaryHoverKey"
      >
        <div class="demo-folder__main">
          <p class="demo-file__eyebrow">same top edge</p>
          <h2>{{ activePrimary?.label }}</h2>
          <p>
            Start and end tab groups share one physical binder edge, so the
            empty space between groups reads as real desk space instead of a
            layout gap.
          </p>
          <div class="demo-folder__color-lab" :style="closingTintStyle">
            <label class="demo-folder__color-field">
              <span>Closing tint</span>
              <input
                v-model="closingTint"
                type="color"
                aria-label="Closing folder tint"
              >
            </label>
            <span class="demo-folder__color-value">{{ closingTint.toUpperCase() }}</span>
            <div class="demo-folder__color-presets" aria-label="Closing tint presets">
              <button
                v-for="swatch in closingColorPresets"
                :key="swatch.color"
                type="button"
                class="demo-folder__color-preset"
                :class="{ 'is-active': closingTint === swatch.color }"
                :style="{ backgroundColor: swatch.color }"
                :aria-label="`Use ${swatch.label} tint`"
                :title="swatch.label"
                @click="setClosingTint(swatch.color)"
              ></button>
            </div>
            <button
              type="button"
              class="demo-folder__color-reset"
              @click="setClosingTint(defaultClosingTint)"
            >
              Reset
            </button>
          </div>
        </div>

        <div class="demo-folder__stamp" aria-hidden="true">
          {{ primaryCount }}
        </div>

        <dl class="demo-folder__ledger">
          <div>
            <dt>active folder</dt>
            <dd>{{ activePrimary?.shortLabel }}</dd>
          </div>
          <div>
            <dt>pull model</dt>
            <dd>handle first</dd>
          </div>
          <div>
            <dt>stack order</dt>
            <dd>remembered</dd>
          </div>
        </dl>
      </FolderAttachment>
    </section>

    <section id="edge-workbench-demo" class="demo-workbench" aria-label="FolderTabs edge workbench demo">
      <div class="demo-section-copy">
        <p class="demo-kicker">one binder, every edge</p>
        <h2>Fewer demos, more behavior</h2>
        <p>
          The workbench below replaces the old edge-by-edge gallery: top,
          left, right, and bottom tabs are all first-class folders inside one
          stack.
        </p>
      </div>

      <div class="demo-workbench__layout">
        <FolderAttachment
          v-model="workbenchActive"
          class="demo-stage demo-stage--workbench"
          folder-class="demo-folder demo-folder--media"
          :tabs="workbenchTabs"
          ariaLabel="Four-edge media binder sections"
          orientation="horizontal"
          edge="top"
          appearance="stack"
          expand-on="hover"
          depth="deep"
          tone="teal"
          :stack-rotation="stackRotationMode"
          :tab-rotation="tabRotationMode"
          :texture="surfaceTexture"
          :texture-layers="textureLayerMode"
          :texture-blend-mode="textureBlendMode"
          :text-color="textColor"
          :layers="2"
          :emulated-hover-key="workbenchHoverKey"
        >
          <div class="demo-media">
            <div class="demo-media__copy">
              <p class="demo-file__eyebrow">{{ workbenchEdgeLabel }}</p>
              <h2>{{ activeWorkbench?.shortLabel ?? activeWorkbench?.label }}</h2>
              <p>{{ workbenchCaption }}</p>
            </div>

            <div class="demo-media__preview" aria-hidden="true">
              <span class="demo-media__shot demo-media__shot--large">gallery</span>
              <span class="demo-media__shot">plan</span>
              <span class="demo-media__shot">map</span>
              <span class="demo-media__shot">note</span>
            </div>

            <div class="demo-media__meta" aria-hidden="true">
              <span>{{ workbenchCount }} items</span>
              <span>{{ activeWorkbench?.shortLabel }}</span>
              <span>single tablist</span>
            </div>
          </div>
        </FolderAttachment>

        <div class="demo-workbench__notes" aria-hidden="true">
          <span>hover moves the handle</span>
          <span>click pulls the folder</span>
          <span>selected folder stays frontmost</span>
          <span>inactive side icons stay reachable</span>
        </div>
      </div>
    </section>

    <section class="demo-rail-section" aria-label="Standalone FolderTabs rail demo">
      <div class="demo-section-copy demo-section-copy--rail">
        <p class="demo-kicker">standalone rail</p>
        <h2>Use the tablist without the binder</h2>
        <p>
          The lower-level rail keeps the same measured labels, keyboard model,
          and active state without rendering folder panels.
        </p>
      </div>

      <div class="demo-rail-stage">
        <FolderTabs
          v-model="railActive"
          :tabs="caseTabs"
          :pulled-key="railActive"
          ariaLabel="Standalone folder rail"
          orientation="horizontal"
          edge="top"
          appearance="stack"
          expand-on="hover"
          :texture="surfaceTexture"
          :texture-layers="textureLayerMode"
          :texture-blend-mode="textureBlendMode"
          :text-color="textColor"
        />
        <div class="demo-rail-readout" aria-live="polite">
          <span>{{ activeRail?.shortLabel }}</span>
          <strong>{{ activeRail?.count }} notes</strong>
        </div>
      </div>
    </section>
  </main>
</template>
