# AGENTS.md

## Project

FolderTabs is a small Vue 3 component library and demo app for tactile, orientation-aware folder/index tabs. The package name is `@bdteo/folder-tabs`; Vue is the only runtime peer dependency.

## Stack and Commands

- Use `pnpm` only. The repo is pinned through `packageManager` to `pnpm@10.15.1`.
- Install: `pnpm install`
- Demo dev server: `pnpm dev`
- Refresh README/demo screenshots: `pnpm screenshots`
- Full verification gate: `pnpm verify`
- Tests: `pnpm test`
- Type check: `pnpm typecheck`
- Library build: `pnpm build`
- Demo build: `pnpm build:demo`
- Demo geometry verification: `pnpm verify:demo`
- Screenshot freshness verification: `pnpm verify:screenshots`
- Package consumer verification: `pnpm verify:package`
- There is no lint script at the moment. Do not invent one in status reports; use the commands above as the verification surface.

## Source Layout

- `src/components/folder-tabs/` is the canonical implementation.
  - `FolderTabs.vue` is the standalone accessible tab rail.
  - `FolderAttachment.vue` is the high-level physical folder stack.
  - `FolderBinder.vue` and `Folder.vue` model the physical holder and folder surface.
  - `FolderTabPanelStack.vue` is the compatibility wrapper around the binder/folder pair.
  - `folderGeometry.ts` contains exported physical edge, reach, slot, tuck, hover, and pull helpers.
  - `folderTabs.ts` contains exported types and pure helpers.
  - `css.d.ts` keeps source-barrel CSS imports typed for copy-in and package source consumers.
  - `folder-tabs.css` contains component styles and CSS variables.
  - `index.ts` is the public package entry.
- `src/vite-env.d.ts` provides Vite module typings for raw CSS imports used by tests; keep it tracked for clean-clone typechecks.
- `src/App.vue` and `src/demo/demo.css` are the local Vite demo.
- `tests/` contains Vitest/jsdom coverage for helpers, ARIA semantics, keyboard navigation, disabled tabs, and activation modes.
- `registry/vue/folder-tabs/` is the shadcn-style copy-in registry package.
- `scripts/demo-cdp-utils.mjs` is the shared temporary Vite + Chrome DevTools harness for demo QA scripts.
- `scripts/demo-screenshot-utils.mjs` is the shared screenshot capture helper for mutating screenshot refreshes and non-mutating freshness checks, including overview and attached-stack crops.
- `scripts/capture-demo-screenshots.mjs` refreshes the README/demo PNGs through that harness.
- `scripts/check-demo-screenshots.mjs` captures screenshots into a temp folder and fails if `docs/screenshots/` is stale.
- `scripts/check-demo-geometry.mjs` verifies browser-rendered demo console cleanliness, geometry for side grab lanes, side icon paint visibility, active tab seams, hover handle-only tugging, folder z-index contracts, and real demo click-to-pull behavior.
- `scripts/check-package-consumer.mjs` builds/packs the library and compiles throwaway consumers for package and registry copy-in imports.
- `scripts/verify-all.mjs` runs the full local gate, including source/registry sync, stale demo-browser process checks, tests, typecheck, demo geometry QA, screenshot freshness, package consumer verification, demo build, and `git diff --check`.
- `docs/screenshots/` contains README/demo images.
- `dist/`, `dist-demo/`, `node_modules/`, coverage, and test-report folders are generated/ignored.

## Maintenance Rules

- Keep the canonical component files in `src/components/folder-tabs/` and the registry copies in `registry/vue/folder-tabs/` in sync. Before finishing component work, run:

```bash
diff -rq src/components/folder-tabs registry/vue/folder-tabs -x README.md -x folder-tabs.json
```

`pnpm verify` includes an equivalent source/registry sync check; the explicit
`diff -rq` command remains useful when you only need that one check while
iterating.

- When changing the public API, update exported types, README usage/props, registry README or metadata when relevant, and focused tests.
- Preserve accessibility behavior: `ariaLabel` is required for the tablist, tabs use roving focus, disabled tabs are skipped, manual activation moves focus without emitting model updates, and automatic activation emits `update:modelValue`.
- Keyboard navigation intentionally clamps at the first/last focusable tab instead of wrapping around the physical stack.
- Keep icon rendering dependency-free. The component accepts Vue icon components or the `icon` slot; do not add an icon package just for the library.
- Component CSS should remain portable: use scoped class names under `.folder-tabs`, public-ish theming variables under `--ft-*`, and internal physical sizing variables under `--folder-*` / `--folder-attached-*`.
- If behavior changes, prefer helper-level tests for pure logic and component tests for DOM/ARIA/emits behavior.

## Release Notes for Agents

- `vite.lib.config.ts` builds the package entry from `src/components/folder-tabs/index.ts`, externalizes Vue, disables CSS splitting, and emits declarations through `vite-plugin-dts`.
- Package exports include the main import, `./style.css`, and `./source`.
- The README frames this as both an npm package and a copy-in primitive; keep both usage paths healthy.
