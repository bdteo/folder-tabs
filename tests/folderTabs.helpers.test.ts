import { describe, expect, it } from 'vitest';
import {
  getAdjacentFolderTabKey,
  getCompactSize,
  getFirstFolderTabKey,
  getFolderPaperTexturePreset,
  getFolderPaperTextureStyle,
  getFolderDensityOverlap,
  getFolderEdgeVector,
  getFolderHoverOffset,
  getFolderMinimumGrabSize,
  getFolderMinimumVisibleGrabSize,
  getFolderPieceTuckOffset,
  getFolderStackSlots,
  getFolderTabAccessibleLabel,
  getFolderTabCountLabel,
  getFolderTabDisplayLabel,
  getFolderTabDomId,
  getFolderTabIcon,
  getFolderTabNavigationTarget,
  getFolderTabOrientationForEdge,
  getFolderTabReachSize,
  getFolderTabTotalCountLabel,
  getFolderTuckRotation,
  getFolderVisibleGrabSize,
  hasFolderTabCount,
  hasFolderTabIcon,
  hasLimitedFolderTabTotal,
  isFolderTabDisabled,
  normalizeFolderActiveIndex,
  normalizeFolderBinderDepth,
  normalizeFolderLayerCount,
  normalizeFolderMotionDuration,
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderSurfaceTexture,
  normalizeFolderSurfaceTextureLayers,
  normalizeFolderTabRotation,
  normalizeFolderTabActivation,
  normalizeFolderTabAppearance,
  normalizeFolderTabDensity,
  normalizeFolderTabEdge,
  normalizeFolderTabExpandOn,
  normalizeFolderTabGravity,
  normalizeFolderTabKeyboardOrientation,
  normalizeFolderTabKeyForLookup,
  normalizeFolderTabOrientation,
  normalizeFolderTabs,
  normalizeFolderTone,
  type FolderTabMeasurement,
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
    expect(normalizeFolderTabs([
      ...tabs,
      { key: null, label: 'Missing' },
      { key: 'bad' },
      { key: {}, label: 'Object key' },
      { key: true, label: 'Boolean key' },
      { key: Symbol('symbol'), label: 'Symbol key' },
      { key: () => 'function', label: 'Function key' },
      { key: Number.NaN, label: 'NaN key' },
      { key: Number.POSITIVE_INFINITY, label: 'Infinite key' },
      { key: Number.NEGATIVE_INFINITY, label: 'Negative infinite key' },
      { key: 0, label: 'Zero key' },
    ]).map((tab) => tab.key)).toEqual(['photos', 'plans', 'maps', 'docs', 0]);
  });

  it('keeps the first tab for each string-normalized key', () => {
    expect(normalizeFolderTabs([
      ...tabs,
      { key: 'photos', label: 'Duplicate photos' },
      { key: 12, label: 'Numeric key' },
      { key: '12', label: 'String duplicate key' },
    ]).map((tab) => tab.label)).toEqual([
      'Object photos',
      'Floor plans',
      'Maps and plans',
      'Documents',
      'Numeric key',
    ]);
  });

  it('normalizes only real folder tab keys for lookup comparisons', () => {
    const objectLikeKeyTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Object photos' },
      { key: '[object Object]', label: 'Object-looking string key' },
    ];

    expect(normalizeFolderTabKeyForLookup('photos')).toBe('photos');
    expect(normalizeFolderTabKeyForLookup(0)).toBe('0');
    expect(normalizeFolderTabKeyForLookup('[object Object]')).toBe('[object Object]');
    expect(normalizeFolderTabKeyForLookup({})).toBeNull();
    expect(normalizeFolderTabKeyForLookup(Number.NaN)).toBeNull();
    expect(normalizeFolderTabKeyForLookup(Number.POSITIVE_INFINITY)).toBeNull();
    expect(getAdjacentFolderTabKey(objectLikeKeyTabs, {} as any, 1)).toBe('photos');
    expect(getFolderTabNavigationTarget(objectLikeKeyTabs, {} as any, 'ArrowRight')).toBe('photos');
  });

  it('prefers compact visible labels while preserving accessible labels', () => {
    expect(getFolderTabDisplayLabel(tabs[0])).toBe('Photos');
    expect(getFolderTabAccessibleLabel(tabs[0])).toBe('Object photos');
    expect(getFolderTabAccessibleLabel({ key: 'x', label: 'Full', srLabel: 'Screen reader full' })).toBe('Screen reader full');
    expect(getFolderTabDisplayLabel({ key: 'x', label: 'Full', shortLabel: {} as any })).toBe('Full');
    expect(getFolderTabAccessibleLabel({ key: 'x', label: 'Full', srLabel: {} as any })).toBe('Full');
    expect(getFolderTabDisplayLabel({ key: 'x', label: {} as any })).toBe('');
  });

  it('keeps only Vue component-like icon values at runtime', () => {
    const functionalIcon = () => null;
    const objectIcon = { render: () => null };

    expect(getFolderTabIcon({ key: 'fn', label: 'Function icon', icon: functionalIcon })).toBe(functionalIcon);
    expect(getFolderTabIcon({ key: 'object', label: 'Object icon', icon: objectIcon })).toBe(objectIcon);
    expect(hasFolderTabIcon({ key: 'object', label: 'Object icon', icon: objectIcon })).toBe(true);
    expect(getFolderTabIcon({ key: 'string', label: 'String icon', icon: 'span' as any })).toBeNull();
    expect(getFolderTabIcon({ key: 'plain', label: 'Plain icon', icon: {} as any })).toBeNull();
    expect(hasFolderTabIcon({ key: 'plain', label: 'Plain icon', icon: {} as any })).toBe(false);
  });

  it('renders count labels for limited and explicit count states', () => {
    expect(getFolderTabCountLabel(tabs[0])).toBe('1/15');
    expect(getFolderTabCountLabel(tabs[3])).toBe('12');
    expect(getFolderTabCountLabel({ ...tabs[0], countLabel: '15' })).toBe('15');
    expect(getFolderTabTotalCountLabel(tabs[0])).toBe('15');
    expect(hasFolderTabCount(tabs[0])).toBe(true);
    expect(hasFolderTabCount(tabs[3])).toBe(true);
    expect(hasFolderTabCount({ key: 'empty', label: 'Empty', countLabel: '' })).toBe(false);
    expect(hasFolderTabCount({ key: 'zero', label: 'Zero', count: 0 })).toBe(true);
    expect(hasLimitedFolderTabTotal(tabs[0])).toBe(true);
    expect(hasLimitedFolderTabTotal({ ...tabs[0], countLabel: '15' })).toBe(false);
  });

  it('treats only boolean true as disabled at runtime', () => {
    expect(isFolderTabDisabled({ key: 'disabled', label: 'Disabled', disabled: true })).toBe(true);
    expect(isFolderTabDisabled({ key: 'enabled', label: 'Enabled', disabled: false })).toBe(false);
    expect(isFolderTabDisabled({ key: 'string', label: 'String disabled', disabled: 'false' as any })).toBe(false);
    expect(isFolderTabDisabled({ key: 'number', label: 'Number disabled', disabled: 1 as any })).toBe(false);
    expect(isFolderTabDisabled({ key: 'object', label: 'Object disabled', disabled: {} as any })).toBe(false);
  });

  it('ignores invalid runtime count values instead of rendering object text', () => {
    const invalidCountLabel = { key: 'runtime', label: 'Runtime', count: 3, totalCount: 12, countLabel: {} } as any;
    const invalidCount = { key: 'runtime', label: 'Runtime', count: {}, totalCount: 12 } as any;

    expect(getFolderTabCountLabel(invalidCountLabel)).toBe('3/12');
    expect(hasFolderTabCount(invalidCountLabel)).toBe(true);
    expect(hasLimitedFolderTabTotal(invalidCountLabel)).toBe(true);
    expect(getFolderTabCountLabel(invalidCount)).toBe('');
    expect(hasFolderTabCount(invalidCount)).toBe(false);
    expect(hasLimitedFolderTabTotal(invalidCount)).toBe(false);
    expect(getFolderTabCountLabel({ key: 'empty', label: 'Empty', count: 3, totalCount: 12, countLabel: '' })).toBe('');
    expect(hasLimitedFolderTabTotal({ key: 'empty', label: 'Empty', count: 3, totalCount: 12, countLabel: '' })).toBe(false);
    expect(getFolderTabCountLabel({ key: 'nan', label: 'NaN', count: Number.NaN })).toBe('');
    expect(getFolderTabCountLabel({ key: 'infinite', label: 'Infinite', count: 3, totalCount: 'Infinity' })).toBe('3');
    expect(hasLimitedFolderTabTotal({ key: 'infinite', label: 'Infinite', count: 3, totalCount: 'Infinity' })).toBe(false);
    expect(getFolderTabTotalCountLabel({ key: 'object', label: 'Object', totalCount: {} as any })).toBe('');
    expect(getFolderTabCountLabel({ key: 'symbol', label: 'Symbol', countLabel: Symbol('bad') } as any)).toBe('');
  });

  it('builds safe default tab and panel DOM ids from arbitrary keys', () => {
    expect(getFolderTabDomId('Folder Attachment:v-0', { key: 'Client Intake / 2026' }, 'panel'))
      .toMatch(/^folder-attachment-v-0-client-intake-2026-[a-z0-9]+-panel$/);
    expect(getFolderTabDomId('Folder Attachment:v-0', { key: '   ' }, 'tab'))
      .toMatch(/^folder-attachment-v-0-folder-tab-[a-z0-9]+-tab$/);
    expect(getFolderTabDomId('Folder Attachment:v-0', { key: Number.NaN }, 'tab'))
      .toMatch(/^folder-attachment-v-0-tab-[a-z0-9]+-tab$/);
    expect(getFolderTabDomId('Folder Attachment:v-0', { key: Number.POSITIVE_INFINITY }, 'tab'))
      .toMatch(/^folder-attachment-v-0-tab-[a-z0-9]+-tab$/);
  });

  it('keeps generated DOM ids distinct when readable key slugs collide', () => {
    expect(getFolderTabDomId('folder-tabs', { key: 'Client Intake' }, 'panel'))
      .not.toBe(getFolderTabDomId('folder-tabs', { key: 'Client/Intake' }, 'panel'));
    expect(getFolderTabDomId('folder-tabs', { key: 'A' }, 'tab'))
      .not.toBe(getFolderTabDomId('folder-tabs', { key: 'a' }, 'tab'));
  });

  it('normalizes motion durations to finite non-negative milliseconds', () => {
    expect(normalizeFolderMotionDuration(315.4)).toBe(315);
    expect(normalizeFolderMotionDuration(-20)).toBe(0);
    expect(normalizeFolderMotionDuration(Number.NaN)).toBe(0);
    expect(normalizeFolderMotionDuration(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeFolderMotionDuration(undefined)).toBe(0);
  });

  it('normalizes public enum props from unknown runtime values', () => {
    expect(normalizeFolderTabOrientation('vertical')).toBe('vertical');
    expect(normalizeFolderTabOrientation('diagonal')).toBe('horizontal');
    expect(normalizeFolderTabKeyboardOrientation('both')).toBe('both');
    expect(normalizeFolderTabKeyboardOrientation('sideways')).toBe('both');
    expect(normalizeFolderTabDensity('dense')).toBe('dense');
    expect(normalizeFolderTabDensity('loose')).toBe('spread');
    expect(normalizeFolderTabActivation('manual')).toBe('manual');
    expect(normalizeFolderTabActivation('instant')).toBe('automatic');
    expect(normalizeFolderTabExpandOn('always')).toBe('always');
    expect(normalizeFolderTabExpandOn('touch')).toBe('hover');
    expect(normalizeFolderTabGravity('end')).toBe('end');
    expect(normalizeFolderTabGravity('middle')).toBe('center');
    expect(normalizeFolderTabAppearance('stack')).toBe('stack');
    expect(normalizeFolderTabAppearance('accordion')).toBe('rail');
    expect(normalizeFolderBinderDepth('deep')).toBe('deep');
    expect(normalizeFolderBinderDepth('sunken')).toBe('raised');
    expect(normalizeFolderLayerCount(2.4)).toBe(2);
    expect(normalizeFolderLayerCount(1.6)).toBe(2);
    expect(normalizeFolderLayerCount(-1)).toBe(0);
    expect(normalizeFolderLayerCount(Number.NaN)).toBe(2);
    expect(normalizeFolderLayerCount(Number.POSITIVE_INFINITY)).toBe(2);
    expect(normalizeFolderActiveIndex(3.4)).toBe(3);
    expect(normalizeFolderActiveIndex(-1)).toBe(0);
    expect(normalizeFolderActiveIndex(Number.NaN)).toBe(0);
    expect(normalizeFolderTone('copper')).toBe('copper');
    expect(normalizeFolderTone('steel')).toBe('steel');
    expect(normalizeFolderTone('neon')).toBe('slate');
    expect(normalizeFolderTabRotation('rotated')).toBe('rotated');
    expect(normalizeFolderTabRotation('sideways')).toBe('straight');
    expect(normalizeFolderSurfaceTexture('paper')).toBe('paper');
    expect(normalizeFolderSurfaceTexture('linen')).toBe('none');
    expect(normalizeFolderSurfaceTextureLayers('all')).toEqual(['sheet', 'content', 'tab']);
    expect(normalizeFolderSurfaceTextureLayers('shell')).toEqual(['sheet', 'tab']);
    expect(normalizeFolderSurfaceTextureLayers('none')).toEqual([]);
    expect(normalizeFolderSurfaceTextureLayers(['tab', 'sheet', 'tab', 'smudge'])).toEqual(['tab', 'sheet']);
    expect(normalizeFolderSurfaceTextureLayers('smudge')).toEqual(['sheet', 'content', 'tab']);
    expect(normalizeFolderSurfaceTextColor('dark')).toBe('dark');
    expect(normalizeFolderSurfaceTextColor('invisible')).toBe('auto');
    expect(normalizeFolderSurfaceTextureBlendMode('multiply')).toBe('multiply');
    expect(normalizeFolderSurfaceTextureBlendMode('smudge')).toBe('auto');
  });

  it('exposes package paper texture presets as bindable CSS variables', () => {
    expect(getFolderPaperTexturePreset('paper05HybridStrong')?.label).toBe('#5 strong tile');
    expect(getFolderPaperTexturePreset('missing')).toBeNull();

    expect(getFolderPaperTextureStyle('paper05HybridStrong')).toMatchObject({
      '--folder-paper-filter-custom': 'contrast(1.85) brightness(0.92) saturate(0.72)',
      '--folder-paper-sheet-opacity-custom': '0.72',
      '--folder-paper-content-opacity-custom': '0.46',
      '--folder-paper-tab-opacity-custom': '0.6',
    });
    expect(getFolderPaperTextureStyle('paper05HybridStrong')['--folder-paper-texture-custom'])
      ?.toContain('05-creamy-fine-tooth-hybrid-strong-128-tile');
    expect(getFolderPaperTextureStyle('missing')).toEqual({});
  });

  it('navigates among focusable tabs without wrapping beyond the physical stack', () => {
    expect(getFirstFolderTabKey(tabs)).toBe('photos');
    expect(getAdjacentFolderTabKey(tabs, 'photos', 1)).toBe('plans');
    expect(getAdjacentFolderTabKey(tabs, 'plans', 1)).toBe('docs');
    expect(getAdjacentFolderTabKey(tabs, 'docs', 1)).toBe('docs');
    expect(getAdjacentFolderTabKey(tabs, 'plans', -1)).toBe('photos');
  });

  it('recovers keyboard navigation from stale current keys without skipping focusable tabs', () => {
    expect(getAdjacentFolderTabKey(tabs, 'missing', 1)).toBe('photos');
    expect(getAdjacentFolderTabKey(tabs, null, 1)).toBe('photos');
    expect(getAdjacentFolderTabKey(tabs, 'missing', -1)).toBe('docs');
    expect(getAdjacentFolderTabKey(tabs, undefined, -1)).toBe('docs');
    expect(getFolderTabNavigationTarget(tabs, 'missing', 'ArrowRight')).toBe('photos');
    expect(getFolderTabNavigationTarget(tabs, 'missing', 'ArrowLeft')).toBe('docs');
  });

  it('maps keyboard keys to physical neighbor targets when both axes are allowed', () => {
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowRight')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowDown')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'docs', 'ArrowLeft')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'docs', 'ArrowUp')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'End')).toBe('docs');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'Escape')).toBeNull();
  });

  it('respects tablist orientation when mapping arrow keys', () => {
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowRight', 'horizontal')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowDown', 'horizontal')).toBeNull();
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowDown', 'vertical')).toBe('plans');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'ArrowRight', 'vertical')).toBeNull();
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'Home', 'vertical')).toBe('photos');
    expect(getFolderTabNavigationTarget(tabs, 'photos', 'End', 'horizontal')).toBe('docs');
  });

  it('derives default edges from orientation', () => {
    expect(normalizeFolderTabEdge(null, 'horizontal')).toBe('top');
    expect(normalizeFolderTabEdge(undefined, 'vertical')).toBe('left');
    expect(normalizeFolderTabEdge('right', 'vertical')).toBe('right');
    expect(normalizeFolderTabEdge('diagonal', 'sideways')).toBe('top');
  });

  it('derives physical orientation from the folder edge', () => {
    expect(getFolderTabOrientationForEdge('top')).toBe('horizontal');
    expect(getFolderTabOrientationForEdge('bottom')).toBe('horizontal');
    expect(getFolderTabOrientationForEdge('left')).toBe('vertical');
    expect(getFolderTabOrientationForEdge('right')).toBe('vertical');
    expect(getFolderTabOrientationForEdge('diagonal')).toBe('horizontal');
  });

  it('maps folder edges to canonical pull vectors', () => {
    expect(getFolderEdgeVector('left')).toMatchObject({ axis: 'x', sign: -1, x: -1, y: 0 });
    expect(getFolderEdgeVector('right')).toMatchObject({ axis: 'x', sign: 1, x: 1, y: 0 });
    expect(getFolderEdgeVector('top')).toMatchObject({ axis: 'y', sign: -1, x: 0, y: -1 });
    expect(getFolderEdgeVector('bottom')).toMatchObject({ axis: 'y', sign: 1, x: 0, y: 1 });
  });

  it('tugs hovered tab handles toward their folder edge', () => {
    expect(getFolderHoverOffset('left')).toEqual({ x: -6, y: 0 });
    expect(getFolderHoverOffset('right')).toEqual({ x: 6, y: 0 });
    expect(getFolderHoverOffset('top')).toEqual({ x: 0, y: -6 });
    expect(getFolderHoverOffset('bottom')).toEqual({ x: 0, y: 6 });
  });

  it('tucks physical folders inward with a readable 7px depth step', () => {
    expect(getFolderPieceTuckOffset('left', 0, 3, 'spread')).toEqual({ x: 29, y: 0 });
    expect(getFolderPieceTuckOffset('right', 0, 3, 'spread')).toEqual({ x: -29, y: 0 });
    expect(getFolderPieceTuckOffset('top', 0, 3, 'spread')).toEqual({ x: 0, y: 29 });
    expect(getFolderPieceTuckOffset('bottom', 0, 3, 'spread')).toEqual({ x: 0, y: -29 });
    expect(getFolderPieceTuckOffset('left', 0, 2, 'dense')).toEqual({ x: 17, y: 0 });
  });

  it('rotates tucked folders with small mirrored angles', () => {
    expect(getFolderTuckRotation('top', 2, 2)).toBe(0);
    expect(getFolderTuckRotation('top', 0, 3)).toBe(-0.96);
    expect(getFolderTuckRotation('top', 1, 3)).toBe(0.78);
    expect(getFolderTuckRotation('right', 0, 3)).toBe(0.96);
    expect(getFolderTuckRotation('bottom', 1, 3)).toBe(-0.78);
    expect(Math.abs(getFolderTuckRotation('left', 99, 0))).toBeLessThanOrEqual(1.35);
  });

  it('extends buried tab handles enough to preserve the compact handle lane', () => {
    expect(getFolderTabReachSize(44, 0)).toBe(44);
    expect(getFolderTabReachSize(44, 20)).toBe(64);
    expect(getFolderTabReachSize(44, 22)).toBe(66);
    expect(getFolderTabReachSize(44, 37)).toBe(81);
    expect(getFolderTabReachSize(32, 40, 20)).toBe(60);
    expect(getFolderTabReachSize(44, 27, 44, 8)).toBe(79);
    expect(getFolderTabReachSize(32, 40, 20, 8)).toBe(68);
  });

  it('reserves a visible grab lane large enough for icons and touch padding', () => {
    expect(getFolderMinimumGrabSize(44)).toBe(52);
    expect(getFolderMinimumGrabSize(64)).toBe(64);
    expect(getFolderMinimumGrabSize(44, 60)).toBe(60);
    expect(getFolderMinimumGrabSize(Number.NaN)).toBe(52);
    expect(getFolderMinimumVisibleGrabSize('top')).toBe(52);
    expect(getFolderMinimumVisibleGrabSize('bottom')).toBe(52);
    expect(getFolderMinimumVisibleGrabSize('left')).toBe(120);
    expect(getFolderMinimumVisibleGrabSize('right')).toBe(120);
    expect(getFolderTabReachSize(44, 27, getFolderMinimumGrabSize(44), 8)).toBe(87);
    expect(getFolderTabReachSize(44, 27, getFolderMinimumGrabSize(44, getFolderMinimumVisibleGrabSize('right')), 8)).toBe(155);
  });

  it('keeps the grab lane visible after tucked depth and active folder cover are removed', () => {
    const compactSize = 44;
    const activeCoverDistance = 8;

    for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
      const tuckedOffset = getFolderPieceTuckOffset(edge, 0, 4, 'spread');
      const tuckedDistance = Math.max(Math.abs(tuckedOffset.x), Math.abs(tuckedOffset.y));
      const minimumVisibleGrabSize = getFolderMinimumVisibleGrabSize(edge);
      const minimumGrabSize = getFolderMinimumGrabSize(compactSize, minimumVisibleGrabSize);
      const reachSize = getFolderTabReachSize(
        compactSize,
        tuckedDistance,
        minimumGrabSize,
        activeCoverDistance,
      );

      expect(getFolderVisibleGrabSize(reachSize, tuckedDistance, activeCoverDistance))
        .toBe(minimumGrabSize);
    }

    expect(getFolderVisibleGrabSize(155, 27, activeCoverDistance)).toBe(120);
    expect(getFolderVisibleGrabSize(87, 27, activeCoverDistance)).toBe(52);
  });

  it('uses measured tab geometry to reserve the active folder slot', () => {
    const measurements: FolderTabMeasurement[] = [
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 120 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 160 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 100 },
      { compactBlockSize: 44, compactInlineSize: 44, openInlineSize: 140 },
    ];

    expect(getFolderDensityOverlap('overlap', 'stack')).toBe(10);
    expect(getFolderDensityOverlap('spread', 'stack')).toBe(0);
    expect(getFolderStackSlots({
      activeIndex: 1,
      appearance: 'stack',
      density: 'overlap',
      measurements,
      orientation: 'vertical',
    })).toEqual([0, 34, 194, 228]);
  });

  it('keeps exported geometry helpers finite for non-finite runtime inputs', () => {
    const brokenMeasurements: FolderTabMeasurement[] = [
      { compactBlockSize: Number.NaN, compactInlineSize: Number.POSITIVE_INFINITY, openInlineSize: Number.POSITIVE_INFINITY },
      { compactBlockSize: -12, compactInlineSize: -10, openInlineSize: Number.NaN },
    ];
    const tuckedOffset = getFolderPieceTuckOffset('top', Number.NaN, Number.POSITIVE_INFINITY, 'loose' as any);
    const slots = getFolderStackSlots({
      activeIndex: Number.NaN,
      appearance: 'accordion' as any,
      density: 'loose' as any,
      expandedIndexes: [Number.POSITIVE_INFINITY],
      measurements: brokenMeasurements,
      orientation: 'diagonal' as any,
    });

    expect(getCompactSize(brokenMeasurements[0], 'horizontal')).toBe(44);
    expect(getCompactSize(brokenMeasurements[1], 'vertical')).toBe(44);
    expect(getFolderDensityOverlap('loose' as any, 'accordion' as any)).toBe(0);
    expect(getFolderTabReachSize(Number.NaN, Number.POSITIVE_INFINITY)).toBe(0);
    expect(getFolderVisibleGrabSize(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN)).toBe(0);
    expect(tuckedOffset).toEqual({ x: 0, y: 8 });
    expect(slots).toEqual([0, 44]);
    expect(slots.every(Number.isFinite)).toBe(true);
    expect(Object.values(tuckedOffset).every(Number.isFinite)).toBe(true);
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
