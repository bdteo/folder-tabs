<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useId, watch, type ComponentPublicInstance } from 'vue';
import {
  getFolderTabIcon,
  hasFolderTabIcon,
  hasFolderTabCount,
  hasLimitedFolderTabTotal,
  isFolderTabDisabled,
  normalizeFolderMotionDuration,
  normalizeFolderTabActivation,
  normalizeFolderTabAppearance,
  normalizeFolderTabDensity,
  normalizeFolderTabExpandOn,
  normalizeFolderTabGravity,
  normalizeFolderTabKeyForLookup,
  type FolderTabActivation,
  type FolderTabAppearance,
  type FolderTabDensity,
  type FolderTabEdge,
  type FolderTabExpandOn,
  type FolderTabGravity,
  type FolderTabItem,
  type FolderTabKey,
  type FolderTabOrientation,
} from './folderTabs';
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
  activationMotionDuration?: number;
  pulledKey?: FolderTabKey | null;
  ariaLabel: string;
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
  activationMotionDuration: 420,
  pulledKey: null,
  panelIdForTab: null,
});

const emit = defineEmits<{
  'update:modelValue': [key: FolderTabKey];
  activate: [key: FolderTabKey, tab: FolderTabItem];
}>();

const tabsId = useId();
const tabList = useFolderTabList(props, {
  generatePanelIds: false,
  idBase: `folder-tabs-${tabsId}`,
});
const grabbingKey = ref<string | null>(null);
const recedingKey = ref<string | null>(null);
type MeasurementSlot = 'label' | 'count';
type MeasurementRefs = Partial<Record<MeasurementSlot, HTMLElement>>;
type RailTabMeasurement = {
  countInlineSize: number;
  labelInlineSize: number;
};

const fallbackLabelInlineSize = 88;
const fallbackCountInlineSize = 28;
const measurementRefs = new Map<string, MeasurementRefs>();
const measurements = ref<Record<string, RailTabMeasurement>>({});
let activationMotionTimer: ReturnType<typeof window.setTimeout> | null = null;
let measureFrame: number | null = null;
let isUnmounted = false;

const normalizedActivation = computed(() => normalizeFolderTabActivation(props.activation));
const normalizedAppearance = computed(() => normalizeFolderTabAppearance(props.appearance));
const normalizedDensity = computed(() => normalizeFolderTabDensity(props.density));
const normalizedExpandOn = computed(() => normalizeFolderTabExpandOn(props.expandOn));
const normalizedGravity = computed(() => normalizeFolderTabGravity(props.gravity));

const rootClasses = computed(() => [
  'folder-tabs',
  `folder-tabs--${tabList.normalizedOrientation.value}`,
  `folder-tabs--edge-${tabList.normalizedEdge.value}`,
  `folder-tabs--density-${normalizedDensity.value}`,
  `folder-tabs--activation-${normalizedActivation.value}`,
  `folder-tabs--expand-${normalizedExpandOn.value}`,
  `folder-tabs--gravity-${normalizedGravity.value}`,
  `folder-tabs--appearance-${normalizedAppearance.value}`,
]);

watch(
  () => tabList.visibleTabs.value.map((tab) => String(tab.key)).join('\u0000'),
  pruneTabState,
);

onBeforeUnmount(() => {
  isUnmounted = true;
  clearActivationMotionTimer();
  cancelMeasureFrame();

  window.removeEventListener('resize', scheduleMeasure);
});

onMounted(() => {
  isUnmounted = false;
  scheduleMeasure();
  window.addEventListener('resize', scheduleMeasure);
});

onUpdated(() => {
  scheduleMeasure();
});

function activateTab(tab: FolderTabItem): void {
  if (isFolderTabDisabled(tab)) {
    return;
  }

  if (normalizeFolderTabKeyForLookup(props.modelValue) === String(tab.key) && tabList.isActive(tab)) {
    tabList.focusedKey.value = String(tab.key);
    return;
  }

  startActivationMotion(tab.key);
  tabList.focusedKey.value = String(tab.key);
  emit('update:modelValue', tab.key);
  emit('activate', tab.key, tab);
}

function startActivationMotion(key: FolderTabKey): void {
  const nextKey = String(key);

  clearActivationMotionTimer();

  grabbingKey.value = nextKey;
  recedingKey.value = tabList.activeKey.value && tabList.activeKey.value !== nextKey
    ? tabList.activeKey.value
    : null;
  activationMotionTimer = window.setTimeout(() => {
    grabbingKey.value = null;
    recedingKey.value = null;
    activationMotionTimer = null;
  }, normalizeFolderMotionDuration(props.activationMotionDuration));
}

