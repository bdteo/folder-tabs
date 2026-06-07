import { toRaw, type Component } from 'vue';

export type FolderTabKey = string | number;
export type FolderTabOrientation = 'horizontal' | 'vertical';
export type FolderTabKeyboardOrientation = FolderTabOrientation | 'both';
export type FolderTabEdge = 'top' | 'right' | 'bottom' | 'left';
export type FolderTabDensity = 'spread' | 'overlap' | 'dense';
export type FolderTabActivation = 'automatic' | 'manual';
export type FolderTabExpandOn = 'active' | 'hover' | 'focus' | 'always';
export type FolderTabGravity = 'start' | 'center' | 'end';
export type FolderTabAppearance = 'rail' | 'stack';
export type FolderBinderDepth = 'flat' | 'subtle' | 'raised' | 'deep';
export type FolderTabPanelStackDepth = FolderBinderDepth;
export type FolderTone = 'slate' | 'moss' | 'teal' | 'copper' | 'violet';
export type FolderStackRotation = 'none' | 'folders' | 'pieces';

export interface FolderTabItem {
  key: FolderTabKey;
  label: string;
  shortLabel?: string;
  srLabel?: string;
  edge?: FolderTabEdge;
  gravity?: FolderTabGravity;
  tone?: FolderTone;
  icon?: Component | null;
  count?: string | number | null;
  countLabel?: string | number | null;
  totalCount?: string | number | null;
  disabled?: boolean;
  panelId?: string;
}

const folderTabEdges = new Set<FolderTabEdge>(['top', 'right', 'bottom', 'left']);
const folderTabOrientations = new Set<FolderTabOrientation>(['horizontal', 'vertical']);
const folderTabKeyboardOrientations = new Set<FolderTabKeyboardOrientation>(['horizontal', 'vertical', 'both']);
const folderTabDensities = new Set<FolderTabDensity>(['spread', 'overlap', 'dense']);
const folderTabActivations = new Set<FolderTabActivation>(['automatic', 'manual']);
const folderTabExpandModes = new Set<FolderTabExpandOn>(['active', 'hover', 'focus', 'always']);
const folderTabGravities = new Set<FolderTabGravity>(['start', 'center', 'end']);
const folderTabAppearances = new Set<FolderTabAppearance>(['rail', 'stack']);
const folderBinderDepths = new Set<FolderBinderDepth>(['flat', 'subtle', 'raised', 'deep']);
const folderTones = new Set<FolderTone>(['slate', 'moss', 'teal', 'copper', 'violet']);
const folderStackRotations = new Set<FolderStackRotation>(['none', 'folders', 'pieces']);

export function normalizeFolderTabs(tabs: unknown): FolderTabItem[] {
  if (!Array.isArray(tabs)) {
    return [];
  }

  const seenKeys = new Set<string>();

  return tabs.filter((tab): tab is FolderTabItem => {
    if (!tab || typeof tab !== 'object') {
      return false;
    }

    const candidate = tab as Partial<FolderTabItem>;

    if (!isFolderTabKey(candidate.key) || typeof candidate.label !== 'string') {
      return false;
    }

    const normalizedKey = String(candidate.key);

    if (seenKeys.has(normalizedKey)) {
      return false;
    }

    seenKeys.add(normalizedKey);
    return true;
  });
}

function isFolderTabKey(key: unknown): key is FolderTabKey {
  return typeof key === 'string'
    || (typeof key === 'number' && Number.isFinite(key));
}

export function normalizeFolderTabKeyForLookup(key: unknown): string | null {
  return isFolderTabKey(key) ? String(key) : null;
}

export function getFolderTabDisplayLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  return normalizeFolderTabText(tab?.shortLabel)
    ?? normalizeFolderTabText(tab?.label)
    ?? '';
}

export function getFolderTabAccessibleLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  return normalizeFolderTabText(tab?.srLabel)
    ?? normalizeFolderTabText(tab?.label)
    ?? getFolderTabDisplayLabel(tab);
}

export function getFolderTabCountLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  const countLabel = normalizeFolderTabText(tab?.countLabel, true);

  if (countLabel !== undefined) {
    return countLabel;
  }

  const count = normalizeFolderTabText(tab?.count, true);

  if (count === undefined || count.length === 0) {
    return '';
  }

  const totalCount = normalizeFolderTabText(tab?.totalCount, true);

  if (totalCount !== undefined && isGreaterFolderTabCount(totalCount, count)) {
    return `${count}/${totalCount}`;
  }

  return count;
}

