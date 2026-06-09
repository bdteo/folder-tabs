<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useId, watch, type ComponentPublicInstance } from 'vue';
import Folder from './Folder.vue';
import FolderBinder from './FolderBinder.vue';
import {
  folderFallbackTabMeasurement,
  getCompactSize,
  getFolderEdgeVector,
  getFolderHoverOffset,
  getFolderMinimumGrabSize,
  getFolderMinimumVisibleGrabSize,
  getFolderPieceTuckOffset,
  getFolderPullOffset,
  getFolderStackSlots,
  getFolderTabReachSize,
  getFolderTuckRotation,
  normalizeFolderPullDistance,
  type FolderTabMeasurement,
} from './folderGeometry';
import {
  getFolderTabIcon,
  getFolderTabOrientationForEdge,
  hasFolderTabIcon,
  hasFolderTabCount,
  hasLimitedFolderTabTotal,
  isFolderTabDisabled,
  normalizeFolderBinderDepth,
  normalizeFolderTabEdge,
  normalizeFolderTabActivation,
  normalizeFolderTabAppearance,
  normalizeFolderTabDensity,
  normalizeFolderTabExpandOn,
  normalizeFolderTabGravity,
  normalizeFolderTabKeyForLookup,
  normalizeFolderMotionDuration,
  normalizeFolderStackRotation,
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderSurfaceTextureLayers,
  normalizeFolderSurfaceTexture,
  normalizeFolderTone,
  normalizeFolderTabRotation,
  type FolderBinderDepth,
  type FolderStackRotation,
  type FolderTabRotation,
  type FolderSurfaceTextColor,
  type FolderSurfaceTextureBlendMode,
  type FolderSurfaceTextureLayers,
  type FolderSurfaceTexture,
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
  texture?: FolderSurfaceTexture;
  textureLayers?: FolderSurfaceTextureLayers;
  textureBlendMode?: FolderSurfaceTextureBlendMode;
  textColor?: FolderSurfaceTextColor;
  stackRotation?: FolderStackRotation | null;
  tabRotation?: FolderTabRotation;
  tuckedTilt?: boolean;
  pullDistance?: number;
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
  texture: 'none',
  textureLayers: 'all',
  textureBlendMode: 'auto',
  textColor: 'auto',
  stackRotation: null,
  tabRotation: 'straight',
  tuckedTilt: false,
  pullDistance: 0,
  pullDuration: 420,
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
type FolderLayout = {
  activeIndex: number;
  edge: FolderTabEdge;
  gravity: FolderTabGravity;
  groupSize: number;
  index: number;
  orientation: FolderTabOrientation;
  slot: number;
};

const folderEdges: FolderTabEdge[] = ['top', 'right', 'bottom', 'left'];
const folderGravities: FolderTabGravity[] = ['start', 'center', 'end'];
const defaultReturnDurationRatio = 0.75;
const attachmentId = useId();
const tabList = useFolderTabList(props, {
  idBase: `folder-attachment-${attachmentId}`,
  keyboardOrientation: () => (hasMixedEdges.value ? 'both' : binderOrientation.value),
});
const measurementRefs = new Map<string, MeasurementRefs>();
const measurements = ref<Record<string, FolderTabMeasurement>>({});
const hoveredKey = ref<string | null>(null);
const focusedKey = ref<string | null>(null);
const selectionHistory = ref<string[]>([]);
const tabOpenBreathingRoom = 16;
const folderPieceZ = {
  restingBase: 40,
  returning: 240,
  active: 250,
  pulled: 260,
  pulling: 270,
  selecting: 280,
  front: 300,
};
let measureFrame: number | null = null;
let isUnmounted = false;

const activeIndex = computed(() => {
  if (!tabList.activeKey.value) {
    return -1;
  }

  const index = tabList.visibleTabs.value.findIndex((tab) => String(tab.key) === tabList.activeKey.value);
  return index === -1 ? -1 : index;
});

const activeTab = computed(() => (activeIndex.value >= 0
  ? tabList.visibleTabs.value[activeIndex.value] ?? null
  : null));
const normalizedActivation = computed(() => normalizeFolderTabActivation(props.activation));
const normalizedAppearance = computed(() => normalizeFolderTabAppearance(props.appearance));
const normalizedDensity = computed(() => normalizeFolderTabDensity(props.density));
const normalizedDepth = computed(() => normalizeFolderBinderDepth(props.depth));
const normalizedExpandOn = computed(() => normalizeFolderTabExpandOn(props.expandOn));
const normalizedGravity = computed(() => normalizeFolderTabGravity(props.gravity));
const normalizedStackRotation = computed(() => (
  props.stackRotation === null || props.stackRotation === undefined
    ? (props.tuckedTilt ? 'pieces' : 'none')
    : normalizeFolderStackRotation(props.stackRotation)
));
const normalizedTabRotation = computed(() => normalizeFolderTabRotation(props.tabRotation));
const normalizedTexture = computed(() => normalizeFolderSurfaceTexture(props.texture));
const normalizedTextureLayers = computed(() => normalizeFolderSurfaceTextureLayers(props.textureLayers));
const normalizedTextureBlendMode = computed(() => normalizeFolderSurfaceTextureBlendMode(props.textureBlendMode));
const normalizedTextColor = computed(() => normalizeFolderSurfaceTextColor(props.textColor));
const normalizedTone = computed(() => normalizeFolderTone(props.tone));
const effectivePullDistance = computed(() => normalizeFolderPullDistance(props.pullDistance));
const activeEdge = computed(() => activeTab.value
  ? getTabEdge(activeTab.value)
  : tabList.normalizedEdge.value);

const visibleEdges = computed(() => new Set(tabList.visibleTabs.value.map((tab) => getTabEdge(tab))));

const hasMixedEdges = computed(() => visibleEdges.value.size > 1);

const binderOrientation = computed(() => getFolderTabOrientationForEdge(activeEdge.value));

const rootOrientation = computed(() => (
  hasMixedEdges.value ? tabList.normalizedOrientation.value : binderOrientation.value
));

const rootEdgeClassFlags = computed(() => (
  folderEdges.reduce<Record<string, boolean>>((classes, edge) => {
    classes[`folder-attachment--has-edge-${edge}`] = visibleEdges.value.has(edge);
    return classes;
  }, {})
));

const tabListAriaOrientation = computed(() => (
  hasMixedEdges.value ? undefined : binderOrientation.value
));

const requestedModelKey = computed(() => normalizeFolderTabKeyForLookup(props.modelValue));
const emulatedHoverKey = computed(() => normalizeFolderTabKeyForLookup(props.emulatedHoverKey));

const effectiveHoverKey = computed(() => hoveredKey.value ?? emulatedHoverKey.value);
const effectivePullDuration = computed(() => normalizeFolderMotionDuration(props.pullDuration));
const effectiveReturnDuration = computed(() => (
  props.returnDuration === undefined || props.returnDuration === null
    ? normalizeFolderMotionDuration(effectivePullDuration.value * defaultReturnDurationRatio)
    : normalizeFolderMotionDuration(props.returnDuration)
));

const motion = useFolderPullMachine({
  activeKey: tabList.activeKey,
  pullDuration: () => effectivePullDuration.value,
  returnDuration: () => effectiveReturnDuration.value,
  select: (key, tab) => {
    emit('update:modelValue', key);
    emit('activate', key, tab);
  },
});

const rootClasses = computed(() => [
  'folder-attachment',
  `folder-attachment--${rootOrientation.value}`,
  hasMixedEdges.value
    ? 'folder-attachment--mixed-edge'
    : `folder-attachment--edge-${activeEdge.value}`,
  `folder-attachment--active-edge-${activeEdge.value}`,
  `folder-attachment--density-${normalizedDensity.value}`,
  `folder-attachment--appearance-${normalizedAppearance.value}`,
  `folder-attachment--expand-${normalizedExpandOn.value}`,
  `folder-attachment--activation-${normalizedActivation.value}`,
  `folder-attachment--gravity-${normalizedGravity.value}`,
  `folder-attachment--stack-rotation-${normalizedStackRotation.value}`,
  `folder-attachment--tab-rotation-${normalizedTabRotation.value}`,
  `folder-attachment--texture-${normalizedTexture.value}`,
  ...normalizedTextureLayers.value.map((layer) => `folder-attachment--texture-layer-${layer}`),
  `folder-attachment--texture-blend-${normalizedTextureBlendMode.value}`,
  `folder-attachment--text-color-${normalizedTextColor.value}`,
  {
    'folder-attachment--hover-emulated': emulatedHoverKey.value !== null,
    'folder-attachment--tucked-tilt': normalizedStackRotation.value !== 'none',
    'is-pulled': motion.isPulled.value,
  },
  rootEdgeClassFlags.value,
]);

const rootStyle = computed(() => ({
  '--folder-motion-duration': `${effectivePullDuration.value}ms`,
  '--folder-motion-return-duration': `${effectiveReturnDuration.value}ms`,
  '--folder-motion-ease': 'cubic-bezier(0.32, 0, 0.2, 1)',
  '--folder-side-stack-reveal': `${Math.max(
    getFolderMinimumVisibleGrabSize('left'),
    getFolderMinimumVisibleGrabSize('right'),
  )}px`,
}));

const tabMeasurements = computed(() => tabList.visibleTabs.value.map((tab) => (
  measurements.value[String(tab.key)] ?? folderFallbackTabMeasurement
)));

const folderLayouts = computed<Record<string, FolderLayout>>(() => {
  const layouts: Record<string, FolderLayout> = {};

  for (const edge of folderEdges) {
    const edgeTabs = tabList.visibleTabs.value
      .map((tab, index) => ({ index, tab }))
      .filter(({ tab }) => getTabEdge(tab) === edge);

    if (edgeTabs.length === 0) {
      continue;
    }

    for (const gravity of folderGravities) {
      const groupTabs = edgeTabs.filter(({ tab }) => getTabGravity(tab) === gravity);

      if (groupTabs.length === 0) {
        continue;
      }

      const orientation = getFolderTabOrientationForEdge(edge);
      const activeGroupIndex = groupTabs.findIndex(({ tab }) => tabList.isActive(tab));
      const normalizedActiveIndex = Math.max(activeGroupIndex, 0);
      const expandedIndexes = groupTabs.flatMap(({ tab }, index) => (isTabExpanded(tab) ? [index] : []));
      const groupMeasurements = groupTabs.map(({ index }) => (
        tabMeasurements.value[index] ?? folderFallbackTabMeasurement
      ));
      const slots = getFolderStackSlots({
        activeIndex: normalizedActiveIndex,
        appearance: normalizedAppearance.value,
        density: normalizedDensity.value,
        expandedIndexes,
        measurements: groupMeasurements,
        orientation,
      });
      const groupSize = getFolderSlotGroupSize(slots, groupMeasurements, expandedIndexes, orientation);

      groupTabs.forEach(({ tab }, index) => {
        layouts[String(tab.key)] = {
          activeIndex: normalizedActiveIndex,
          edge,
          gravity,
          groupSize,
          index,
          orientation,
          slot: slots[index] ?? 0,
        };
      });
    }
  }

  return layouts;
});

const restingStackOrder = computed(() => {
  const orderedKeys = tabList.visibleTabs.value.map((tab) => String(tab.key));

  for (const key of selectionHistory.value) {
    const currentIndex = orderedKeys.indexOf(key);

    if (currentIndex === -1) {
      continue;
    }

    orderedKeys.splice(currentIndex, 1);
    orderedKeys.push(key);
  }

  return orderedKeys;
});

const restingStackIndexes = computed<Record<string, number>>(() => (
  restingStackOrder.value.reduce<Record<string, number>>((indexes, key, index) => {
    indexes[key] = index;
    return indexes;
  }, {})
));

const restingZIndexes = computed<Record<string, number>>(() => (
  restingStackOrder.value.reduce<Record<string, number>>((zIndexes, key, index) => {
    zIndexes[key] = folderPieceZ.restingBase + index;
    return zIndexes;
  }, {})
));

const activeRestingStackIndex = computed(() => {
  const activeKey = tabList.activeKey.value;

  if (!activeKey) {
    return Math.max(restingStackOrder.value.length - 1, 0);
  }

  return restingStackIndexes.value[activeKey] ?? Math.max(restingStackOrder.value.length - 1, 0);
});

watch(
  [tabList.activeKey, () => tabList.visibleTabs.value.map((tab) => String(tab.key)).join('\u0000')],
  syncSelectionHistory,
  { immediate: true },
);

watch(
  () => tabList.visibleTabs.value.map((tab) => String(tab.key)).join('\u0000'),
  pruneTabState,
);

onMounted(() => {
  isUnmounted = false;
  scheduleMeasure();
  window.addEventListener('resize', scheduleMeasure);
});

onUpdated(() => {
  scheduleMeasure();
});

onBeforeUnmount(() => {
  isUnmounted = true;
  cancelMeasureFrame();

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
    blockSize: readMeasuredSize(
      rect.height,
      readMeasuredSize(element.scrollHeight, folderFallbackTabMeasurement.compactBlockSize),
    ),
    inlineSize: readMeasuredSize(
      rect.width,
      readMeasuredSize(element.scrollWidth, folderFallbackTabMeasurement.compactInlineSize),
    ),
  };
}

function readMeasuredSize(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
        motion.selectFolder(nextTab);
      }
    }

    return;
  }

  if (normalizedActivation.value === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    event.stopPropagation();
    if (isCommittedActiveTab(tab)) {
      return;
    }

    motion.selectFolder(tab);
  }
}

