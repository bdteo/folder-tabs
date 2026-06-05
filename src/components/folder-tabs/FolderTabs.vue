<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue';
import {
  getFolderTabAccessibleLabel,
  getFolderTabCountLabel,
  getFolderTabDisplayLabel,
  getFolderTabNavigationTarget,
  hasFolderTabCount,
  hasLimitedFolderTabTotal,
  normalizeFolderTabEdge,
  normalizeFolderTabs,
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

const tabRefs = new Map<string, HTMLButtonElement>();
const focusedKey = ref<string | null>(null);
const grabbingKey = ref<string | null>(null);
const recedingKey = ref<string | null>(null);
let activationMotionTimer: ReturnType<typeof window.setTimeout> | null = null;

const visibleTabs = computed(() => normalizeFolderTabs(props.tabs));
const activeKey = computed(() => props.modelValue === null || props.modelValue === undefined ? null : String(props.modelValue));
const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, props.orientation));

const focusableTabs = computed(() => visibleTabs.value.filter((tab) => !tab.disabled));

const fallbackFocusableKey = computed(() => {
  const activeFocusable = focusableTabs.value.find((tab) => String(tab.key) === activeKey.value);
  return String(activeFocusable?.key ?? focusableTabs.value[0]?.key ?? '');
});

const tabbableKey = computed(() => focusedKey.value || fallbackFocusableKey.value);

const rootClasses = computed(() => [
  'folder-tabs',
  `folder-tabs--${props.orientation}`,
  `folder-tabs--edge-${normalizedEdge.value}`,
  `folder-tabs--density-${props.density}`,
  `folder-tabs--activation-${props.activation}`,
  `folder-tabs--expand-${props.expandOn}`,
  `folder-tabs--gravity-${props.gravity}`,
  `folder-tabs--appearance-${props.appearance}`,
]);

watch(activeKey, (key) => {
  if (key) {
    focusedKey.value = key;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  if (activationMotionTimer !== null) {
    window.clearTimeout(activationMotionTimer);
  }
});

function setTabRef(key: FolderTabKey, element: Element | ComponentPublicInstance | null): void {
  const normalizedKey = String(key);

  if (element instanceof HTMLButtonElement) {
    tabRefs.set(normalizedKey, element);
    return;
  }

  tabRefs.delete(normalizedKey);
}

function focusTab(key: FolderTabKey | null): void {
  if (key === null) {
    return;
  }

  focusedKey.value = String(key);

  nextTick(() => {
    tabRefs.get(String(key))?.focus();
  });
}

function activateTab(tab: FolderTabItem): void {
  if (tab.disabled) {
    return;
  }

  startActivationMotion(tab.key);
  focusedKey.value = String(tab.key);
  emit('update:modelValue', tab.key);
  emit('activate', tab.key, tab);
}

function startActivationMotion(key: FolderTabKey): void {
  const nextKey = String(key);

  if (activationMotionTimer !== null) {
    window.clearTimeout(activationMotionTimer);
  }

  grabbingKey.value = nextKey;
  recedingKey.value = activeKey.value && activeKey.value !== nextKey ? activeKey.value : null;
  activationMotionTimer = window.setTimeout(() => {
    grabbingKey.value = null;
    recedingKey.value = null;
    activationMotionTimer = null;
  }, props.activationMotionDuration);
}

function handleKeydown(event: KeyboardEvent, tab: FolderTabItem): void {
  const nextKey = getFolderTabNavigationTarget(focusableTabs.value, tab.key, event.key);

  if (nextKey === null) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  focusTab(nextKey);

  if (props.activation === 'automatic') {
    const nextTab = visibleTabs.value.find((candidate) => String(candidate.key) === String(nextKey));

    if (nextTab) {
      activateTab(nextTab);
    }
  }
}

function isActive(tab: FolderTabItem): boolean {
  return String(tab.key) === activeKey.value;
}

function isTabbable(tab: FolderTabItem): boolean {
  return !tab.disabled && String(tab.key) === tabbableKey.value;
}

function isGrabbing(tab: FolderTabItem): boolean {
  return String(tab.key) === grabbingKey.value;
}

function isPulled(tab: FolderTabItem): boolean {
  return props.pulledKey !== null
    && props.pulledKey !== undefined
    && String(tab.key) === String(props.pulledKey);
}

function isReceding(tab: FolderTabItem): boolean {
  return String(tab.key) === recedingKey.value;
}

function tabStyle(tab: FolderTabItem, index: number): Record<string, string | number> {
  const labelLength = Array.from(getFolderTabDisplayLabel(tab)).length;
  const countLength = Array.from(getFolderTabCountLabel(tab)).length;
  const activeIndex = visibleTabs.value.findIndex((candidate) => String(candidate.key) === activeKey.value);
  const stackDistance = activeIndex === -1 ? index : Math.abs(index - activeIndex);
  const stackOffset = Math.min(stackDistance, 8) * 0.2;
  const stackHoverOffset = Math.max(stackOffset - 0.1, 0);

  return {
    '--folder-tab-index': index,
    '--folder-tab-total': visibleTabs.value.length,
    '--folder-tab-label-size': `${Math.max(labelLength + 2, 7)}ch`,
    '--folder-tab-count-size': countLength > 0 ? `${countLength + 1}ch` : '0ch',
    '--folder-tab-lock-size': hasLimitedFolderTabTotal(tab) ? '1rem' : '0rem',
    '--folder-tab-stack-left-offset': `-${stackOffset.toFixed(2)}rem`,
    '--folder-tab-stack-left-hover-offset': `-${stackHoverOffset.toFixed(2)}rem`,
    '--folder-tab-stack-right-offset': `${stackOffset.toFixed(2)}rem`,
    '--folder-tab-stack-right-hover-offset': `${stackHoverOffset.toFixed(2)}rem`,
  };
}

function panelId(tab: FolderTabItem): string | undefined {
  return props.panelIdForTab?.(tab) || tab.panelId;
}

function tabAriaLabel(tab: FolderTabItem): string {
  const label = getFolderTabAccessibleLabel(tab);
  const count = getFolderTabCountLabel(tab);

  return count ? `${label}, ${count}` : label;
}
</script>

<template>
  <div
    :class="rootClasses"
    role="tablist"
    :aria-orientation="orientation"
    :aria-label="ariaLabel"
  >
    <button
      v-for="(tab, tabIndex) in visibleTabs"
      :key="tab.key"
      :ref="(element) => setTabRef(tab.key, element)"
      type="button"
      class="folder-tabs__tab"
      :class="{
        'is-active': isActive(tab),
        'is-disabled': tab.disabled,
        'is-grabbing': isGrabbing(tab),
        'is-pulled': isPulled(tab),
        'is-receding': isReceding(tab),
      }"
      :style="tabStyle(tab, tabIndex)"
      role="tab"
      :aria-selected="isActive(tab)"
      :aria-controls="panelId(tab)"
      :aria-label="tabAriaLabel(tab)"
      :aria-disabled="tab.disabled || undefined"
      :tabindex="isTabbable(tab) ? 0 : -1"
      @click="activateTab(tab)"
      @keydown="handleKeydown($event, tab)"
    >
      <span class="folder-tabs__icon" aria-hidden="true">
        <slot name="icon" :tab="tab" :active="isActive(tab)">
          <component :is="tab.icon" v-if="tab.icon" />
        </slot>
      </span>
      <span class="folder-tabs__label">{{ getFolderTabDisplayLabel(tab) }}</span>
      <span v-if="hasFolderTabCount(tab)" class="folder-tabs__count">
        {{ getFolderTabCountLabel(tab) }}
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