export function hasFolderTabCount(tab: Partial<FolderTabItem> | null | undefined): boolean {
  return getFolderTabCountLabel(tab).length > 0;
}

export function hasLimitedFolderTabTotal(tab: Partial<FolderTabItem> | null | undefined): boolean {
  if (normalizeFolderTabText(tab?.countLabel, true) !== undefined) {
    return false;
  }

  const count = normalizeFolderTabText(tab?.count, true);
  const totalCount = normalizeFolderTabText(tab?.totalCount, true);

  return count !== undefined && totalCount !== undefined && isGreaterFolderTabCount(totalCount, count);
}

export function getFolderTabTotalCountLabel(tab: Partial<FolderTabItem> | null | undefined): string {
  return normalizeFolderTabText(tab?.totalCount, true) ?? '';
}

export function isFolderTabDisabled(tab: Partial<FolderTabItem> | null | undefined): boolean {
  return tab?.disabled === true;
}

export function getFolderTabIcon(tab: Partial<FolderTabItem> | null | undefined): Component | null {
  const icon = toRaw(tab?.icon);

  if (typeof icon === 'function') {
    return icon;
  }

  if (isFolderTabIconObject(icon)) {
    return icon as Component;
  }

  return null;
}

export function hasFolderTabIcon(tab: Partial<FolderTabItem> | null | undefined): boolean {
  return getFolderTabIcon(tab) !== null;
}

function normalizeFolderTabText(value: unknown, preserveEmpty = false): string | undefined {
  if (typeof value === 'string') {
    return preserveEmpty || value.length > 0 ? value : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function isGreaterFolderTabCount(totalCount: string, count: string): boolean {
  const numericTotal = Number(totalCount);
  const numericCount = Number(count);

  return Number.isFinite(numericTotal) && Number.isFinite(numericCount) && numericTotal > numericCount;
}

function isFolderTabIconObject(icon: unknown): icon is Record<PropertyKey, unknown> {
  return icon !== null
    && typeof icon === 'object'
    && (
      'render' in icon
      || 'setup' in icon
      || 'template' in icon
      || '__asyncLoader' in icon
    );
}

export function normalizeFolderMotionDuration(duration: number | null | undefined): number {
  const value = Number(duration);

  return Number.isFinite(value)
    ? Math.max(Math.round(value), 0)
    : 0;
}

export function normalizeFolderTabOrientation(
  orientation: unknown,
  fallback: FolderTabOrientation = 'horizontal',
): FolderTabOrientation {
  return folderTabOrientations.has(orientation as FolderTabOrientation)
    ? orientation as FolderTabOrientation
    : fallback;
}

export function normalizeFolderTabKeyboardOrientation(
  orientation: unknown,
  fallback: FolderTabKeyboardOrientation = 'both',
): FolderTabKeyboardOrientation {
  return folderTabKeyboardOrientations.has(orientation as FolderTabKeyboardOrientation)
    ? orientation as FolderTabKeyboardOrientation
    : fallback;
}

export function normalizeFolderTabDensity(density: unknown): FolderTabDensity {
  return folderTabDensities.has(density as FolderTabDensity)
    ? density as FolderTabDensity
    : 'spread';
}

export function normalizeFolderTabActivation(activation: unknown): FolderTabActivation {
  return folderTabActivations.has(activation as FolderTabActivation)
    ? activation as FolderTabActivation
    : 'automatic';
}

export function normalizeFolderTabExpandOn(expandOn: unknown): FolderTabExpandOn {
  return folderTabExpandModes.has(expandOn as FolderTabExpandOn)
    ? expandOn as FolderTabExpandOn
    : 'hover';
}

export function normalizeFolderTabGravity(gravity: unknown): FolderTabGravity {
  return folderTabGravities.has(gravity as FolderTabGravity)
    ? gravity as FolderTabGravity
    : 'center';
}

export function normalizeFolderTabAppearance(appearance: unknown): FolderTabAppearance {
  return folderTabAppearances.has(appearance as FolderTabAppearance)
    ? appearance as FolderTabAppearance
    : 'rail';
}

export function normalizeFolderBinderDepth(depth: unknown): FolderBinderDepth {
  return folderBinderDepths.has(depth as FolderBinderDepth)
    ? depth as FolderBinderDepth
    : 'raised';
}

export function normalizeFolderLayerCount(layers: unknown): number {
  const value = Number(layers);

  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), 2) : 2;
}

export function normalizeFolderActiveIndex(activeIndex: unknown): number {
  const value = Number(activeIndex);

  return Number.isFinite(value) ? Math.max(Math.round(value), 0) : 0;
}

