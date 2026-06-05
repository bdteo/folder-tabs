# AGENTS.md

## Project

FolderTabs is a small Vue 3 component library and demo app for tactile, orientation-aware folder/index tabs. The package name is `@bdteo/folder-tabs`; Vue is the only runtime peer dependency.

## Stack and Commands

- Use `pnpm` only. The repo is pinned through `packageManager` to `pnpm@10.15.1`.
- Install: `pnpm install`
- Demo dev server: `pnpm dev`
- Tests: `pnpm test`
- Type check: `pnpm typecheck`
- Library build: `pnpm build`
- Demo build: `pnpm build:demo`
- There is no lint script at the moment. Do not invent one in status reports; use the commands above as the verification surface.

## Source Layout

- `src/components/folder-tabs/` is the canonical implementation.
  - `FolderTabs.vue` contains the Vue component and ARIA/keyboard behavior.
  - `folderTabs.ts` contains exported types and pure helpers.
  - `folder-tabs.css` contains component styles and CSS variables.
  - `index.ts` is the public package entry.
- `src/App.vue` and `src/demo/demo.css` are the local Vite demo.
- `tests/` contains Vitest/jsdom coverage for helpers, ARIA semantics, keyboard navigation, disabled tabs, and activation modes.
- `registry/vue/folder-tabs/` is the shadcn-style copy-in registry package.
- `docs/screenshots/` contains README/demo images.
- `dist/`, `dist-demo/`, `node_modules/`, coverage, and test-report folders are generated/ignored.

## Maintenance Rules

- Keep the canonical component files in `src/components/folder-tabs/` and the registry copies in `registry/vue/folder-tabs/` in sync. Before finishing component work, run:

```bash
diff -rq src/components/folder-tabs registry/vue/folder-tabs -x README.md -x folder-tabs.json
```

- When changing the public API, update exported types, README usage/props, registry README or metadata when relevant, and focused tests.
- Preserve accessibility behavior: `ariaLabel` is required for the tablist, tabs use roving focus, disabled tabs are skipped, manual activation moves focus without emitting model updates, and automatic activation emits `update:modelValue`.
- Keyboard navigation intentionally clamps at the first/last focusable tab instead of wrapping around the physical stack.
- Keep icon rendering dependency-free. The component accepts Vue icon components or the `icon` slot; do not add an icon package just for the library.
- Component CSS should remain portable: use scoped class names under `.folder-tabs`, public-ish theming variables under `--ft-*`, and internal sizing variables under `--folder-tab-*`.
- If behavior changes, prefer helper-level tests for pure logic and component tests for DOM/ARIA/emits behavior.

## Release Notes for Agents

- `vite.lib.config.ts` builds the package entry from `src/components/folder-tabs/index.ts`, externalizes Vue, disables CSS splitting, and emits declarations through `vite-plugin-dts`.
- Package exports include the main import, `./style.css`, and `./source`.
- The README frames this as both an npm package and a copy-in primitive; keep both usage paths healthy.
