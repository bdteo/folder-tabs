import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue';
import {
  getFolderTabAccessibleLabel,
  getFolderTabCountLabel,
  getFolderTabDisplayLabel,
  getFolderTabNavigationTarget,
  normalizeFolderTabEdge,
  normalizeFolderTabs,
  type FolderTabEdge,
  type FolderTabItem,
  type FolderTabKey,
  type FolderTabOrientation,
} from './folderTabs';

interface FolderTabListProps {
  tabs: FolderTabItem[];
  modelValue?: FolderTabKey | null;
  orientation?: FolderTabOrientation;
  edge?: FolderTabEdge | null;
  panelIdForTab?: ((tab: FolderTabItem) => string | undefined) | null;
}

export function useFolderTabList(props: FolderTabListProps) {
  const tabRefs = new Map<string, HTMLButtonElement>();
  const focusedKey = ref<string | null>(null);

  const visibleTabs = computed(() => normalizeFolderTabs(props.tabs));
  const activeKey = computed(() => props.modelValue === null || props.modelValue === undefined
    ? null
    : String(props.modelValue));
  const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, props.orientation));
  const focusableTabs = computed(() => visibleTabs.value.filter((tab) => !tab.disabled));

  const fallbackFocusableKey = computed(() => {
    const activeFocusable = focusableTabs.value.find((tab) => String(tab.key) === activeKey.value);
    return String(activeFocusable?.key ?? focusableTabs.value[0]?.key ?? '');
  });

  const tabbableKey = computed(() => focusedKey.value || fallbackFocusableKey.value);

  watch(activeKey, (key) => {
    if (key) {
      focusedKey.value = key;
    }
  }, { immediate: true });

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

  function getKeyboardTarget(event: KeyboardEvent, tab: FolderTabItem): FolderTabKey | null {
    return getFolderTabNavigationTarget(focusableTabs.value, tab.key, event.key);
  }

  function isActive(tab: FolderTabItem): boolean {
    return String(tab.key) === activeKey.value;
  }

  function isTabbable(tab: FolderTabItem): boolean {
    return !tab.disabled && String(tab.key) === tabbableKey.value;
  }

  function panelId(tab: FolderTabItem): string | undefined {
    return props.panelIdForTab?.(tab) || tab.panelId;
  }

  function tabAriaLabel(tab: FolderTabItem): string {
    const label = getFolderTabAccessibleLabel(tab);
    const count = getFolderTabCountLabel(tab);

    return count ? `${label}, ${count}` : label;
  }

  return {
    activeKey,
    focusedKey,
    focusableTabs,
    normalizedEdge,
    tabbableKey,
    visibleTabs,
    focusTab,
    getKeyboardTarget,
    isActive,
    isTabbable,
    panelId,
    setTabRef,
    tabAriaLabel,
    getFolderTabCountLabel,
    getFolderTabDisplayLabel,
  };
}