export function normalizeFolderTone(tone: unknown): FolderTone {
  return folderTones.has(tone as FolderTone)
    ? tone as FolderTone
    : 'slate';
}

export function normalizeFolderStackRotation(rotation: unknown): FolderStackRotation {
  return folderStackRotations.has(rotation as FolderStackRotation)
    ? rotation as FolderStackRotation
    : 'none';
}

export function getFolderTabDomId(
  baseId: string,
  tab: Partial<FolderTabItem> | null | undefined,
  suffix: string,
): string {
  const tabKey = isFolderTabKey(tab?.key) ? tab.key : 'tab';

  return [
    sanitizeFolderTabDomIdPart(baseId),
    sanitizeFolderTabDomIdPart(tabKey),
    hashFolderTabDomIdPart(tabKey),
    sanitizeFolderTabDomIdPart(suffix),
  ].filter(Boolean).join('-');
}

function sanitizeFolderTabDomIdPart(value: FolderTabKey | string): string {
  const normalized = String(value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return normalized.replace(/^-+|-+$/g, '') || 'folder-tab';
}

function hashFolderTabDomIdPart(value: FolderTabKey | string): string {
  const text = String(value);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function getAdjacentFolderTabKey(
  tabs: readonly FolderTabItem[],
  currentKey: FolderTabKey | null | undefined,
  direction: number,
): FolderTabKey | null {
  const normalizedTabs = normalizeFolderTabs(tabs).filter((tab) => !isFolderTabDisabled(tab));

  if (normalizedTabs.length === 0) {
    return null;
  }

  const normalizedCurrentKey = normalizeFolderTabKeyForLookup(currentKey);
  const currentIndex = normalizedCurrentKey === null
    ? -1
    : normalizedTabs.findIndex((tab) => String(tab.key) === normalizedCurrentKey);
  if (currentIndex === -1) {
    return direction > 0
      ? normalizedTabs[0]?.key ?? null
      : normalizedTabs.at(-1)?.key ?? null;
  }

  const nextIndex = direction > 0
    ? Math.min(currentIndex + 1, normalizedTabs.length - 1)
    : Math.max(currentIndex - 1, 0);

  return normalizedTabs[nextIndex]?.key ?? null;
}

export function getFirstFolderTabKey(tabs: readonly FolderTabItem[]): FolderTabKey | null {
  return normalizeFolderTabs(tabs).find((tab) => !isFolderTabDisabled(tab))?.key ?? null;
}

export function getLastFolderTabKey(tabs: readonly FolderTabItem[]): FolderTabKey | null {
  return normalizeFolderTabs(tabs).filter((tab) => !isFolderTabDisabled(tab)).at(-1)?.key ?? null;
}

export function normalizeFolderTabEdge(
  edge: unknown,
  orientation: unknown = 'horizontal',
): FolderTabEdge {
  if (edge && folderTabEdges.has(edge as FolderTabEdge)) {
    return edge as FolderTabEdge;
  }

  return normalizeFolderTabOrientation(orientation) === 'horizontal' ? 'top' : 'left';
}

export function getFolderTabOrientationForEdge(edge: unknown): FolderTabOrientation {
  const normalizedEdge = folderTabEdges.has(edge as FolderTabEdge)
    ? edge as FolderTabEdge
    : 'top';

  return normalizedEdge === 'left' || normalizedEdge === 'right' ? 'vertical' : 'horizontal';
}

export function getFolderTabNavigationTarget(
  tabs: readonly FolderTabItem[],
  currentKey: FolderTabKey | null | undefined,
  key: string,
  orientation: unknown = 'both',
): FolderTabKey | null {
  const keyActions: Record<string, () => FolderTabKey | null> = {};
  const normalizedOrientation = normalizeFolderTabKeyboardOrientation(orientation);

  if (normalizedOrientation === 'horizontal' || normalizedOrientation === 'both') {
    keyActions.ArrowRight = () => getAdjacentFolderTabKey(tabs, currentKey, 1);
    keyActions.ArrowLeft = () => getAdjacentFolderTabKey(tabs, currentKey, -1);
  }

  if (normalizedOrientation === 'vertical' || normalizedOrientation === 'both') {
    keyActions.ArrowDown = () => getAdjacentFolderTabKey(tabs, currentKey, 1);
    keyActions.ArrowUp = () => getAdjacentFolderTabKey(tabs, currentKey, -1);
  }

  keyActions.Home = () => getFirstFolderTabKey(tabs);
  keyActions.End = () => getLastFolderTabKey(tabs);

  return keyActions[key]?.() ?? null;
}
