import { describe, expect, it } from 'vitest';
import {
  getAdjacentFolderTabKey,
  getFirstFolderTabKey,
  getFolderTabAccessibleLabel,
  getFolderTabCountLabel,
  getFolderTabDisplayLabel,
  getFolderTabNavigationTarget,
  hasLimitedFolderTabTotal,
  normalizeFolderTabEdge,
  normalizeFolderTabs,
  type FolderTabItem,
} from '../src/components/folder-tabs';

const tabs: FolderTabItem[] = [
  { key: 'photos', label: 'Object photos', shortLabel: 'Photos', count: 1, totalCount: 15 },
  { key: 'plans', label: 'Floor plans', shortLabel: 'Plans', count: 2 },
  { key: 'maps', label: 'Maps and plans', shortLabel: 'Maps', disabled: true },
  { key: 'docs', label: 'Documents', shortLabel: 'Docs', countLabel: '12' },
];

describe('folder tab helpers', () => {
  it('keeps only keyed, labelled tabs', () => {
    expect(normalizeFolderTabs([...tabs, { key: null, label: 'Missing' }, { key: 'bad' }]).map((tab) => tab.key))
      .toEqual(['photos', 'plans', 'maps', 'docs']);
  });

  it('prefers compact visible labels while preserving accessible labels', () => {
    expect(getFolderTabDisplayLabel(tabs[0])).toBe('Photos');
    expect(getFolderTabAccessibleLabel(tabs[0])).toBe('Object photos');
    expect(getFolderTabAccessibleLabel({ key: 'x', label: 'Full', srLabel: 'Screen reader full' })).toBe('Screen reader full');
  });

  it('renders count labels for limited and explicit count states', () => {
    expect(getFolderTabCountLabel(tabs[0])).toBe('1/15');
    expect(getFolderTabCountLabel(tabs[3])).toBe('12');
    expect(hasLimitedFolderTabTotal(tabs[0])).toBe(true);
  });

  it('navigates among focusable tabs without wrapping beyond the physical stack', () => {
    expect(getFirstFolderTabKey(tabs)).toBe('photos');
    expect(getAdjacentFolderTabKey(tabs, 'photos', 1)).toBe('plans');
    expect(getAdjacentFolderTabKey(tabs, 'plans', 1)).toBe('docs');
    expect(getAdjacentFolderTabKey(tabs, 'docs', 1)).toBe('docs');
    expect(getAdjacentFolderTabKey(tabs, 'plans', -1)).toBe('photos');
  });

  it('maps keyboard keys to physical neighbor targets', () => {
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowRight')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'docs', 'ArrowLeft')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'End')).toBe('docs');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'Escape')).toBeNull();
  });

  it('derives default edges from orientation', () => {
    expect(normalizeFolderTabEdge(null, 'horizontal')).toBe('top');
    expect(normalizeFolderTabEdge(undefined, 'vertical')).toBe('left');
    expect(normalizeFolderTabEdge('right', 'vertical')).toBe('right');
  });
});