function clearActivationMotionTimer(): void {
  if (activationMotionTimer !== null) {
    window.clearTimeout(activationMotionTimer);
    activationMotionTimer = null;
  }
}

function handleKeydown(event: KeyboardEvent, tab: FolderTabItem): void {
  if (isFolderTabDisabled(tab)) {
    return;
  }

  const nextKey = tabList.getKeyboardTarget(event, tab);

  if (nextKey !== null) {
    event.preventDefault();
    event.stopPropagation();

    if (String(nextKey) === String(tab.key)) {
      return;
    }

    tabList.focusTab(nextKey);

    if (normalizedActivation.value === 'automatic') {
      const nextTab = tabList.visibleTabs.value.find((candidate) => String(candidate.key) === String(nextKey));

      if (nextTab) {
        activateTab(nextTab);
      }
    }

    return;
  }

  if (normalizedActivation.value === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    event.stopPropagation();
    activateTab(tab);
  }
}

function isActive(tab: FolderTabItem): boolean {
  return tabList.isActive(tab);
}

function isTabbable(tab: FolderTabItem): boolean {
  return tabList.isTabbable(tab);
}

function isGrabbing(tab: FolderTabItem): boolean {
  return String(tab.key) === grabbingKey.value;
}

function isPulled(tab: FolderTabItem): boolean {
  const pulledKey = normalizeFolderTabKeyForLookup(props.pulledKey);

  return !isFolderTabDisabled(tab)
    && pulledKey !== null
    && String(tab.key) === pulledKey;
}

function isReceding(tab: FolderTabItem): boolean {
  return String(tab.key) === recedingKey.value;
}

function pruneTabState(): void {
  const visibleKeys = new Set(tabList.visibleTabs.value.map((tab) => String(tab.key)));

  pruneTransientKeys(visibleKeys);
  pruneMeasurementState(visibleKeys);
}

function pruneTransientKeys(visibleKeys: Set<string>): void {
  const removedGrabbingKey = Boolean(grabbingKey.value && !visibleKeys.has(grabbingKey.value));
  const removedRecedingKey = Boolean(recedingKey.value && !visibleKeys.has(recedingKey.value));

  if (removedGrabbingKey) {
    grabbingKey.value = null;
  }

  if (removedGrabbingKey || removedRecedingKey) {
    recedingKey.value = null;
  }

  if (removedGrabbingKey && recedingKey.value === null) {
    clearActivationMotionTimer();
  }
}

function pruneMeasurementState(visibleKeys: Set<string>): void {
  for (const key of measurementRefs.keys()) {
    if (!visibleKeys.has(key)) {
      measurementRefs.delete(key);
    }
  }

  let prunedMeasurements: Record<string, RailTabMeasurement> | null = null;

  for (const key of Object.keys(measurements.value)) {
    if (!visibleKeys.has(key)) {
      prunedMeasurements ??= { ...measurements.value };
      delete prunedMeasurements[key];
    }
  }

  if (prunedMeasurements) {
    measurements.value = prunedMeasurements;
  }
}

function tabStyle(tab: FolderTabItem, index: number): Record<string, string | number> {
  const measurement = measurements.value[String(tab.key)] ?? {
    countInlineSize: hasFolderTabCount(tab) ? fallbackCountInlineSize : 0,
    labelInlineSize: fallbackLabelInlineSize,
  };
  const activeIndex = tabList.visibleTabs.value.findIndex((candidate) => String(candidate.key) === tabList.activeKey.value);
  const stackDistance = activeIndex === -1 ? index : Math.abs(index - activeIndex);
  const stackOffset = Math.min(stackDistance, 8) * 0.2;
  const stackHoverOffset = Math.max(stackOffset - 0.1, 0);

  return {
    '--folder-tab-index': index,
    '--folder-tab-total': tabList.visibleTabs.value.length,
    '--folder-tab-label-size': `${measurement.labelInlineSize.toFixed(2)}px`,
    '--folder-tab-count-size': hasFolderTabCount(tab)
      ? `${measurement.countInlineSize.toFixed(2)}px`
      : '0px',
    '--folder-tab-lock-size': hasLimitedFolderTabTotal(tab) ? '1rem' : '0rem',
    '--folder-tab-stack-left-offset': `-${stackOffset.toFixed(2)}rem`,
    '--folder-tab-stack-left-hover-offset': `-${stackHoverOffset.toFixed(2)}rem`,
    '--folder-tab-stack-right-offset': `${stackOffset.toFixed(2)}rem`,
    '--folder-tab-stack-right-hover-offset': `${stackHoverOffset.toFixed(2)}rem`,
  };
}

