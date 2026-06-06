import type {
  FolderTabAppearance,
  FolderTabDensity,
  FolderTabEdge,
  FolderTabOrientation,
} from './folderTabs';
import {
  normalizeFolderTabAppearance,
  normalizeFolderTabDensity,
  normalizeFolderTabOrientation,
} from './folderTabs';

export interface FolderEdgeVector {
  axis: 'x' | 'y';
  sign: -1 | 1;
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

export interface FolderTabMeasurement {
  compactBlockSize: number;
  compactInlineSize: number;
  openInlineSize: number;
}

export interface FolderStackSlotOptions {
  activeIndex: number;
  appearance: FolderTabAppearance;
  density: FolderTabDensity;
  expandedIndexes?: readonly number[];
  measurements: readonly FolderTabMeasurement[];
  orientation: FolderTabOrientation;
}

export const folderFallbackTabMeasurement: FolderTabMeasurement = {
  compactBlockSize: 44,
  compactInlineSize: 44,
  openInlineSize: 156,
};

export const folderMinimumVisibleGrabSize = 52;
export const folderSideMinimumVisibleGrabSize = 120;
export const folderTuckBaseDistance = 8;
export const folderTuckDepthStep = 7;
export const folderDenseTuckBaseDistance = 7;
export const folderDenseTuckDepthStep = 5;
export const folderTuckRotationBaseDegrees = 0.42;
export const folderTuckRotationStepDegrees = 0.18;
export const folderTuckRotationMaxDegrees = 1.35;

export function getFolderEdgeVector(edge: FolderTabEdge): FolderEdgeVector {
  if (edge === 'left') {
    return { axis: 'x', sign: -1, x: -1, y: 0 };
  }

  if (edge === 'right') {
    return { axis: 'x', sign: 1, x: 1, y: 0 };
  }

  if (edge === 'bottom') {
    return { axis: 'y', sign: 1, x: 0, y: 1 };
  }

  return { axis: 'y', sign: -1, x: 0, y: -1 };
}

export function getFolderDensityOverlap(
  density: FolderTabDensity,
  _appearance: FolderTabAppearance,
): number {
  const normalizedDensity = normalizeFolderTabDensity(density);

  if (normalizedDensity === 'dense') {
    return 18;
  }

  if (normalizedDensity === 'overlap') {
    return 10;
  }

  return 0;
}

export function getFolderStackSlots(options: FolderStackSlotOptions): number[] {
  const activeIndex = normalizeFolderIndex(options.activeIndex);
  const orientation = normalizeFolderTabOrientation(options.orientation);
  const overlap = getFolderDensityOverlap(
    normalizeFolderTabDensity(options.density),
    normalizeFolderTabAppearance(options.appearance),
  );
  const expandedIndexes = new Set(
    (options.expandedIndexes ?? [activeIndex]).map(normalizeFolderIndex),
  );
  let position = 0;

  return options.measurements.map((measurement, index) => {
    const compactSize = getCompactSize(measurement, orientation);
    const compactStep = Math.max(compactSize - overlap, 18);
    const slot = position;
    const openSize = Math.max(readMeasurementSize(measurement.openInlineSize, compactSize), compactSize);

    position += expandedIndexes.has(index)
      ? Math.max(openSize, compactStep)
      : compactStep;

    return slot;
  });
}

export function getCompactSize(
  measurement: FolderTabMeasurement | undefined,
  orientation: FolderTabOrientation,
): number {
  const fallback = folderFallbackTabMeasurement;
  const normalizedOrientation = normalizeFolderTabOrientation(orientation);
  const size = normalizedOrientation === 'vertical'
    ? measurement?.compactBlockSize
    : measurement?.compactInlineSize;

  const fallbackSize = normalizedOrientation === 'vertical'
    ? fallback.compactBlockSize
    : fallback.compactInlineSize;

  return Math.max(readMeasurementSize(size, fallbackSize), 32);
}

export function getFolderTabReachSize(
  compactSize: number,
  tuckedDistance: number,
  minimumGrabSize = compactSize,
  occludingDistance = 0,
): number {
  const normalizedCompactSize = normalizePositiveNumber(compactSize);
  const normalizedTuckedDistance = normalizePositiveNumber(tuckedDistance);
  const normalizedMinimumGrabSize = normalizePositiveNumber(minimumGrabSize);
  const normalizedOccludingDistance = normalizePositiveNumber(occludingDistance);

  return Math.max(
    normalizedCompactSize,
    normalizedTuckedDistance + normalizedOccludingDistance + normalizedMinimumGrabSize,
  );
}

export function getFolderVisibleGrabSize(
  reachSize: number,
  tuckedDistance: number,
  occludingDistance = 0,
): number {
  return Math.max(
    normalizePositiveNumber(reachSize)
      - normalizePositiveNumber(tuckedDistance)
      - normalizePositiveNumber(occludingDistance),
    0,
  );
}

export function getFolderMinimumGrabSize(
  compactSize: number,
  minimumVisibleSize = folderMinimumVisibleGrabSize,
): number {
  return Math.max(
    normalizePositiveNumber(compactSize),
    normalizePositiveNumber(minimumVisibleSize),
  );
}

export function getFolderMinimumVisibleGrabSize(edge: FolderTabEdge): number {
  return edge === 'left' || edge === 'right'
    ? folderSideMinimumVisibleGrabSize
    : folderMinimumVisibleGrabSize;
}

export function getFolderPieceTuckOffset(
  edge: FolderTabEdge,
  index: number,
  activeIndex: number,
  density: FolderTabDensity,
): { x: number; y: number } {
  const vector = getFolderEdgeVector(edge);
  const distance = Math.min(Math.abs(normalizeFolderIndex(index) - normalizeFolderIndex(activeIndex)), 6);
  const isDense = normalizeFolderTabDensity(density) === 'dense';
  const base = isDense ? folderDenseTuckBaseDistance : folderTuckBaseDistance;
  const step = isDense ? folderDenseTuckDepthStep : folderTuckDepthStep;
  const amount = base + (distance * step);

  return {
    x: vector.x === 0 ? 0 : vector.x * amount * -1,
    y: vector.y === 0 ? 0 : vector.y * amount * -1,
  };
}

export function getFolderTuckRotation(edge: FolderTabEdge, index: number, activeIndex: number): number {
  const distance = Math.min(Math.abs(normalizeFolderIndex(index) - normalizeFolderIndex(activeIndex)), 6);

  if (distance === 0) {
    return 0;
  }

  const stackSign = normalizeFolderIndex(index) % 2 === 0 ? -1 : 1;
  const edgeMirror = edge === 'right' || edge === 'bottom' ? -1 : 1;
  const amount = Math.min(
    folderTuckRotationBaseDegrees + (distance * folderTuckRotationStepDegrees),
    folderTuckRotationMaxDegrees,
  );

  return roundToPrecision(amount * stackSign * edgeMirror, 2);
}

export function getFolderPullOffset(edge: FolderTabEdge): { x: number; y: number } {
  const vector = getFolderEdgeVector(edge);

  return {
    x: vector.x === 0 ? 0 : vector.x * 8,
    y: vector.y === 0 ? 0 : vector.y * 8,
  };
}

export function getFolderHoverOffset(edge: FolderTabEdge): { x: number; y: number } {
  const vector = getFolderEdgeVector(edge);
  const amount = 6;

  return {
    x: vector.x === 0 ? 0 : vector.x * amount,
    y: vector.y === 0 ? 0 : vector.y * amount,
  };
}

function normalizeFolderIndex(value: number): number {
  return Math.max(Math.round(normalizePositiveNumber(value)), 0);
}

function normalizePositiveNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function roundToPrecision(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function readMeasurementSize(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0
    ? Number(value)
    : fallback;
}