function isTabOpen(tab: FolderTabItem): boolean {
  return motion.isPulledKey(tab.key) || motion.isPullingKey(tab.key) || motion.isHandoffKey(tab.key);
}

function isTabExpanded(tab: FolderTabItem): boolean {
  return normalizedExpandOn.value === 'always'
    || isTabOpen(tab)
    || (normalizedExpandOn.value === 'active' && tabList.isActive(tab))
    || (normalizedExpandOn.value === 'hover' && isHovered(tab))
    || (normalizedExpandOn.value === 'focus' && isFocused(tab));
}

function isReturning(tab: FolderTabItem): boolean {
  return motion.isReturningKey(tab.key);
}

function isTucked(tab: FolderTabItem): boolean {
  return !tabList.isActive(tab)
    && !motion.isSelectingKey(tab.key)
    && !motion.isPullingKey(tab.key)
    && !motion.isPulledKey(tab.key)
    && !isReturning(tab);
}

function isHovered(tab: FolderTabItem): boolean {
  return !tabList.isActive(tab) && effectiveHoverKey.value === String(tab.key) && !isFolderTabDisabled(tab);
}

function isFocused(tab: FolderTabItem): boolean {
  return !tabList.isActive(tab) && focusedKey.value === String(tab.key) && !isFolderTabDisabled(tab);
}

