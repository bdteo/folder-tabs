function getFolderPaperAssetUrl(filename: string): string {
  const moduleUrl = import.meta.url;
  const baseUrl = moduleUrl.endsWith('/')
    ? moduleUrl
    : moduleUrl.slice(0, moduleUrl.lastIndexOf('/') + 1);

  return `${baseUrl}assets/paper/${filename}`;
}

const paper03HybridStrongTileUrl = getFolderPaperAssetUrl(
  '03-fibrous-cotton-rag-hybrid-strong-2048-tile.png',
);
const paper05HybridStrongTileUrl = getFolderPaperAssetUrl(
  '05-creamy-fine-tooth-hybrid-strong-2048-tile.png',
);
const watercolorPaperUrl = getFolderPaperAssetUrl('paper-watercolor-rough.jpg');

export type FolderPaperTexturePresetKey =
  | 'watercolor'
  | 'paper03HybridStrong'
  | 'paper03HybridStrongRepeat'
  | 'paper05HybridStrong'
  | 'paper05HybridStrongRepeat';

export type FolderPaperTextureStyle = Partial<Record<
  | '--folder-paper-texture-custom'
  | '--folder-paper-texture-size-custom'
  | '--folder-paper-filter-custom'
  | '--folder-paper-sheet-opacity-custom'
  | '--folder-paper-content-opacity-custom'
  | '--folder-paper-tab-opacity-custom',
  string
>>;

export interface FolderPaperTexturePreset {
  key: FolderPaperTexturePresetKey;
  label: string;
  url: string;
  size: string;
  filter: string;
  sheetOpacity: string;
  contentOpacity: string;
  tabOpacity: string;
  wash: string;
}

export const folderPaperTexturePresets = {
  watercolor: {
    key: 'watercolor',
    label: 'Watercolor paper',
    url: watercolorPaperUrl,
    size: '24rem 24rem',
    filter: 'contrast(2.2) brightness(0.96) saturate(0.86)',
    sheetOpacity: '0.86',
    contentOpacity: '0.58',
    tabOpacity: '0.74',
    wash: 'linear-gradient(135deg, rgba(32, 29, 24, 0.12), rgba(12, 11, 10, 0.08))',
  },
  paper03HybridStrong: {
    key: 'paper03HybridStrong',
    label: '#3 strong tile',
    url: paper03HybridStrongTileUrl,
    size: '24rem 24rem',
    filter: 'contrast(1.72) brightness(0.93) saturate(0.8)',
    sheetOpacity: '0.74',
    contentOpacity: '0.48',
    tabOpacity: '0.62',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.08), rgba(12, 11, 10, 0.05))',
  },
  paper03HybridStrongRepeat: {
    key: 'paper03HybridStrongRepeat',
    label: '#3 strong tile',
    url: paper03HybridStrongTileUrl,
    size: '24rem 24rem',
    filter: 'contrast(1.72) brightness(0.93) saturate(0.8)',
    sheetOpacity: '0.74',
    contentOpacity: '0.48',
    tabOpacity: '0.62',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.08), rgba(12, 11, 10, 0.05))',
  },
  paper05HybridStrong: {
    key: 'paper05HybridStrong',
    label: '#5 strong tile',
    url: paper05HybridStrongTileUrl,
    size: '24rem 24rem',
    filter: 'contrast(1.85) brightness(0.92) saturate(0.72)',
    sheetOpacity: '0.72',
    contentOpacity: '0.46',
    tabOpacity: '0.6',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.1), rgba(12, 11, 10, 0.06))',
  },
  paper05HybridStrongRepeat: {
    key: 'paper05HybridStrongRepeat',
    label: '#5 strong tile',
    url: paper05HybridStrongTileUrl,
    size: '24rem 24rem',
    filter: 'contrast(1.85) brightness(0.92) saturate(0.72)',
    sheetOpacity: '0.72',
    contentOpacity: '0.46',
    tabOpacity: '0.6',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.1), rgba(12, 11, 10, 0.06))',
  },
} satisfies Record<FolderPaperTexturePresetKey, FolderPaperTexturePreset>;

export const folderPaperTexturePresetOptions = [
  folderPaperTexturePresets.watercolor,
  folderPaperTexturePresets.paper03HybridStrong,
  folderPaperTexturePresets.paper05HybridStrong,
];

export function getFolderPaperTexturePreset(
  key: FolderPaperTexturePresetKey | string | null | undefined,
): FolderPaperTexturePreset | null {
  if (!key || !(key in folderPaperTexturePresets)) {
    return null;
  }

  return folderPaperTexturePresets[key as FolderPaperTexturePresetKey];
}

export function getFolderPaperTextureStyle(
  key: FolderPaperTexturePresetKey | string | null | undefined,
): FolderPaperTextureStyle {
  const preset = getFolderPaperTexturePreset(key);

  if (!preset) {
    return {};
  }

  return {
    '--folder-paper-texture-custom': [
      preset.wash,
      `url("${preset.url}")`,
    ].join(', '),
    '--folder-paper-texture-size-custom': `auto, ${preset.size}`,
    '--folder-paper-filter-custom': preset.filter,
    '--folder-paper-sheet-opacity-custom': preset.sheetOpacity,
    '--folder-paper-content-opacity-custom': preset.contentOpacity,
    '--folder-paper-tab-opacity-custom': preset.tabOpacity,
  };
}
