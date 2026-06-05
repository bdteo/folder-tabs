<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, type ComponentPublicInstance } from 'vue';
import Folder from './Folder.vue';
import FolderBinder from './FolderBinder.vue';
import {
  folderFallbackTabMeasurement,
  getCompactSize,
  getFolderHoverOffset,
  getFolderPieceTuckOffset,
  getFolderPullOffset,
  getFolderStackSlots,
  type FolderTabMeasurement,
} from './folderGeometry';
import {
  hasFolderTabCount,
  hasLimitedFolderTabTotal,
  type FolderBinderDepth,
  type FolderTabActivation,
  type FolderTabAppearance,
  type FolderTabDensity,
  type FolderTabEdge,
  type FolderTabExpandOn,
  type FolderTabGravity,
  type FolderTabItem,
  type FolderTabKey,
  type FolderTabOrientation,
  type FolderTone,
} from './folderTabs';
import { useFolderPullMachine } from './useFolderPullMachine';
import { useFolderTabList } from './useFolderTabList';

const props = withDefaults(defineProps<{
  tabs: FolderTabItem[];
  modelValue?: FolderTabKey | null;
  orientation?: FolderTabOrientation;
  edge?: FolderTabEdge | null;
  density?: FolderTabDensity;
  activation?: FolderTabActivation;
  expandOn?: FolderTabExpandOn;
  gravity?: FolderTabGravity;
  appearance?: FolderTabAppearance;
  ariaLabel: string;
  depth?: FolderBinderDepth;
  layers?: number;
  tone?: FolderTone;
  pullDuration?: number;
  returnDuration?: number;
  emulatedHoverKey?: FolderTabKey | null;
  folderClass?: string;
  panelIdForTab?: ((tab: FolderTabItem) => string | undefined) | null;
}>(), {
  modelValue: null,
  orientation: 'horizontal',
  edge: null,
  density: 'spread',
  activation: 'automatic',
  expandOn: 'hover',
  gravity: 'center',
  appearance: 'rail',
  depth: 'raised',
  layers: 2,
  tone: 'slate',
  pullDuration: 420,
  returnDuration: 220,
  emulatedHoverKey: null,
  folderClass: '',
  panelIdForTab: null,
});

const emit = defineEmits<{
  'update:modelValue': [key: FolderTabKey];
  activate: [key: FolderTabKey, tab: FolderTabItem];
}>();

type MeasurementSlot = 'compact' | 'open';
type MeasurementRefs = Partial<Record<MeasurementSlot, HTMLButtonElement>>;

const tabList = useFolderTabList(props);
const measurementRefs = new Map<string, MeasurementRefs>();
const measurements = ref<Record<string, FolderTabMeasurement>>({});
const hoveredKey = ref<string | null>(null);
const tabOpenBreathingRoom = 24;
let measureFrame: number | null = null;

const activeIndex = computed(() => {
  const index = tabList.visibleTabs.value.findIndex((tab) => String(tab.key) === tabList.activeKey.value);
  return Math.max(index, 0);
});

const activeTab = computed(() => tabList.visibleTabs.value[activeIndex.value] ?? null);

const emulatedHoverKey = computed(() => (
  props.emulatedHoverKey === null || props.emulatedHoverKey === undefined
    ? null
    : String(props.emulatedHoverKey)
));

const effectiveHoverKey = computed(() => hoveredKey.value ?? emulatedHoverKey.value);

const motion = useFolderPullMachine({
  activeKey: tabList.activeKey,
  pullDuration: () => props.pullDuration,
  returnDuration: () => props.returnDuration,
  select: (key, tab) => {
    emit('update:modelValue', key);
    emit('activate', key, tab);
  },
});

const rootClasses = computed(() => [
  'folder-attachment',
  `folder-attachment--${props.orientation}`,
  `folder-attachment--edge-${tabList.normalizedEdge.value}`,
  `folder-attachment--density-${props.density}`,
  `folder-attachment--appearance-${props.appearance}`,
  `folder-attachment--expand-${props.expandOn}`,
  `folder-attachment--activation-${props.activation}`,
  `folder-attachment--gravity-${props.gravity}`,
  {
    'folder-attachment--hover-emulated': emulatedHoverKey.value !== null,
    'is-pulled': motion.isPulled.value,
  },
]);

