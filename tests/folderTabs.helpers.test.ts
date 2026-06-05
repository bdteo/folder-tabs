import { describe, expect, it } from 'vitest';
import {
  getFolderDensityOverlap,
  getFolderEdgeVector,
  getFolderHoverOffset,
  getFolderStackSlots,
  type FolderTabMeasurement,
} from '../src/components/folder-tabs/folderGeometry';
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

  it('maps folder edges to canonical pull vectors', () => {
    expect(getFolderEdgeVector('left')).toMatchObject({ axis: 'x', sign: -1, x: -1, y: 0 });
    expect(getFolderEdgeVector('right')).toMatchObject({ axis: 'x', sign: 1, x: 1, y: 0 });
    expect(getFolderEdgeVector('top')).toMatchObject({ axis: 'y', sign: -1, x: 0, y: -1 });
    expect(getFolderEdgeVector('bottom')).toMatchObject({ axis: 'y', sign: 1, x: 0, y: 1 });
  });

  it('aligns hover offset with the folder edge', () => {
    expect(getFolderHoverOffset('left')).toEqual({ x: 0, y: 0 });
    expect(getFolderHoverOffset('right')).toEqual({ x: 0, y: 0 });
    expect(getFolderHoverOffset('top')).toEqual({ x: 0, y: 0 });
    expect(getFolderHoverOffset('bottom')).toEqual({ x: 0, y: 0 });
  });

  it('uses measured tab geometry to reserve the active folder slot', () => {
    const measurements: FolderTabMeasurement[] = [
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 120 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 160 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 100 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 140 },
    ];

    expect(getFolderDensityOverlap('overlap', 'stack')).toBe(10);
    expect(getFolderStackSlots({
      activeIndex: 1,
      appearance: 'stack',
      density: 'overlap',
      measurements,
      orientation: 'vertical',
    })).toEqual([0, 34, 194, 228]);
  });

  it('can reserve multiple expanded physical slots', () => {
    const measurements: FolderTabMeasurement[] = [
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 120 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 160 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 100 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 140 },
    ];

    expect(getFolderStackSlots({
      activeIndex: 1,
      appearance: 'stack',
      density: 'overlap',
      expandedIndexes: [0, 2],
      measurements,
      orientation: 'vertical',
    })).toEqual([0, 120, 154, 254]);
  });
});
