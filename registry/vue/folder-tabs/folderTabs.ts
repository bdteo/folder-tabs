import type { Component } from 'vue';

export type FolderTabKey = string | number;
export type FolderTabOrientation = 'horizontal' | 'vertical';
export type FolderTabEdge = 'top' | 'right' | 'bottom' | 'left';
export type FolderTabDensity = 'spread' | 'overlap' | 'dense';
export type FolderTabActivation = 'automatic' | 'manual';
export type FolderTabExpandOn = 'active' | 'hover' | 'focus' | 'always';
export type FolderTabGravity = 'start' | 'center' | 'end';
export type FolderTabAppearance = 'rail' | 'stack';
export type FolderBinderDepth = 'flat' | 'subtle' | 'raised' | 'deep';
export type FolderTabPanelStackDepth = FolderBinderDepth;
export type FolderTone = 'slate' | 'moss' | 'teal' | 'copper' | 'violet';

export interface FolderTabItem {
  key: FolderTabKey;
  label: string;
  shortLabel?: string;
  srLabel?: string;
  tone?: FolderTone;
  icon?: Component | null;
  count?: string | number | null;
  countLabel?: string | number | null;
  totalCount?: string | number | null;
  disabled?: boolean;
  panelId?: string;
}

const folderTabEdges = new Set<FolderTabEdge>(['top', 'right', 'bottom', 'left']);

export function normalizeFolderTabs(tabs: unknown): FolderTabItem[] {
  if (!Array.isArray(tabs)) {
    return [];
  }

  return tabs.filter((tab): tab is FolderTabItem => {
    if (!tab || typeof tab !== 'object') {
      return false;
    }

    const candidate = tab as Partial<FolderTabItem>;
    return candidate.key !== undefined && candidate.key !== null && typeof candidate.label === 'string';
  });
}

export function getFolderTabDisplayLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  return String(tab?.shortLabel || tab?.label || '');
}

export function getFolderTabAccessibleLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  return String(tab?.srLabel || tab?.label || getFolderTabDisplayLabel(tab));
}

export function getFolderTabCountLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  if (tab?.countLabel !== undefined && tab?.countLabel !== null) {
    return String(tab.countLabel);
  }

  if (tab?.count === undefined || tab?.count === null) {
    return '';
  }

  if (Number(tab.totalCount) > Number(tab.count)) {
    return `${tab.count}/${tab.totalCount}`;
  }

  return String(tab.count);
}

export function hasFolderTabCount(tab: Partial<FolderTabItem> | null | undefined): boolean {
  return tab?.count !== undefined && tab?.count !== null;
}

export function hasLimitedFolderTabTotal(tab: Partial<FolderTabItem> | null | undefined): boolean {
  return Number(tab?.totalCount) > Number(tab?.count);
}

export function getAdjacentFolderTabKey(
  tabs: readonly FolderTabItem[],
  currentKey: FolderTabKey | null | undefined,
  direction: number,
): FolderTabKey | null {
  const normalizedTabs = normalizeFolderTabs(tabs).filter((tab) => !tab.disabled);

  if (normalizedTabs.length === 0) {
    return null;
  }

  const currentIndex = normalizedTabs.findIndex((tab) => String(tab.key) === String(currentKey));
  const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = direction > 0
    ? Math.min(fallbackIndex + 1, normalizedTabs.length - 1)
    : Math.max(fallbackIndex - 1, 0);

  return normalizedTabs[nextIndex]?.key ?? null;
}

export function getFirstFolderTabKey(tabs: readonly FolderTabItem[]): FolderTabKey | null {
  return normalizeFolderTabs(tabs).find((tab) => !tab.disabled)?.key ?? null;
}

export function getLastFolderTabKey(tabs: readonly FolderTabItem[]): FolderTabKey | null {
  return normalizeFolderTabs(tabs).filter((tab) => !tab.disabled).at(-1)?.key ?? null;
}

export function normalizeFolderTabEdge(
  edge: FolderTabEdge | null | undefined,
  orientation: FolderTabOrientation = 'horizontal',
): FolderTabEdge {
  if (edge && folderTabEdges.has(edge)) {
    return edge;
  }

  return orientation === 'horizontal' ? 'top' : 'left';
}

export function getFolderTabNavigationTarget(
  tabs: readonly FolderTabItem[],
  currentKey: FolderTabKey | null | undefined,
  key: string,
): FolderTabKey | null {
  const keyActions: Record<string, () => FolderTabKey | null> = {
    ArrowDown: () => getAdjacentFolderTabKey(tabs, currentKey, 1),
    ArrowRight: () => getAdjacentFolderTabKey(tabs, currentKey, 1),
    ArrowUp: () => getAdjacentFolderTabKey(tabs, currentKey, -1),
    ArrowLeft: () => getAdjacentFolderTabKey(tabs, currentKey, -1),
    Home: () => getFirstFolderTabKey(tabs),
    End: () => getLastFolderTabKey(tabs),
  };

  return keyActions[key]?.() ?? null;
}
