import type {
  FolderTabAppearance,
  FolderTabDensity,
  FolderTabEdge,
  FolderTabOrientation,
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
  appearance: FolderTabAppearance,
): number {
  if (density === 'dense') {
    return 18;
  }

  if (density === 'overlap' || appearance === 'stack') {
    return 10;
  }

  return 0;
}

export function getFolderStackSlots(options: FolderStackSlotOptions): number[] {
  const activeIndex = Math.max(Math.round(options.activeIndex), 0);
  const overlap = getFolderDensityOverlap(options.density, options.appearance);
  const expandedIndexes = new Set(
    (options.expandedIndexes ?? [activeIndex]).map((index) => Math.max(Math.round(index), 0)),
  );
  let position = 0;

  return options.measurements.map((measurement, index) => {
    const compactSize = getCompactSize(measurement, options.orientation);
    const compactStep = Math.max(compactSize - overlap, 18);
    const slot = position;
    const openSize = Math.max(measurement.openInlineSize, compactSize);

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
  const size = orientation === 'vertical'
    ? measurement?.compactBlockSize
    : measurement?.compactInlineSize;

  return Math.max(size || getCompactSize(fallback, orientation), 32);
}

export function getFolderPieceTuckOffset(
  edge: FolderTabEdge,
  index: number,
  activeIndex: number,
  density: FolderTabDensity,
): { x: number; y: number } {
  const vector = getFolderEdgeVector(edge);
  const distance = Math.min(Math.abs(index - activeIndex), 6);
  const base = density === 'dense' ? 6 : 7;
  const amount = base + (distance * 2);

  return {
    x: vector.x * amount * -1,
    y: vector.y * amount * -1,
  };
}

export function getFolderPullOffset(edge: FolderTabEdge): { x: number; y: number } {
  const vector = getFolderEdgeVector(edge);

  return {
    x: vector.x * 8,
    y: vector.y * 8,
  };
}

export function getFolderHoverOffset(_edge: FolderTabEdge): { x: number; y: number } {
  return {
    x: 0,
    y: 0,
  };
}