function isEmulatedHovered(tab: FolderTabItem): boolean {
  return hoveredKey.value === null && isHovered(tab);
}

function folderTone(tab: FolderTabItem): FolderTone {
  return normalizeFolderTone(tab.tone ?? normalizedTone.value);
}

function folderCustomColorStyle(tab: FolderTabItem): Record<string, string> {
  const style: Record<string, string> = {};
  const tint = normalizeFolderCustomColor(tab.tint);
  const accent = normalizeFolderCustomColor(tab.accent);

  if (tint) {
    style['--folder-tint'] = tint;
  }

  if (accent) {
    style['--folder-accent'] = accent;
  }

  return style;
}

function normalizeFolderCustomColor(color: unknown): string | null {
  return typeof color === 'string' && color.trim() !== ''
    ? color.trim()
    : null;
}

function folderClasses(tab: FolderTabItem): Array<string | Record<string, boolean>> {
  const layout = getFolderLayout(tab);

  return [
    'folder-attachment__folder',
    `folder-attachment__folder--${layout.orientation}`,
    `folder-attachment__folder--edge-${layout.edge}`,
    `folder-attachment__folder--gravity-${layout.gravity}`,
    {
      'is-active': tabList.isActive(tab),
      'is-disabled': isFolderTabDisabled(tab),
      'is-expanded': isTabExpanded(tab),
      'is-open': isTabOpen(tab),
      'is-pulled': motion.isPulledKey(tab.key),
      'is-pulling': motion.isPullingKey(tab.key),
      'is-returning': isReturning(tab),
      'is-selecting': motion.isSelectingKey(tab.key),
      'is-handoff': motion.isHandoffKey(tab.key),
      'is-tucked': isTucked(tab),
      'is-hovered': isHovered(tab),
      'is-focused': isFocused(tab),
      'folder-attachment__folder--hover-emulated': isEmulatedHovered(tab),
    },
  ];
}