const rootStyle = computed(() => ({
  '--folder-motion-duration': `${Math.max(Math.round(props.pullDuration), 0)}ms`,
  '--folder-motion-return-duration': `${Math.max(Math.round(props.returnDuration), 0)}ms`,
  '--folder-motion-ease': 'cubic-bezier(0.32, 0, 0.2, 1)',
}));

const tabMeasurements = computed(() => tabList.visibleTabs.value.map((tab) => (
  measurements.value[String(tab.key)] ?? folderFallbackTabMeasurement
)));

const expandedSlotIndexes = computed(() => tabList.visibleTabs.value.flatMap((tab, index) => (
  props.expandOn === 'always' || isTabOpen(tab) || isHovered(tab)
    ? [index]
    : []
)));

const slotPositions = computed(() => getFolderStackSlots({
  activeIndex: activeIndex.value,
  appearance: props.appearance,
  density: props.density,
  expandedIndexes: expandedSlotIndexes.value,
  measurements: tabMeasurements.value,
  orientation: props.orientation,
}));

onMounted(() => {
  scheduleMeasure();
  window.addEventListener('resize', scheduleMeasure);
});

onUpdated(() => {
  scheduleMeasure();
});

onBeforeUnmount(() => {
  if (measureFrame !== null) {
    window.cancelAnimationFrame(measureFrame);
  }

  window.removeEventListener('resize', scheduleMeasure);
});

function setMeasurementRef(
  key: FolderTabKey,
  slot: MeasurementSlot,
  element: Element | ComponentPublicInstance | null,
): void {
  const normalizedKey = String(key);
  const existing = measurementRefs.get(normalizedKey) ?? {};

  if (element instanceof HTMLButtonElement) {
    existing[slot] = element;
    measurementRefs.set(normalizedKey, existing);
    return;
  }

  delete existing[slot];

  if (existing.compact || existing.open) {
    measurementRefs.set(normalizedKey, existing);
    return;
  }

  measurementRefs.delete(normalizedKey);
}

function scheduleMeasure(): void {
  if (measureFrame !== null) {
    return;
  }

  measureFrame = window.requestAnimationFrame(() => {
    measureFrame = null;
    measureTabs();
  });
}

function measureTabs(): void {
  const nextMeasurements: Record<string, FolderTabMeasurement> = {};

  for (const tab of tabList.visibleTabs.value) {
    const key = String(tab.key);
    const refs = measurementRefs.get(key);
    const compactRect = readElementSize(refs?.compact);
    const openRect = readElementSize(refs?.open);

    nextMeasurements[key] = {
      compactBlockSize: compactRect.blockSize,
      compactInlineSize: compactRect.inlineSize,
      openInlineSize: Math.max(openRect.inlineSize + tabOpenBreathingRoom, compactRect.inlineSize),
    };
  }

  if (JSON.stringify(measurements.value) !== JSON.stringify(nextMeasurements)) {
    measurements.value = nextMeasurements;
  }
}

function readElementSize(element: HTMLButtonElement | undefined): { blockSize: number; inlineSize: number } {
  if (!element) {
    return {
      blockSize: folderFallbackTabMeasurement.compactBlockSize,
      inlineSize: folderFallbackTabMeasurement.compactInlineSize,
    };
  }

  const rect = element.getBoundingClientRect();

  return {
    blockSize: rect.height || element.scrollHeight || folderFallbackTabMeasurement.compactBlockSize,
    inlineSize: rect.width || element.scrollWidth || folderFallbackTabMeasurement.compactInlineSize,
  };
}

function handleKeydown(event: KeyboardEvent, tab: FolderTabItem): void {
  const nextKey = tabList.getKeyboardTarget(event, tab);

  if (nextKey !== null) {
    event.preventDefault();
    event.stopPropagation();
    tabList.focusTab(nextKey);

    if (props.activation === 'automatic') {
      const nextTab = tabList.visibleTabs.value.find((candidate) => String(candidate.key) === String(nextKey));

      if (nextTab) {
        motion.selectFolder(nextTab);
      }
    }

    return;
  }

  if (props.activation === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    event.stopPropagation();
    motion.selectFolder(tab);
  }
}

function isTabOpen(tab: FolderTabItem): boolean {
  return motion.isPulledKey(tab.key) || motion.isPullingKey(tab.key);
}

