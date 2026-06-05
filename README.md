# FolderTabs

Tactile folder/index tabs for Vue. FolderTabs turns ordinary tablists into a
physical stack: icon-only at rest, label expansion on the active tab or
interaction, orientation-aware label rotation, optional overlap, and accessible
keyboard navigation.

![FolderTabs desktop demo](docs/screenshots/demo-desktop.png)

This project started as a production component in Hammergebot, then became a
generic Vue primitive that can be installed as a package or copied into an app
in the spirit of shadcn-vue.

## Why This Exists

Most tab components are abstract strips. FolderTabs is meant for interfaces
where sections should feel like physical dividers: media galleries, document
review, research dossiers, audits, dashboards, notebooks, and anything that
benefits from a compact but memorable navigation object.

## Features

- Vue 3 component with `v-model`.
- Horizontal and vertical orientation.
- Edge-aware behavior: `top`, `bottom`, `left`, or `right`.
- Icon-only resting state with active, hover, or focus expansion.
- Density modes for physical overlap: `spread`, `overlap`, `dense`.
- Stack appearance for vertical, physical folder-divider layouts.
- `FolderAttachment` composition where every folder owns its tab handle and content surface as one physical piece.
- Tintable `Folder` surfaces and configurable `FolderBinder` depth/layers.
- Gravity classes for vertical expansion origin: `start`, `center`, `end`.
- Roving tab focus with automatic or manual activation.
- Full accessible labels can differ from compact visible labels.
- CSS variables for theming.
- No runtime dependencies beyond Vue.

## Install

The package is designed for npm publishing, but early adopters can copy the
source or install from GitHub once the repository is public.

```bash
pnpm add github:bdteo/folder-tabs
```

```ts
import { FolderTabs } from '@bdteo/folder-tabs';
import '@bdteo/folder-tabs/style.css';
```

## Copy-In Usage

For shadcn-style ownership, copy these files into your project:

```text
src/components/folder-tabs/FolderTabs.vue
src/components/folder-tabs/Folder.vue
src/components/folder-tabs/FolderAttachment.vue
src/components/folder-tabs/FolderBinder.vue
src/components/folder-tabs/FolderTabPanelStack.vue
src/components/folder-tabs/folderGeometry.ts
src/components/folder-tabs/folderTabs.ts
src/components/folder-tabs/folder-tabs.css
src/components/folder-tabs/index.ts
src/components/folder-tabs/useFolderPullMachine.ts
src/components/folder-tabs/useFolderTabList.ts
```

The registry seed lives in `registry/vue/folder-tabs/`.

## Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FolderAttachment, type FolderTabItem } from '@bdteo/folder-tabs';
import '@bdteo/folder-tabs/style.css';

const active = ref('photos');

const tabs: FolderTabItem[] = [
  { key: 'photos', label: 'Object photos', shortLabel: 'Photos', tone: 'moss', count: 15 },
  { key: 'plans', label: 'Floor plans', shortLabel: 'Plans', tone: 'copper', count: 2 },
  { key: 'maps', label: 'Maps and plans', shortLabel: 'Maps', tone: 'violet', count: 4 },
];
</script>

<template>
  <FolderAttachment
    v-model="active"
    :tabs="tabs"
    aria-label="Media sections"
    orientation="horizontal"
    edge="top"
    expand-on="hover"
    depth="raised"
    tone="copper"
    :layers="2"
  >
    Active folder content goes here.
  </FolderAttachment>
</template>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tabs` | `FolderTabItem[]` | required | Each tab needs `key` and `label`. |
| `modelValue` | `string \| number \| null` | `null` | Active tab key. |
| `orientation` | `horizontal \| vertical` | `horizontal` | Changes layout and keyboard direction. |
| `edge` | `top \| right \| bottom \| left` | derived | Defaults to `top` for horizontal and `left` for vertical. |
| `density` | `spread \| overlap \| dense` | `spread` | Mainly useful for vertical stacks. |
| `activation` | `automatic \| manual` | `automatic` | Manual moves focus without changing the active tab. |
| `expandOn` | `active \| hover \| focus \| always` | `hover` | Controls tab label expansion triggers. Attached folders expand from physical pull/hover/focus state. |
| `gravity` | `start \| center \| end` | `center` | Sets vertical transform origin. |
| `appearance` | `rail \| stack` | `rail` | `stack` makes vertical tabs cascade like physical folder dividers. |
| `activationMotionDuration` | `number` | `360` | Milliseconds that grabbed/receding tab classes stay active. `FolderAttachment` wires this to its pull duration. |
| `ariaLabel` | `string` | required | Label for the tablist. |
| `panelIdForTab` | `(tab) => string` | `null` | Optional `aria-controls` hook. |
| `emulatedHoverKey` | `string \| number \| null` | `null` | Visual QA hook for `FolderAttachment`; applies BEM hover-emulation classes and the same slot geometry as real hover. |

## FolderAttachment

Use `FolderAttachment` when the tab and folder should behave like one physical object. It renders one `Folder` per tab inside a `FolderBinder`; each folder owns its own tab button, and the active folder owns the visible panel content. That means pull motion, z-index, edge direction, and tab placement are structurally connected instead of visually faked.

Its default slot receives `{ activeTab, activeIndex, pulled }`, its `icon` slot customizes attached tab icons, and `folderClass` is applied to the active content area inside the folder. `pullDuration` controls the outward pull; `returnDuration` controls how long the currently pulled folder slides back before the next folder is selected. Initial folders start tucked, and a clicked folder stays pulled until another folder is selected. Hovered inactive tabs reserve measured space, displace their neighbors, and slide from their tucked offset to the folder edge without overshooting into a gap. The selected folder always owns the higher layer and does not shift when its own tag is hovered. For visual QA, `emulatedHoverKey` applies `folder-attachment--hover-emulated`, `folder-attachment__folder--hover-emulated`, and `folder-attachment__tab--hover-emulated` while using the same displacement geometry as a real hover.

## Folder and FolderBinder

Use `Folder` for the active content surface and `FolderBinder` for the physical holder/stack around it. A binder is the thing that holds folders together; the component uses that metaphor so tabs can pull folders out in the configured edge direction.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `horizontal \| vertical` | `horizontal` | Used only to derive the default edge. |
| `edge` | `top \| right \| bottom \| left` | derived | Direction the folder tabs attach to. The active folder pulls toward this edge while stack layers recede away from it. |
| `depth` | `flat \| subtle \| raised \| deep` | `raised` | Controls the strength of panel shadow/layering. |
| `layers` | `number` | `2` | Bounded to `0`, `1`, or `2` visible underlayers. |
| `activeIndex` | `number` | `0` | Exposed as a CSS variable for app-specific position-dependent styling. |
| `tone` | `slate \| moss \| teal \| copper \| violet` | `slate` | Tints the folder and binder layers. |
| `pulled` | `boolean` | `false` | Moves the folder outward along the edge for a short “grabbed folder” state. |

`Folder` accepts `tone` so the content surface matches its binder. `FolderAttachment` also accepts `tone` as a fallback, while each `FolderTabItem` can set its own `tone` to make individual folders in a stack visually distinct. `FolderTabPanelStack` remains available as a compatibility wrapper around `FolderBinder` + `Folder`.

## FolderTabItem

```ts
interface FolderTabItem {
  key: string | number;
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
```

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm build:demo
```

## License

MIT.
