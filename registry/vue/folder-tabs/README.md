# folder-tabs registry seed

This directory is the copy-in seed for a shadcn-vue style registry entry.

Copy the component files into your app, then import the CSS once:

```ts
import '@/components/folder-tabs/folder-tabs.css';
```

Use `FolderAttachment` when the tab/tag should stay literally attached to its folder. It renders one `Folder` per tab inside a `FolderBinder`; each folder owns its tab handle and the active folder owns the visible content surface, so pull motion, z-index, edge direction, and tab placement move as one physical piece.

Set `tone` on individual `FolderTabItem` objects when a stack should show different folder tints. The `FolderAttachment` `tone` prop remains the fallback and binder tint.

Use `emulatedHoverKey` only as a visual QA hook. It applies BEM hover-emulation classes and the same displacement geometry as real hover, which makes overlap bugs easier to reproduce without holding the pointer over a moving tab.

Use `appearance="stack"` on vertical tabs when the side rail should read like a physical cascade of folder dividers.

Use `FolderBinder` around a `Folder` when the content area should show configurable stacked depth attached to the same edge as the tabs. The active folder pulls toward the tab edge while the binder layers recede behind it. `FolderTabPanelStack` remains available as a compatibility wrapper.

The canonical source currently lives in `src/components/folder-tabs/`.