function isReturning(tab: FolderTabItem): boolean {
  return motion.isReturningKey(tab.key);
}

function isHovered(tab: FolderTabItem): boolean {
  return !tabList.isActive(tab) && effectiveHoverKey.value === String(tab.key) && !tab.disabled;
}

function isEmulatedHovered(tab: FolderTabItem): boolean {
  return hoveredKey.value === null && isHovered(tab);
}

function folderTone(tab: FolderTabItem): FolderTone {
  return tab.tone ?? props.tone;
}

function folderClasses(tab: FolderTabItem): Array<string | Record<string, boolean>> {
  return [
    'folder-attachment__folder',
    {
      'is-active': tabList.isActive(tab),
      'is-disabled': Boolean(tab.disabled),
      'is-open': isTabOpen(tab),
      'is-pulled': motion.isPulledKey(tab.key),
      'is-pulling': motion.isPullingKey(tab.key),
      'is-returning': isReturning(tab),
      'is-selecting': motion.isSelectingKey(tab.key),
      'is-hovered': isHovered(tab),
      'folder-attachment__folder--hover-emulated': isEmulatedHovered(tab),
    },
  ];
}

function folderStyle(tab: FolderTabItem, index: number): Record<string, string | number> {
  const restOffset = getFolderPieceTuckOffset(tabList.normalizedEdge.value, index, activeIndex.value, props.density);
  const hoverOffset = getFolderHoverOffset(tabList.normalizedEdge.value);
  const pullOffset = getFolderPullOffset(tabList.normalizedEdge.value);
  const zIndex = getPieceZIndex(tab, index);

  return {
    '--folder-piece-index': index,
    '--folder-piece-slot': `${(slotPositions.value[index] ?? 0).toFixed(2)}px`,
    '--folder-piece-rest-x': `${restOffset.x.toFixed(2)}px`,
    '--folder-piece-rest-y': `${restOffset.y.toFixed(2)}px`,
    '--folder-piece-hover-x': `${hoverOffset.x.toFixed(2)}px`,
    '--folder-piece-hover-y': `${hoverOffset.y.toFixed(2)}px`,
    '--folder-piece-pull-x': `${pullOffset.x.toFixed(2)}px`,
    '--folder-piece-pull-y': `${pullOffset.y.toFixed(2)}px`,
    '--folder-piece-z': zIndex,
  };
}

function tabStyle(tab: FolderTabItem): Record<string, string | number> {
  const measurement = measurements.value[String(tab.key)] ?? folderFallbackTabMeasurement;
  const compactSize = getCompactSize(measurement, props.orientation);
  const openSize = Math.max(measurement.openInlineSize, compactSize);

  return {
    '--folder-attached-tab-compact-size': `${compactSize.toFixed(2)}px`,
    '--folder-attached-tab-open-size': `${openSize.toFixed(2)}px`,
  };
}

function getPieceZIndex(tab: FolderTabItem, index: number): number {
  if (motion.isSelectingKey(tab.key)) {
    return 280;
  }

  if (motion.isPullingKey(tab.key)) {
    return 270;
  }

  if (motion.isPulledKey(tab.key)) {
    return 260;
  }

  if (isReturning(tab)) {
    return 240;
  }

  if (tabList.isActive(tab)) {
    return 250;
  }

  if (isHovered(tab)) {
    return 180;
  }

  return 40 + index;
}

function selectFolder(tab: FolderTabItem): void {
  tabList.focusedKey.value = String(tab.key);
  motion.selectFolder(tab);
}

function setHoveredTab(tab: FolderTabItem): void {
  if (!tab.disabled) {
    hoveredKey.value = String(tab.key);
  }
}

function clearHoveredTab(tab: FolderTabItem): void {
  if (hoveredKey.value === String(tab.key)) {
    hoveredKey.value = null;
  }
}

nextTick(() => {
  scheduleMeasure();
});
</script>