function folderStyle(tab: FolderTabItem, index: number): Record<string, string | number> {
  const layout = getFolderLayout(tab);
  const restingStackIndex = restingStackIndexes.value[String(tab.key)] ?? layout.index;
  const restOffset = getFolderPieceTuckOffset(
    layout.edge,
    restingStackIndex,
    activeRestingStackIndex.value,
    normalizedDensity.value,
  );
  const hoverOffset = getFolderHoverOffset(layout.edge);
  const pullOffset = getFolderPullOffset(layout.edge, effectivePullDistance.value);
  const zIndex = getPieceZIndex(tab, index);
  const measurement = measurements.value[String(tab.key)] ?? folderFallbackTabMeasurement;
  const compactSize = getCompactSize(measurement, layout.orientation);
  const isActive = tabList.isActive(tab);
  const actualOffset = getFolderActualOffset(tab, isActive, restOffset, pullOffset);
  const rotation = getFolderPieceRotation(tab, layout.edge, restingStackIndex, isActive);
  const tuckedDistance = isActive ? 0 : Math.max(Math.abs(restOffset.x), Math.abs(restOffset.y));
  const coverDistance = isActive ? 0 : getActiveFolderCoverDistance(layout.edge);
  const minimumVisibleGrabSize = getFolderMinimumVisibleGrabSize(layout.edge);
  const minimumGrabSize = isActive
    ? compactSize
    : getFolderMinimumGrabSize(compactSize, minimumVisibleGrabSize);
  const reachSize = getFolderTabReachSize(compactSize, tuckedDistance, minimumGrabSize, coverDistance);
  const grabSize = compactSize;

  return {
    '--folder-piece-index': index,
    '--folder-piece-slot': `${layout.slot.toFixed(2)}px`,
    '--folder-tab-group-size': `${layout.groupSize.toFixed(2)}px`,
    '--folder-piece-x': `${actualOffset.x.toFixed(2)}px`,
    '--folder-piece-y': `${actualOffset.y.toFixed(2)}px`,
    '--folder-piece-rotate': `${rotation.toFixed(2)}deg`,
    '--folder-tab-piece-rotate': `${rotation.toFixed(2)}deg`,
    '--folder-tab-counter-rotate': `${(-rotation).toFixed(2)}deg`,
    '--folder-piece-rest-x': `${restOffset.x.toFixed(2)}px`,
    '--folder-piece-rest-y': `${restOffset.y.toFixed(2)}px`,
    '--folder-tab-hover-x': `${hoverOffset.x.toFixed(2)}px`,
    '--folder-tab-hover-y': `${hoverOffset.y.toFixed(2)}px`,
    '--folder-piece-pull-x': `${pullOffset.x.toFixed(2)}px`,
    '--folder-piece-pull-y': `${pullOffset.y.toFixed(2)}px`,
    '--folder-attached-tab-grab-size': `${grabSize.toFixed(2)}px`,
    '--folder-attached-tab-reach-size': `${reachSize.toFixed(2)}px`,
    '--folder-piece-z': zIndex,
    ...folderCustomColorStyle(tab),
  };
}