function setMeasurementRef(
  key: FolderTabKey,
  slot: MeasurementSlot,
  element: Element | ComponentPublicInstance | null,
): void {
  const normalizedKey = String(key);
  const existing = measurementRefs.get(normalizedKey) ?? {};

  if (element instanceof HTMLElement) {
    existing[slot] = element;
    measurementRefs.set(normalizedKey, existing);
    return;
  }

  delete existing[slot];

  if (existing.label || existing.count) {
    measurementRefs.set(normalizedKey, existing);
    return;
  }

  measurementRefs.delete(normalizedKey);
}

function scheduleMeasure(): void {
  if (isUnmounted || measureFrame !== null) {
    return;
  }

  measureFrame = window.requestAnimationFrame(() => {
    measureFrame = null;

    if (isUnmounted) {
      return;
    }

    measureTabs();
  });
}

function cancelMeasureFrame(): void {
  if (measureFrame !== null) {
    window.cancelAnimationFrame(measureFrame);
    measureFrame = null;
  }
}

function measureTabs(): void {
  const nextMeasurements: Record<string, RailTabMeasurement> = {};

  for (const tab of tabList.visibleTabs.value) {
    const key = String(tab.key);
    const refs = measurementRefs.get(key);

    nextMeasurements[key] = {
      countInlineSize: hasFolderTabCount(tab)
        ? readInlineSize(refs?.count, fallbackCountInlineSize)
        : 0,
      labelInlineSize: readInlineSize(refs?.label, fallbackLabelInlineSize),
    };
  }

  if (JSON.stringify(measurements.value) !== JSON.stringify(nextMeasurements)) {
    measurements.value = nextMeasurements;
  }
}

function readInlineSize(element: HTMLElement | undefined, fallback: number): number {
  if (!element) {
    return fallback;
  }

  const rect = element.getBoundingClientRect();

  return Math.ceil(
    readMeasuredSize(element.scrollWidth, readMeasuredSize(rect.width, fallback)),
  );
}

function readMeasuredSize(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
</script>

<template>
  <div
    :class="rootClasses"
    role="tablist"
    :aria-orientation="tabList.normalizedOrientation.value"
    :aria-label="props.ariaLabel"
  >
    <button
      v-for="(tab, tabIndex) in tabList.visibleTabs.value"
      :key="tab.key"
      :ref="(element) => tabList.setTabRef(tab.key, element)"
      type="button"
      class="folder-tabs__tab"
      :class="{
        'is-active': isActive(tab),
        'is-disabled': isFolderTabDisabled(tab),
        'is-grabbing': isGrabbing(tab),
        'is-pulled': isPulled(tab),
        'is-receding': isReceding(tab),
      }"
      :style="tabStyle(tab, tabIndex)"
      :id="tabList.tabId(tab)"
      role="tab"
      :aria-selected="isActive(tab)"
      :aria-controls="tabList.panelId(tab)"
      :aria-label="tabList.tabAriaLabel(tab)"
      :aria-disabled="isFolderTabDisabled(tab) || undefined"
      :tabindex="isTabbable(tab) ? 0 : -1"
      @click="activateTab(tab)"
      @keydown="handleKeydown($event, tab)"
    >
      <span class="folder-tabs__icon" aria-hidden="true">
        <slot name="icon" :tab="tab" :active="isActive(tab)">
          <component :is="getFolderTabIcon(tab)" v-if="hasFolderTabIcon(tab)" />
        </slot>
      </span>
      <span
        :ref="(element) => setMeasurementRef(tab.key, 'label', element)"
        class="folder-tabs__label"
      >
        {{ tabList.getFolderTabDisplayLabel(tab) }}
      </span>
      <span
        v-if="hasFolderTabCount(tab)"
        :ref="(element) => setMeasurementRef(tab.key, 'count', element)"
        class="folder-tabs__count"
      >
        {{ tabList.getFolderTabCountLabel(tab) }}
      </span>
      <svg
        v-if="hasLimitedFolderTabTotal(tab)"
        class="folder-tabs__lock"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="2"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </button>
  </div>
</template>