<template>
  <section :class="rootClasses" :style="rootStyle">
    <FolderBinder
      class="folder-attachment__binder"
      :style="rootStyle"
      :orientation="props.orientation"
      :edge="tabList.normalizedEdge.value"
      :depth="props.depth"
      :layers="props.layers"
      :active-index="activeIndex"
      :tone="props.tone"
      :pulled="motion.isPulled.value"
    >
      <div
        class="folder-attachment__stack"
        role="tablist"
        :aria-orientation="props.orientation"
        :aria-label="props.ariaLabel"
      >
        <Folder
          v-for="(tab, tabIndex) in tabList.visibleTabs.value"
          :key="tab.key"
          :class="folderClasses(tab)"
          :style="folderStyle(tab, tabIndex)"
          :tone="folderTone(tab)"
        >
          <button
            :ref="(element) => tabList.setTabRef(tab.key, element)"
            type="button"
            class="folder-attachment__tab"
            :class="{
              'is-active': tabList.isActive(tab),
              'is-disabled': tab.disabled,
              'is-open': isTabOpen(tab),
              'is-pulled': motion.isPulledKey(tab.key),
              'is-pulling': motion.isPullingKey(tab.key),
              'is-returning': isReturning(tab),
              'is-selecting': motion.isSelectingKey(tab.key),
              'is-hovered': isHovered(tab),
              'folder-attachment__tab--hover-emulated': isEmulatedHovered(tab),
            }"
            :style="tabStyle(tab)"
            role="tab"
            :aria-selected="tabList.isActive(tab)"
            :aria-controls="tabList.panelId(tab)"
            :aria-label="tabList.tabAriaLabel(tab)"
            :aria-disabled="tab.disabled || undefined"
            :tabindex="tabList.isTabbable(tab) ? 0 : -1"
            @click="selectFolder(tab)"
            @blur="clearHoveredTab(tab)"
            @focus="setHoveredTab(tab)"
            @keydown="handleKeydown($event, tab)"
            @pointerenter="setHoveredTab(tab)"
            @pointerleave="clearHoveredTab(tab)"
          >
            <span class="folder-attachment__tab-icon" aria-hidden="true">
              <slot name="icon" :tab="tab" :active="tabList.isActive(tab)">
                <component :is="tab.icon" v-if="tab.icon" />
              </slot>
            </span>
            <span class="folder-attachment__tab-label">{{ tabList.getFolderTabDisplayLabel(tab) }}</span>
            <span v-if="hasFolderTabCount(tab)" class="folder-attachment__tab-count">
              {{ tabList.getFolderTabCountLabel(tab) }}
            </span>
            <span v-if="hasLimitedFolderTabTotal(tab)" class="folder-attachment__tab-lock" aria-hidden="true">
              /{{ tab.totalCount }}
            </span>
          </button>

          <div
            v-if="tabList.isActive(tab)"
            :id="tabList.panelId(tab)"
            :class="['folder-attachment__content', props.folderClass]"
            role="tabpanel"
          >
            <slot :active-tab="activeTab" :active-index="activeIndex" :pulled="motion.isPulled.value" />
          </div>
        </Folder>
      </div>
    </FolderBinder>

    <div class="folder-attachment__measurer" aria-hidden="true">
      <template v-for="tab in tabList.visibleTabs.value" :key="tab.key">
        <button
          :ref="(element) => setMeasurementRef(tab.key, 'compact', element)"
          type="button"
          class="folder-attachment__measure-tab folder-attachment__measure-tab--compact"
          tabindex="-1"
        >
          <span class="folder-attachment__tab-icon" aria-hidden="true">
            <component :is="tab.icon" v-if="tab.icon" />
          </span>
        </button>

        <button
          :ref="(element) => setMeasurementRef(tab.key, 'open', element)"
          type="button"
          class="folder-attachment__measure-tab folder-attachment__measure-tab--open"
          tabindex="-1"
        >
          <span class="folder-attachment__tab-icon" aria-hidden="true">
            <component :is="tab.icon" v-if="tab.icon" />
          </span>
          <span class="folder-attachment__tab-label">{{ tabList.getFolderTabDisplayLabel(tab) }}</span>
          <span v-if="hasFolderTabCount(tab)" class="folder-attachment__tab-count">
            {{ tabList.getFolderTabCountLabel(tab) }}
          </span>
          <span v-if="hasLimitedFolderTabTotal(tab)" class="folder-attachment__tab-lock" aria-hidden="true">
            /{{ tab.totalCount }}
          </span>
        </button>
      </template>
    </div>
  </section>
</template>