function getFolderPieceRotation(
  tab: FolderTabItem,
  edge: FolderTabEdge,
  restingStackIndex: number,
  isActive: boolean,
): number {
  if (
    normalizedStackRotation.value === 'none'
    || isActive
    || motion.isSelectingKey(tab.key)
    || motion.isPullingKey(tab.key)
    || motion.isPulledKey(tab.key)
    || motion.isHandoffKey(tab.key)
  ) {
    return 0;
  }

  return getFolderTuckRotation(edge, restingStackIndex, activeRestingStackIndex.value);
}

function getFolderActualOffset(
  tab: FolderTabItem,
  isActive: boolean,
  restOffset: { x: number; y: number },
  pullOffset: { x: number; y: number },
): { x: number; y: number } {
  if (
    motion.isSelectingKey(tab.key)
    || motion.isPullingKey(tab.key)
    || motion.isPulledKey(tab.key)
  ) {
    return pullOffset;
  }

  if (isActive) {
    return { x: 0, y: 0 };
  }

  return restOffset;
}

function tabStyle(tab: FolderTabItem): Record<string, string | number> {
  const layout = getFolderLayout(tab);
  const measurement = measurements.value[String(tab.key)] ?? folderFallbackTabMeasurement;
  const compactSize = getCompactSize(measurement, layout.orientation);
  const openSize = Math.max(measurement.openInlineSize, compactSize);

  return {
    '--folder-tab-slot': `${layout.slot.toFixed(2)}px`,
    '--folder-attached-tab-compact-size': `${compactSize.toFixed(2)}px`,
    '--folder-attached-tab-open-size': `${openSize.toFixed(2)}px`,
  };
}

