# folder-tabs registry seed

This directory is the copy-in seed for a shadcn-vue style registry entry.

Copy the component files into your app. The `index.ts` barrel imports
`folder-tabs.css` for you, and the included `css.d.ts` shim keeps that
side-effect CSS import typed. Vue single-file-component typing should come from
your app's normal Vue/Vite setup. If you import individual `.vue` files directly
instead, import the CSS once from your app entry:

```ts
import '@/components/folder-tabs/folder-tabs.css';
```

Use `FolderAttachment` when the tab/tag should stay literally attached to its folder. It renders one `Folder` per tab inside a `FolderBinder`; each folder owns its tab handle and the active folder owns the visible content surface, so pull motion, z-index, edge direction, and tab placement move as one physical piece.

Each tab needs a unique `key` and `label`. Duplicate keys are ignored after the first match using the same string identity used for selection, which keeps Vue keys, ARIA ids, measurements, and physical folder state aligned.

Pass the required tablist label as `ariaLabel` in Vue templates. `aria-label` is treated by Vue's type checker as a native ARIA attribute, not as this component prop.

Attached folders generate stable, collision-resistant tab/panel IDs by default: every tab points at a real panel shell with `aria-controls`, and each panel points back with `aria-labelledby`. Inactive panel shells stay hidden and empty; the active folder mounts the visible slot content. Pass `panelIdForTab` or `tab.panelId` when you need an app-owned panel id. External panel IDs are tried as `panelIdForTab(tab)` first, then `tab.panelId`; invalid or duplicate external IDs fall back to generated IDs so the rendered panels stay unique.

Standalone `FolderTabs` also generates stable tab IDs, but it only sets `aria-controls` when you provide a valid, unique `panelIdForTab` or `tab.panelId` for an external panel. That keeps the rail accessible without pointing at panels it does not render.

If the controlled `modelValue` is disabled, missing, or null, the components fall back internally to the first enabled tab without emitting an update. If no tab is enabled, no tab is selected. That keeps the tablist accessible and prevents disabled tabs from becoming the selected physical folder.

The selected folder takes the front layer immediately. By default, the previous folder folds back at 75% of the outward pull duration, giving the return a slightly quicker physical feel while preserving `returnDuration` as an explicit override. The newly selected folder appears immediately in the pulled physical lane while the previous folder returns into its remembered tucked offset, avoiding a snap through a stale midpoint. `pullDistance` defaults to `0`, so stack order changes without shifting the active content sheet; increase it only when the whole active folder should visibly move outward. Initial folders start tucked, including the first enabled folder that appears after an empty or all-disabled data load. Clicking the already-controlled active folder is idempotent, so it does not re-enter pull motion or nudge the tab out of alignment; fallback selections can still emit when `modelValue` is missing or disabled. The tucked stack remembers selection history, so recently selected folders keep both a higher resting z-index and a shallower tuck offset. Tucked folders remain visible as muted physical sheets, so the folder bodies/cards and tag handles display the same remembered pile; even deeply tucked folders keep an icon-safe handle lane exposed so the icon stays visible and the tab remains easy to grab.

Set `tone` on individual `FolderTabItem` objects when a stack should show different folder tints. The `FolderAttachment` `tone` prop remains the fallback and binder tint.

Set `texture="paper"` when the stack should read as real paper/cardstock. The texture is generated with portable CSS gradients, so it tiles cleanly out of the box, and it applies to the binder layers, folder sheets, content surface, and attached tab handles by default. Use `textureLayers` to choose where that paper appears: `all` preserves the full recipe, `shell` paints the sheets and handles while leaving slotted content clean, `content` paints only the active content surface, `tab` paints only handles, and explicit arrays such as `['sheet', 'tab']` are accepted. `shell` is usually the right integration setting for galleries, maps, and document previews where the content already owns its own visual surface. Standalone `FolderTabs`, `FolderBinder`, `Folder`, and `FolderTabPanelStack` accept the same `texture` and `textureLayers` props. This registry seed also includes image-backed paper assets and exports `getFolderPaperTextureStyle()`, `folderPaperTexturePresets`, and `folderPaperTexturePresetOptions` from `paperTextures.ts` when you want a stronger material texture. Bind the returned style object to the component root alongside `texture="paper"`.

Set `edge` on individual `FolderTabItem` objects when one attached binder should mix tab edges, such as alternating left/right tabs or a bottom/right corner index. The stack-level `edge` remains the fallback.

Set `gravity` on individual `FolderTabItem` objects when one physical edge should split into separate slot lanes, such as top tabs grouped on the left and right sides of the same folder. `start` and `end` groups get independent measured slots while sharing the same pull direction.

Use `stackRotation` on `FolderAttachment` when tucked/background folders should get a small mirrored rotation, like files pushed back into a real binder. `stackRotation="folders"` rotates only the folder sheets; `stackRotation="pieces"` rotates the whole folder piece. `tabRotation="straight"` keeps handles optically upright, including by counter-rotating them in whole-piece mode, while `tabRotation="rotated"` lets inactive handles tilt with the folder. In whole-piece mode, tab borders are suppressed so the tilted page reads as one continuous physical sheet. Active and pulled folders stay square. The legacy `tuckedTilt` boolean remains a shortcut for `stackRotation="pieces"` when `stackRotation` is omitted.

Hover behaves like touching or listing through a real folder tab: only the handle tugs toward the tab edge, while clicking pulls the whole folder. Use `emulatedHoverKey` only as a visual QA hook. It applies BEM hover-emulation classes and the same handle tug and displacement geometry as real hover, while label/slot expansion still follows `expandOn`. That makes overlap bugs easier to reproduce without holding the pointer over a moving tab.

Use `appearance="stack"` on vertical tabs when the side rail should read like a physical cascade of folder dividers.

Use `FolderBinder` around a `Folder` when the content area should show configurable stacked depth attached to the same edge as the tabs. The binder owns shared depth, tint, edge, and layer direction; `FolderAttachment` owns the tab-and-folder pull motion. `FolderTabPanelStack` remains available as a compatibility wrapper.

The `index.ts` barrel also exports the finite geometry helpers used by the physical stack. Import `getFolderEdgeVector`, `getFolderPieceTuckOffset`, `getFolderPullOffset`, `getFolderHoverOffset`, `getFolderStackSlots`, `getFolderTabReachSize`, `getFolderVisibleGrabSize`, `getFolderMinimumGrabSize`, and `getFolderMinimumVisibleGrabSize` when custom styling or QA overlays need to stay aligned with the built-in folder mechanics. These helpers normalize invalid runtime numbers into finite non-negative CSS measurements, and side edges reserve a larger icon-safe grab lane that also drives the side reveal gutter.

The stylesheet honors `prefers-reduced-motion: reduce` by disabling rail, folder, binder, layer, and attached-tab transitions and animations while preserving the final layout state.

The canonical source currently lives in `src/components/folder-tabs/`.
