import { computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue';
import {
  getFolderTabAccessibleLabel,
  getFolderTabCountLabel,
  getFolderTabDisplayLabel,
  getFolderTabDomId,
  getFolderTabNavigationTarget,
  getFolderTabTotalCountLabel,
  isFolderTabDisabled,
  normalizeFolderTabKeyForLookup,
  normalizeFolderTabEdge,
  normalizeFolderTabKeyboardOrientation,
  normalizeFolderTabOrientation,
  normalizeFolderTabs,
  type FolderTabEdge,
  type FolderTabItem,
  type FolderTabKeyboardOrientation,
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

interface FolderTabListOptions {
  generatePanelIds?: boolean;
  idBase?: string | null;
  keyboardOrientation?: (() => FolderTabKeyboardOrientation) | null;
}

export function useFolderTabList(props: FolderTabListProps, options: FolderTabListOptions = {}) {
  const tabRefs = new Map<string, HTMLButtonElement>();
  const focusedKey = ref<string | null>(null);
  let isUnmounted = false;

  const visibleTabs = computed(() => normalizeFolderTabs(props.tabs));
  const requestedActiveKey = computed(() => normalizeFolderTabKeyForLookup(props.modelValue));
  const normalizedOrientation = computed(() => normalizeFolderTabOrientation(props.orientation));
  const normalizedEdge = computed(() => normalizeFolderTabEdge(props.edge, normalizedOrientation.value));
  const focusableTabs = computed(() => visibleTabs.value.filter((tab) => !isFolderTabDisabled(tab)));

  const fallbackFocusableKey = computed(() => {
    const firstFocusableTab = focusableTabs.value[0];
    return firstFocusableTab ? String(firstFocusableTab.key) : null;
  });
  const focusableKeySignature = computed(() => focusableTabs.value.map((tab) => String(tab.key)).join('\u0000'));
  const activeKey = computed(() => normalizeFocusableKey(requestedActiveKey.value) ?? fallbackFocusableKey.value);
  const tabbableKey = computed(() => normalizeFocusableKey(focusedKey.value) ?? activeKey.value ?? fallbackFocusableKey.value);
  const panelIdsByKey = computed<Record<string, string | undefined>>(() => {
    const panelIds: Record<string, string | undefined> = {};
    const reservedPanelIds = new Set<string>();

    for (const tab of visibleTabs.value) {
      panelIds[String(tab.key)] = resolvePanelId(tab, reservedPanelIds);
    }

    return panelIds;
  });

  watch(activeKey, (key) => {
    if (!key) {
      focusedKey.value = null;
      return;
    }

    focusedKey.value = key;
  }, { immediate: true });

  watch(focusableKeySignature, () => {
    focusedKey.value = normalizeFocusableKey(focusedKey.value) ?? activeKey.value ?? fallbackFocusableKey.value;
  });

  onBeforeUnmount(() => {
    isUnmounted = true;
    tabRefs.clear();
  });

  function setTabRef(key: FolderTabKey, element: Element | ComponentPublicInstance | null): void {
    const normalizedKey = String(key);

    if (!isUnmounted && element instanceof HTMLButtonElement) {
      tabRefs.set(normalizedKey, element);
      return;
    }

    tabRefs.delete(normalizedKey);
  }

  function focusTab(key: FolderTabKey | null): void {
    const nextKey = normalizeFocusableKey(key);

    if (nextKey === null) {
      return;
    }

    focusedKey.value = nextKey;

    nextTick(() => {
      if (isUnmounted) {
        return;
      }

      tabRefs.get(nextKey)?.focus();
    });
  }

  function getKeyboardTarget(event: KeyboardEvent, tab: FolderTabItem): FolderTabKey | null {
    return getFolderTabNavigationTarget(
      focusableTabs.value,
      tab.key,
      event.key,
      normalizeFolderTabKeyboardOrientation(options.keyboardOrientation?.() ?? normalizedOrientation.value),
    );
  }

  function isActive(tab: FolderTabItem): boolean {
    return String(tab.key) === activeKey.value;
  }

  function isTabbable(tab: FolderTabItem): boolean {
    return !isFolderTabDisabled(tab) && String(tab.key) === tabbableKey.value;
  }

  function normalizeFocusableKey(key: unknown): string | null {
    const normalizedKey = normalizeFolderTabKeyForLookup(key);

    if (normalizedKey === null) {
      return null;
    }

    return focusableTabs.value.some((tab) => String(tab.key) === normalizedKey)
      ? normalizedKey
      : null;
  }

  function panelId(tab: FolderTabItem): string | undefined {
    return panelIdsByKey.value[String(tab.key)];
  }

  function resolvePanelId(tab: FolderTabItem, reservedPanelIds: Set<string>): string | undefined {
    const panelIdCandidates = [
      normalizePanelId(resolveExternalPanelId(tab)),
      normalizePanelId(tab.panelId),
    ];

    for (const candidate of panelIdCandidates) {
      const reservedPanelId = reservePanelId(candidate, reservedPanelIds);

      if (reservedPanelId) {
        return reservedPanelId;
      }
    }

    return reserveGeneratedPanelId(getGeneratedPanelId(tab), reservedPanelIds);
  }

  function resolveExternalPanelId(tab: FolderTabItem): unknown {
    return typeof props.panelIdForTab === 'function'
      ? props.panelIdForTab(tab)
      : undefined;
  }

  function tabId(tab: FolderTabItem): string | undefined {
    return options.idBase ? getFolderTabDomId(options.idBase, tab, 'tab') : undefined;
  }

  function getGeneratedPanelId(tab: FolderTabItem): string | undefined {
    return options.idBase && options.generatePanelIds !== false
      ? getFolderTabDomId(options.idBase, tab, 'panel')
      : undefined;
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
    normalizedOrientation,
    tabbableKey,
    visibleTabs,
    focusTab,
    getKeyboardTarget,
    isActive,
    isTabbable,
    panelId,
    setTabRef,
    tabId,
    tabAriaLabel,
    getFolderTabCountLabel,
    getFolderTabDisplayLabel,
    getFolderTabTotalCountLabel,
  };
}

function normalizePanelId(panelId: unknown): string | undefined {
  if (typeof panelId !== 'string') {
    return undefined;
  }

  const normalizedPanelId = panelId.trim();

  return normalizedPanelId.length > 0 && !/\s/.test(normalizedPanelId)
    ? normalizedPanelId
    : undefined;
}

function reservePanelId(panelId: string | undefined, reservedPanelIds: Set<string>): string | undefined {
  if (!panelId || reservedPanelIds.has(panelId)) {
    return undefined;
  }

  reservedPanelIds.add(panelId);
  return panelId;
}

function reserveGeneratedPanelId(generatedPanelId: string | undefined, reservedPanelIds: Set<string>): string | undefined {
  if (!generatedPanelId) {
    return undefined;
  }

  let candidatePanelId = generatedPanelId;
  let suffix = 2;

  while (reservedPanelIds.has(candidatePanelId)) {
    candidatePanelId = `${generatedPanelId}-${suffix}`;
    suffix += 1;
  }

  reservedPanelIds.add(candidatePanelId);
  return candidatePanelId;
}