function getFolderLayout(tab: FolderTabItem): FolderLayout {
  return folderLayouts.value[String(tab.key)] ?? {
    activeIndex: activeIndex.value,
    edge: tabList.normalizedEdge.value,
    gravity: getTabGravity(tab),
    groupSize: 0,
    index: tabList.visibleTabs.value.findIndex((candidate) => String(candidate.key) === String(tab.key)),
    orientation: tabList.normalizedOrientation.value,
    slot: 0,
  };
}

function getTabEdge(tab: FolderTabItem): FolderTabEdge {
  return normalizeFolderTabEdge(tab.edge ?? props.edge, tabList.normalizedOrientation.value);
}

function getTabGravity(tab: FolderTabItem): FolderTabGravity {
  if (tab.gravity !== undefined) {
    return normalizeFolderTabGravity(tab.gravity);
  }

  const fallbackGravity = normalizeFolderTabGravity(props.gravity);
  return fallbackGravity === 'center' ? 'start' : fallbackGravity;
}

function getFolderSlotGroupSize(
  slots: readonly number[],
  groupMeasurements: readonly FolderTabMeasurement[],
  expandedIndexes: readonly number[],
  orientation: FolderTabOrientation,
): number {
  const expandedIndexSet = new Set(expandedIndexes);

  return groupMeasurements.reduce((size, measurement, index) => {
    const compactSize = getCompactSize(measurement, orientation);
    const tabSize = expandedIndexSet.has(index)
      ? Math.max(measurement.openInlineSize, compactSize)
      : compactSize;

    return Math.max(size, (slots[index] ?? 0) + tabSize);
  }, 0);
}

function getActiveFolderCoverDistance(edge: FolderTabEdge): number {
  const active = activeTab.value;

  if (!active) {
    return 0;
  }

  const edgeVector = getFolderEdgeVector(edge);
  const activePull = getFolderPullOffset(getTabEdge(active), effectivePullDistance.value);
  const projectedCover = (activePull.x * edgeVector.x) + (activePull.y * edgeVector.y);

  return Math.max(projectedCover, 0);
}

function getPieceZIndex(tab: FolderTabItem, index: number): number {
  if (motion.isFrontKey(tab.key)) {
    return folderPieceZ.front;
  }

  if (motion.isSelectingKey(tab.key)) {
    return folderPieceZ.selecting;
  }

  if (motion.isPullingKey(tab.key)) {
    return folderPieceZ.pulling;
  }

  if (motion.isPulledKey(tab.key)) {
    return folderPieceZ.pulled;
  }

  if (isReturning(tab)) {
    return folderPieceZ.returning;
  }

  if (tabList.isActive(tab)) {
    return folderPieceZ.active;
  }

  return restingZIndexes.value[String(tab.key)] ?? folderPieceZ.restingBase + index;
}

