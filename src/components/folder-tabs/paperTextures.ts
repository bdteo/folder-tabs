function getFolderPaperAssetUrl(filename: string): string {
  const moduleUrl = import.meta.url;
  const baseUrl = moduleUrl.endsWith('/')
    ? moduleUrl
    : moduleUrl.slice(0, moduleUrl.lastIndexOf('/') + 1);

  return `${baseUrl}assets/paper/${filename}`;
}

const paper03HybridStrongRepeatUrl = getFolderPaperAssetUrl(
  '03-fibrous-cotton-rag-hybrid-strong-2048-repeat-3x3.png',
);
const paper03HybridStrongTileUrl = getFolderPaperAssetUrl(
  '03-fibrous-cotton-rag-hybrid-strong-2048-tile.png',
);
const paper03HybridStrongDensity4Url = getFolderPaperAssetUrl(
  '03-fibrous-cotton-rag-hybrid-strong-512-density4-tile.png',
);
const paper03HybridStrongDensity9Url = getFolderPaperAssetUrl(
  '03-fibrous-cotton-rag-hybrid-strong-228-density9-tile.png',
);
const paper05HybridStrongRepeatUrl = getFolderPaperAssetUrl(
  '05-creamy-fine-tooth-hybrid-strong-2048-repeat-3x3.png',
);
const paper05HybridStrongTileUrl = getFolderPaperAssetUrl(
  '05-creamy-fine-tooth-hybrid-strong-2048-tile.png',
);
const paper05HybridStrongDensity4Url = getFolderPaperAssetUrl(
  '05-creamy-fine-tooth-hybrid-strong-512-density4-tile.png',
);
const paper05HybridStrongDensity9Url = getFolderPaperAssetUrl(
  '05-creamy-fine-tooth-hybrid-strong-228-density9-tile.png',
);
const watercolorPaperUrl = getFolderPaperAssetUrl('paper-watercolor-rough.jpg');

export type FolderPaperTexturePresetKey =
  | 'watercolor'
  | 'paper03HybridStrong'
  | 'paper03HybridStrongRepeat'
  | 'paper03HybridStrongDensity4'
  | 'paper03HybridStrongDensity9'
  | 'paper05HybridStrong'
  | 'paper05HybridStrongRepeat'
  | 'paper05HybridStrongDensity4'
  | 'paper05HybridStrongDensity9';

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
    filter: 'contrast(1.55) brightness(0.92) saturate(0.88)',
    sheetOpacity: '0.74',
    contentOpacity: '0.48',
    tabOpacity: '0.62',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.08), rgba(12, 11, 10, 0.05))',
  },
  paper03HybridStrongRepeat: {
    key: 'paper03HybridStrongRepeat',
    label: '#3 repeat',
    url: paper03HybridStrongRepeatUrl,
    size: '36rem 36rem',
    filter: 'contrast(1.45) brightness(0.94) saturate(0.9)',
    sheetOpacity: '0.7',
    contentOpacity: '0.44',
    tabOpacity: '0.58',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.08), rgba(12, 11, 10, 0.05))',
  },
  paper03HybridStrongDensity4: {
    key: 'paper03HybridStrongDensity4',
    label: '#3 dense 4x',
    url: paper03HybridStrongDensity4Url,
    size: '512px 512px',
    filter: 'contrast(1.55) brightness(0.92) saturate(0.88)',
    sheetOpacity: '0.74',
    contentOpacity: '0.48',
    tabOpacity: '0.62',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.08), rgba(12, 11, 10, 0.05))',
  },
  paper03HybridStrongDensity9: {
    key: 'paper03HybridStrongDensity9',
    label: '#3 dense 9x',
    url: paper03HybridStrongDensity9Url,
    size: '228px 228px',
    filter: 'contrast(1.5) brightness(0.93) saturate(0.88)',
    sheetOpacity: '0.72',
    contentOpacity: '0.46',
    tabOpacity: '0.6',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.08), rgba(12, 11, 10, 0.05))',
  },
  paper05HybridStrong: {
    key: 'paper05HybridStrong',
    label: '#5 strong tile',
    url: paper05HybridStrongTileUrl,
    size: '24rem 24rem',
    filter: 'contrast(1.7) brightness(0.9) saturate(0.86)',
    sheetOpacity: '0.72',
    contentOpacity: '0.46',
    tabOpacity: '0.6',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.1), rgba(12, 11, 10, 0.06))',
  },
  paper05HybridStrongRepeat: {
    key: 'paper05HybridStrongRepeat',
    label: '#5 repeat',
    url: paper05HybridStrongRepeatUrl,
    size: '36rem 36rem',
    filter: 'contrast(1.55) brightness(0.92) saturate(0.88)',
    sheetOpacity: '0.68',
    contentOpacity: '0.42',
    tabOpacity: '0.56',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.1), rgba(12, 11, 10, 0.06))',
  },
  paper05HybridStrongDensity4: {
    key: 'paper05HybridStrongDensity4',
    label: '#5 dense 4x',
    url: paper05HybridStrongDensity4Url,
    size: '512px 512px',
    filter: 'contrast(1.7) brightness(0.9) saturate(0.86)',
    sheetOpacity: '0.72',
    contentOpacity: '0.46',
    tabOpacity: '0.6',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.1), rgba(12, 11, 10, 0.06))',
  },
  paper05HybridStrongDensity9: {
    key: 'paper05HybridStrongDensity9',
    label: '#5 dense 9x',
    url: paper05HybridStrongDensity9Url,
    size: '228px 228px',
    filter: 'contrast(1.62) brightness(0.92) saturate(0.86)',
    sheetOpacity: '0.7',
    contentOpacity: '0.44',
    tabOpacity: '0.58',
    wash: 'linear-gradient(135deg, rgba(30, 27, 22, 0.1), rgba(12, 11, 10, 0.06))',
  },
} satisfies Record<FolderPaperTexturePresetKey, FolderPaperTexturePreset>;

export const folderPaperTexturePresetOptions = Object.values(folderPaperTexturePresets);

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