function syncSelectionHistory(): void {
  const visibleKeys = new Set(tabList.visibleTabs.value.map((tab) => String(tab.key)));
  const activeKey = tabList.activeKey.value;
  const nextHistory = selectionHistory.value.filter((key) => visibleKeys.has(key));

  if (activeKey && visibleKeys.has(activeKey)) {
    const existingIndex = nextHistory.indexOf(activeKey);

    if (existingIndex !== -1) {
      nextHistory.splice(existingIndex, 1);
    }

    nextHistory.push(activeKey);
  }

  if (nextHistory.join('\u0000') !== selectionHistory.value.join('\u0000')) {
    selectionHistory.value = nextHistory;
  }
}

function pruneTabState(): void {
  const visibleKeys = new Set(tabList.visibleTabs.value.map((tab) => String(tab.key)));

  pruneTransientKeys(visibleKeys);
  pruneMeasurementState(visibleKeys);
}

function pruneTransientKeys(visibleKeys: Set<string>): void {
  if (hoveredKey.value && !visibleKeys.has(hoveredKey.value)) {
    hoveredKey.value = null;
  }

  if (focusedKey.value && !visibleKeys.has(focusedKey.value)) {
    focusedKey.value = null;
  }
}

function pruneMeasurementState(visibleKeys: Set<string>): void {
  for (const key of measurementRefs.keys()) {
    if (!visibleKeys.has(key)) {
      measurementRefs.delete(key);
    }
  }

  let prunedMeasurements: Record<string, FolderTabMeasurement> | null = null;

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

function selectFolder(tab: FolderTabItem): void {
  if (isFolderTabDisabled(tab)) {
    return;
  }

  if (isCommittedActiveTab(tab)) {
    return;
  }

  tabList.focusedKey.value = String(tab.key);
  motion.selectFolder(tab);
}

function isCommittedActiveTab(tab: FolderTabItem): boolean {
  const normalizedKey = String(tab.key);

  return tabList.isActive(tab) && requestedModelKey.value === normalizedKey;
}

function setHoveredTab(tab: FolderTabItem): void {
  if (!isFolderTabDisabled(tab)) {
    hoveredKey.value = String(tab.key);
  }
}

function clearHoveredTab(tab: FolderTabItem): void {
  if (hoveredKey.value === String(tab.key)) {
    hoveredKey.value = null;
  }
}

function setFocusedTab(tab: FolderTabItem): void {
  if (!isFolderTabDisabled(tab)) {
    focusedKey.value = String(tab.key);
  }
}

function clearFocusedTab(tab: FolderTabItem): void {
  if (focusedKey.value === String(tab.key)) {
    focusedKey.value = null;
  }
}
</script>

<template>
  <section :class="rootClasses" :style="rootStyle">
    <FolderBinder
      class="folder-attachment__binder"
      :style="rootStyle"
      :orientation="binderOrientation"
      :edge="activeEdge"
      :depth="normalizedDepth"
      :layers="props.layers"
      :active-index="activeIndex"
      :tone="normalizedTone"
      :texture="normalizedTexture"
      :texture-layers="normalizedTextureLayers"
      :texture-blend-mode="normalizedTextureBlendMode"
      :text-color="normalizedTextColor"
      :pulled="motion.isPulled.value"
    >
      <div
        class="folder-attachment__stack"
        role="tablist"
        :aria-orientation="tabListAriaOrientation"
        :aria-label="props.ariaLabel"
      >
        <Folder
          v-for="(tab, tabIndex) in tabList.visibleTabs.value"
          :key="tab.key"
          :class="folderClasses(tab)"
          :style="folderStyle(tab, tabIndex)"
          :tone="folderTone(tab)"
          :texture="normalizedTexture"
          :texture-layers="normalizedTextureLayers"
          :texture-blend-mode="normalizedTextureBlendMode"
          :text-color="normalizedTextColor"
        >
          <div class="folder-attachment__sheet" aria-hidden="true" />

          <button
            :ref="(element) => tabList.setTabRef(tab.key, element)"
            type="button"
            class="folder-attachment__tab"
            :class="{
              'is-active': tabList.isActive(tab),
              'is-disabled': isFolderTabDisabled(tab),
              'is-open': isTabOpen(tab),
              'is-expanded': isTabExpanded(tab),
              'is-pulled': motion.isPulledKey(tab.key),
              'is-pulling': motion.isPullingKey(tab.key),
              'is-returning': isReturning(tab),
              'is-selecting': motion.isSelectingKey(tab.key),
              'is-handoff': motion.isHandoffKey(tab.key),
              'is-hovered': isHovered(tab),
              'is-focused': isFocused(tab),
              'folder-attachment__tab--hover-emulated': isEmulatedHovered(tab),
              'folder-attachment__tab--has-total': hasLimitedFolderTabTotal(tab),
            }"
            :style="tabStyle(tab)"
            :id="tabList.tabId(tab)"
            role="tab"
            :aria-selected="tabList.isActive(tab)"
            :aria-controls="tabList.panelId(tab)"
            :aria-label="tabList.tabAriaLabel(tab)"
            :aria-disabled="isFolderTabDisabled(tab) || undefined"
            :tabindex="tabList.isTabbable(tab) ? 0 : -1"
            @click="selectFolder(tab)"
            @blur="clearFocusedTab(tab)"
            @focus="setFocusedTab(tab)"
            @keydown="handleKeydown($event, tab)"
            @pointerenter="setHoveredTab(tab)"
            @pointerleave="clearHoveredTab(tab)"
          >
            <span class="folder-attachment__tab-icon" aria-hidden="true">
              <slot name="icon" :tab="tab" :active="tabList.isActive(tab)">
                <component :is="getFolderTabIcon(tab)" v-if="hasFolderTabIcon(tab)" />
              </slot>
            </span>
            <span class="folder-attachment__tab-label">{{ tabList.getFolderTabDisplayLabel(tab) }}</span>
            <span v-if="hasFolderTabCount(tab)" class="folder-attachment__tab-count">
              {{ tabList.getFolderTabCountLabel(tab) }}
            </span>
            <span v-if="hasLimitedFolderTabTotal(tab)" class="folder-attachment__tab-lock" aria-hidden="true">
              /{{ tabList.getFolderTabTotalCountLabel(tab) }}
            </span>
          </button>

          <div
            :id="tabList.panelId(tab)"
            :class="['folder-attachment__content', props.folderClass]"
            role="tabpanel"
            :aria-labelledby="tabList.tabId(tab)"
            :hidden="!tabList.isActive(tab)"
          >
            <slot
              v-if="tabList.isActive(tab)"
              :active-tab="activeTab"
              :active-index="activeIndex"
              :pulled="motion.isPulled.value"
            />
          </div>
        </Folder>
      </div>
    </FolderBinder>

    <div class="folder-attachment__measurer" aria-hidden="true" inert>
      <template v-for="tab in tabList.visibleTabs.value" :key="tab.key">
        <button
          :ref="(element) => setMeasurementRef(tab.key, 'compact', element)"
          type="button"
          class="folder-attachment__measure-tab folder-attachment__measure-tab--compact"
          tabindex="-1"
        >
          <span class="folder-attachment__tab-icon" aria-hidden="true">
            <component :is="getFolderTabIcon(tab)" v-if="hasFolderTabIcon(tab)" />
          </span>
        </button>

        <button
          :ref="(element) => setMeasurementRef(tab.key, 'open', element)"
          type="button"
          class="folder-attachment__measure-tab folder-attachment__measure-tab--open"
          tabindex="-1"
        >
          <span class="folder-attachment__tab-icon" aria-hidden="true">
            <component :is="getFolderTabIcon(tab)" v-if="hasFolderTabIcon(tab)" />
          </span>
          <span class="folder-attachment__tab-label">{{ tabList.getFolderTabDisplayLabel(tab) }}</span>
          <span v-if="hasFolderTabCount(tab)" class="folder-attachment__tab-count">
            {{ tabList.getFolderTabCountLabel(tab) }}
          </span>
          <span v-if="hasLimitedFolderTabTotal(tab)" class="folder-attachment__tab-lock" aria-hidden="true">
            /{{ tabList.getFolderTabTotalCountLabel(tab) }}
          </span>
        </button>
      </template>
    </div>
  </section>
</template>
