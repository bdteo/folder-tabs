import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';
import {
  Folder,
  FolderAttachment,
  FolderBinder,
  FolderTabPanelStack,
  FolderTabs,
  getFolderMinimumVisibleGrabSize,
  getFolderPullOffset,
  getFolderVisibleGrabSize,
  normalizeFolderPullDistance,
  normalizeFolderSurfaceTextColor,
  normalizeFolderSurfaceTextureBlendMode,
  normalizeFolderSurfaceTexture,
  normalizeFolderSurfaceTextureLayers,
  normalizeFolderStackRotation,
  normalizeFolderTabRotation,
  type FolderTabItem,
  type FolderTabKey,
} from '../src/components/folder-tabs';
import folderTabsCss from '../src/components/folder-tabs/folder-tabs.css?raw';
import demoCss from '../src/demo/demo.css?raw';
import appVueSource from '../src/App.vue?raw';
import sourceBarrel from '../src/components/folder-tabs/index.ts?raw';
import indexHtml from '../index.html?raw';
import demoGeometryScript from '../scripts/check-demo-geometry.mjs?raw';
import screenshotCheckScript from '../scripts/check-demo-screenshots.mjs?raw';
import screenshotScript from '../scripts/capture-demo-screenshots.mjs?raw';
import demoCdpUtilsScript from '../scripts/demo-cdp-utils.mjs?raw';
import demoScreenshotUtilsScript from '../scripts/demo-screenshot-utils.mjs?raw';
import packageConsumerScript from '../scripts/check-package-consumer.mjs?raw';
import verifyAllScript from '../scripts/verify-all.mjs?raw';
import packageJson from '../package.json';
import readmeMarkdown from '../README.md?raw';
import registryReadmeMarkdown from '../registry/vue/folder-tabs/README.md?raw';
import registryItem from '../registry/vue/folder-tabs/folder-tabs.json';

const registryFileModules = import.meta.glob('../registry/vue/folder-tabs/*', {
  eager: true,
  import: 'default',
  query: '?raw',
});
const registryInstallableFileModules = import.meta.glob('../registry/vue/folder-tabs/**/*', {
  eager: true,
  import: 'default',
  query: '?url',
});

const Icon = defineComponent({
  name: 'TestIcon',
  render: () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: 'M4 12h16' })]),
});

const tabs: FolderTabItem[] = [
  { key: 'photos', label: 'Object photos', shortLabel: 'Photos', icon: Icon, count: 1, totalCount: 15 },
  { key: 'plans', label: 'Floor plans', shortLabel: 'Plans', icon: Icon, count: 2 },
  { key: 'maps', label: 'Maps', shortLabel: 'Maps', icon: Icon, disabled: true },
  { key: 'docs', label: 'Documents', shortLabel: 'Docs', icon: Icon, count: 12 },
];

async function waitForMotionFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
  await nextTick();
}

function folderPieceStyleNumber(wrapper: ReturnType<typeof mount>, index: number, property: string): number {
  const style = wrapper.findAll('.folder-attachment__folder')[index].attributes('style') ?? '';
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = style.match(new RegExp(`${escapedProperty}:\\s*(-?\\d+(?:\\.\\d+)?)`));

  return Number(match?.[1] ?? Number.NaN);
}

function folderPieceZ(wrapper: ReturnType<typeof mount>, index: number): number {
  return folderPieceStyleNumber(wrapper, index, '--folder-piece-z');
}

function dispatchKeyboardEvent(element: Element, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
  }));
}

describe('FolderTabs', () => {
  it('wires a demo favicon so the runtime console stays clean', () => {
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
  });

  it('publishes README screenshot assets referenced by the package readme', () => {
    expect(readmeMarkdown).toContain('docs/screenshots/demo-attached-desktop.png');
    expect(readmeMarkdown).toContain('docs/screenshots/demo-attached-mobile.png');
    expect(readmeMarkdown).toContain('docs/screenshots/demo-desktop.png');
    expect(readmeMarkdown).toContain('pnpm screenshots');
    expect(readmeMarkdown).toContain('CHROME_PATH');
    expect(readmeMarkdown).toContain('FOLDERTABS_SCREENSHOT_PORT');
    expect(packageJson.files).toContain('docs/screenshots');
    expect(packageJson.files).toContain('scripts/check-demo-geometry.mjs');
    expect(packageJson.files).toContain('scripts/check-demo-screenshots.mjs');
    expect(packageJson.files).toContain('scripts/capture-demo-screenshots.mjs');
    expect(packageJson.files).toContain('scripts/demo-cdp-utils.mjs');
    expect(packageJson.files).toContain('scripts/demo-screenshot-utils.mjs');
    expect(packageJson.files).toContain('scripts/check-package-consumer.mjs');
    expect(packageJson.files).toContain('scripts/verify-all.mjs');
    expect(packageJson.scripts.screenshots).toBe('node scripts/capture-demo-screenshots.mjs');
    expect(packageJson.scripts.verify).toBe('node scripts/verify-all.mjs');
    expect(packageJson.scripts['verify:demo']).toBe('node scripts/check-demo-geometry.mjs');
    expect(packageJson.scripts['verify:screenshots']).toBe('node scripts/check-demo-screenshots.mjs');
    expect(packageJson.scripts['verify:package']).toBe('node scripts/check-package-consumer.mjs');
    expect(readmeMarkdown).toContain('pnpm verify');
    expect(readmeMarkdown).toContain('pnpm verify:demo');
    expect(readmeMarkdown).toContain('pnpm verify:screenshots');
    expect(readmeMarkdown).toContain('FOLDERTABS_DEMO_QA_PORT');
    expect(readmeMarkdown).toContain('FOLDERTABS_SCREENSHOT_CHECK_PORT');
  });

  it('defines one full verification gate for release-grade local checks', () => {
    expect(verifyAllScript).toContain("['pnpm', ['test']]");
    expect(verifyAllScript).toContain("['pnpm', ['typecheck']]");
    expect(verifyAllScript).toContain("['pnpm', ['verify:demo']]");
    expect(verifyAllScript).toContain("['pnpm', ['verify:screenshots']]");
    expect(verifyAllScript).toContain("['pnpm', ['verify:package']]");
    expect(verifyAllScript).toContain("['pnpm', ['build:demo']]");
    expect(verifyAllScript).toContain("['git', ['diff', '--check']]");
    expect(verifyAllScript).toContain('verifyRegistrySync();');
    expect(verifyAllScript).toContain("verifyNoStaleDemoBrowserProcesses('before browser QA');");
    expect(verifyAllScript).toContain("verifyNoStaleDemoBrowserProcesses('after browser QA');");
    expect(verifyAllScript).toContain("const registryOnlyFiles = new Set(['README.md', 'folder-tabs.json']);");
    expect(verifyAllScript).toContain('/foldertabs-screenshots/');
    expect(verifyAllScript).toContain('/foldertabs-screenshot-check/');
    expect(verifyAllScript).toContain('/foldertabs-demo-geometry/');
    expect(verifyAllScript).toContain('--remote-debugging-port=9342');
    expect(verifyAllScript).toContain('--remote-debugging-port=9341');
    expect(verifyAllScript).toContain('content differs:');
    expect(readmeMarkdown).toContain('stale headless Chrome');
  });

  it('shares a hardened demo CDP harness across browser QA scripts', () => {
    expect(screenshotScript).toContain("from './demo-screenshot-utils.mjs';");
    expect(screenshotCheckScript).toContain("from './demo-screenshot-utils.mjs';");
    expect(screenshotCheckScript).toContain('README/demo screenshots are stale');
    expect(screenshotCheckScript).toContain("import { inflateSync } from 'node:zlib';");
    expect(screenshotCheckScript).toContain('function decodePng(buffer) {');
    expect(screenshotCheckScript).toContain('function comparePngPixels(expected, fresh) {');
    expect(screenshotCheckScript).toContain('maxAverageChannelDelta');
    expect(demoScreenshotUtilsScript).toContain("from './demo-cdp-utils.mjs';");
    expect(demoScreenshotUtilsScript).toContain('export const demoScreenshotSpecs = [');
    expect(demoScreenshotUtilsScript).toContain('demo-attached-desktop.png');
    expect(demoScreenshotUtilsScript).toContain('demo-attached-mobile.png');
    expect(demoScreenshotUtilsScript).toContain("scrollSelector: '.demo-workbench'");
    expect(demoScreenshotUtilsScript).toContain('async function scrollToScreenshotTarget');
    expect(demoScreenshotUtilsScript).toContain('pathAndQuery: physicalStackPath');
    expect(demoScreenshotUtilsScript).toContain('window.scrollTo(0,');
    expect(demoScreenshotUtilsScript).toContain('export async function captureDemoScreenshots');
    expect(demoGeometryScript).toContain("from './demo-cdp-utils.mjs';");
    expect(demoGeometryScript).toContain('waitForDemoFrame');
    expect(demoGeometryScript).toContain('function assertNoInteractionFailures');
    expect(demoGeometryScript).toContain('async function inspectDemoClickPull');
    expect(demoGeometryScript).toContain('Demo click-pull passed');
    expect(demoGeometryScript).toContain("rootSelector: '.demo-stage--primary'");
    expect(demoGeometryScript).toContain("rootSelector: '.demo-stage--workbench'");
    expect(demoGeometryScript).toContain('function assertNoConsoleFailures');
    expect(demoGeometryScript).toContain('function createConsoleErrorCollector');
    expect(demoGeometryScript).toContain("client.on('Runtime.consoleAPICalled'");
    expect(demoGeometryScript).toContain("client.on('Runtime.exceptionThrown'");
    expect(demoGeometryScript).toContain("client.on('Log.entryAdded'");
    expect(demoGeometryScript).toContain('Demo console passed');
    expect(demoGeometryScript).toContain('clicked folder did not become active');
    expect(demoGeometryScript).toContain('clicked folder offset');
    expect(demoGeometryScript).toContain('visible panel did not move into the clicked folder');
    expect(demoGeometryScript).toContain('minSideVisibleGrabLane = 110');
    expect(demoGeometryScript).toContain('qaScenarios = [');
    expect(demoGeometryScript).toContain("name: 'buried side icons'");
    expect(demoGeometryScript).toContain('async function assertSideIconPaint');
    expect(demoGeometryScript).toContain('side icon is visually covered');
    expect(demoGeometryScript).toContain('maxActiveSeamGap = 0.75');
    expect(demoGeometryScript).toContain('maxActiveSeamOverlap = 1.5');
    expect(demoGeometryScript).toContain('maxHoverMotionDelta = 0.75');
    expect(demoGeometryScript).toContain('minHoverOutwardTug = 4');
    expect(demoGeometryScript).toContain('const parseTranslate = (transform) => {');
    expect(demoGeometryScript).toContain("activeFolder.querySelector('.folder-attachment__content:not([hidden])')");
    expect(demoGeometryScript).toContain('const activePanelRect = activeContent.getBoundingClientRect();');
    expect(demoGeometryScript).toContain('active tab leaves a');
    expect(demoGeometryScript).toContain('active tab overlaps its folder panel');
    expect(demoGeometryScript).toContain('hovered folder sheet moved');
    expect(demoGeometryScript).toContain('hovered tab transform');
    expect(demoGeometryScript).toContain('hovered tab tugs only');
    expect(demoGeometryScript).toContain('!isActive && visibleOutsideActivePanel < minSideVisibleGrabLane');
    expect(demoGeometryScript).toContain('icon overlaps active folder panel');
    expect(demoGeometryScript).toContain('hovered folder z-index');
    expect((demoGeometryScript.match(/missing visible active folder panel/g) ?? [])).toHaveLength(1);
    expect(demoCdpUtilsScript).toContain('this.eventWaiters = new Set();');
    expect(demoCdpUtilsScript).toContain('this.readySettled = false;');
    expect(demoCdpUtilsScript).toContain('this.rejectReady = (error) => {');
    expect(demoCdpUtilsScript).toContain("this.webSocket.addEventListener('close', () => {");
    expect(demoCdpUtilsScript).toContain("this.webSocket.addEventListener('error', () => {");
    expect(demoCdpUtilsScript).toContain('this.rejectReady(error);');
    expect(demoCdpUtilsScript).toContain('rejectOpenWork(error) {');
    expect(demoCdpUtilsScript).toContain('this.pending.clear();');
    expect(demoCdpUtilsScript).toContain('waiter.reject(error);');
    expect(demoCdpUtilsScript).toContain('  on(method, listener) {');
    expect(demoCdpUtilsScript).toContain("Cannot listen for ${method}; Chrome DevTools websocket is already closed.");
    expect(demoCdpUtilsScript).toContain("await client.send('Log.enable');");
  });

  it('keeps temp-owning verification scripts cleanup-safe on failure', () => {
    expect(screenshotCheckScript).toContain('let exitCode = 0;');
    expect(screenshotCheckScript).toContain('process.exitCode = exitCode;');
    expect(screenshotCheckScript).not.toContain('process.exit(1);');
    expect(packageConsumerScript).toContain('class CommandFailure extends Error');
    expect(packageConsumerScript).toContain('throw new CommandFailure(result.status ?? 1);');
    expect(packageConsumerScript).toContain('const requiredPackedFiles = [');
    expect(packageConsumerScript).toContain('dist/folder-tabs.js');
    expect(packageConsumerScript).toContain('dist/assets/paper/paper-watercolor-rough.jpg');
    expect(packageConsumerScript).toContain('docs/screenshots/demo-attached-desktop.png');
    expect(packageConsumerScript).toContain('docs/screenshots/demo-attached-mobile.png');
    expect(packageConsumerScript).toContain('docs/screenshots/demo-desktop.png');
    expect(packageConsumerScript).toContain('scripts/capture-demo-screenshots.mjs');
    expect(packageConsumerScript).toContain('scripts/copy-package-assets.mjs');
    expect(packageConsumerScript).toContain('scripts/verify-all.mjs');
    expect(packageConsumerScript).toContain('const forbiddenPackedFiles = [');
    expect(packageConsumerScript).toContain('src/App.vue');
    expect(packageConsumerScript).toContain('registry/vue/folder-tabs/vue.d.ts');
    expect(packageConsumerScript).toContain('verifyPackedPackageContents(packResult);');
    expect(packageConsumerScript).toContain('rmSync(tempRoot, { force: true, recursive: true });');
    expect(packageConsumerScript).toContain('process.exitCode = exitCode;');
    expect(packageConsumerScript).not.toContain('process.exit(result.status ?? 1);');
  });

  it('keeps the registry manifest aligned with the copy-in files on disk', () => {
    const registryFiles = registryItem.files.map((file) => file.path);
    const registryTargets = registryItem.files.map((file) => file.target);
    const installableFiles = Object.keys(registryInstallableFileModules)
      .map((filePath) => filePath.replace('../registry/vue/folder-tabs/', ''))
      .filter((file) => file !== 'README.md' && file !== 'folder-tabs.json')
      .sort();

    expect([...registryFiles].sort()).toEqual(installableFiles);
    expect(new Set(registryFiles).size).toBe(registryFiles.length);
    expect(new Set(registryTargets).size).toBe(registryTargets.length);

    for (const file of registryItem.files) {
      expect(file.target).toBe(`components/ui/folder-tabs/${file.path}`);

      if (file.path.endsWith('.vue')) {
        expect(file.type).toBe('registry:ui');
      } else if (file.path.endsWith('.css')) {
        expect(file.type).toBe('registry:style');
      } else if (file.path.endsWith('.png') || file.path.endsWith('.jpg')) {
        expect(file.type).toBe('registry:file');
      } else {
        expect(file.type).toBe('registry:lib');
      }
    }
  });

  it('keeps the registry README aligned with the physical copy-in mental model', () => {
    expect(registryReadmeMarkdown).toContain('`FolderAttachment`');
    expect(registryReadmeMarkdown).toContain('one `Folder` per tab inside a `FolderBinder`');
    expect(registryReadmeMarkdown).toContain('each folder owns its tab handle');
    expect(registryReadmeMarkdown).toContain('recently selected folders keep both a higher resting z-index and a shallower tuck offset');
    expect(registryReadmeMarkdown).toContain('icon-safe handle lane exposed so the icon stays visible');
    expect(registryReadmeMarkdown).toContain('only the handle tugs toward the tab edge');
    expect(registryReadmeMarkdown).toContain('Use `emulatedHoverKey` only as a visual QA hook');
    expect(registryReadmeMarkdown).toContain('The canonical source currently lives in `src/components/folder-tabs/`.');
  });

  it('documents FolderBinder as the holder layer, not the pull transform owner', () => {
    expect(readmeMarkdown).toContain('`FolderAttachment` can pull folders out in the configured edge direction');
    expect(readmeMarkdown).toContain('Raises the binder/front layer for a pulled stack.');
    expect(readmeMarkdown).toContain('`FolderAttachment` owns the tab-and-folder pull motion.');
    expect(readmeMarkdown).toContain('Binder layers recede away from this edge; `FolderAttachment` applies active folder pull motion.');
    expect(readmeMarkdown).not.toContain('Moves the folder outward along the edge for a short');
    expect(readmeMarkdown).not.toContain('The active folder pulls toward this edge while stack layers recede away from it.');
  });

  it('keeps the source barrel self-contained for CSS imports without shipping a conflicting Vue shim', () => {
    const registryFiles = registryItem.files.map((file) => file.path);
    const registryTargets = registryItem.files.map((file) => file.target);

    expect(sourceBarrel).toContain('/// <reference path="./css.d.ts" />');
    expect(sourceBarrel).not.toContain('/// <reference path="./vue.d.ts" />');
    expect(readmeMarkdown).toContain('src/components/folder-tabs/css.d.ts');
    expect(readmeMarkdown).not.toContain('src/components/folder-tabs/vue.d.ts');
    expect(registryFiles).toContain('css.d.ts');
    expect(registryFiles).not.toContain('vue.d.ts');
    expect(registryTargets).toContain('components/ui/folder-tabs/css.d.ts');
    expect(registryTargets).not.toContain('components/ui/folder-tabs/vue.d.ts');
    expect(packageJson.exports['./source'].types).toBe('./dist/index.d.ts');
    expect(packageJson.exports['./source'].import).toBe('./src/components/folder-tabs/index.ts');
    expect(packageJson.files).toContain('src/vite-env.d.ts');
  });

  it('keeps the consolidated demo focused on three component exhibits', () => {
    expect(appVueSource).toContain('class="demo-stage demo-stage--primary"');
    expect(appVueSource).toContain('class="demo-stage demo-stage--workbench"');
    expect(appVueSource).toContain('class="demo-rail-stage"');
    expect(appVueSource).not.toContain('activeStandaloneSide');
    expect(appVueSource).not.toContain('class="demo-rail-specimen"');
    expect(appVueSource).not.toContain('class="demo-rail-side"');
    expect(demoCss).toContain('.demo-rail-stage {');
    expect(demoCss).not.toContain('.demo-rail-specimen');
    expect(demoCss).not.toContain('.demo-rail-side');
    expect(demoCss).not.toContain('.demo-stage--split');
    expect(demoCss).not.toContain('.demo-stage--compact');
    expect(demoCss).not.toContain('.demo-stage--right');
  });

  it('keeps demo prose from clipping on narrow screenshots', () => {
    expect(demoCss).toContain([
      '.demo-lede {',
      '  max-inline-size: 34rem;',
      '  margin: 0;',
      '  color: #cac3b6;',
      '  font-size: clamp(1.05rem, 1.6vw, 1.32rem);',
      '  line-height: 1.55;',
      '  overflow-wrap: anywhere;',
      '}',
    ].join('\n'));
    expect(demoCss).toContain([
      '.demo-section-copy p:last-child {',
      '  max-inline-size: 43rem;',
      '  margin-block: 0.9rem 0;',
      '  font-size: 1.08rem;',
      '}',
    ].join('\n'));
    expect(demoCss).toContain([
      '.demo-folder p,',
      '.demo-section-copy p {',
      '  color: var(--folder-ink-muted, #c9c2b6);',
      '  line-height: 1.6;',
      '  overflow-wrap: anywhere;',
      '}',
    ].join('\n'));
    expect(demoCss).toContain([
      '.demo-media__copy p {',
      '  max-inline-size: 33rem;',
      '  margin-block: 1rem 0;',
      '  font-size: clamp(0.98rem, 1.3vw, 1.12rem);',
      '}',
    ].join('\n'));
  });

  it('reserves visible inward gutters for side-edge physical folder stacks', () => {
    const leftEdgeRule = [
      '.folder-attachment--edge-left {',
      '  padding-inline-start: var(--folder-side-tab-outset);',
      '  padding-inline-end: var(--folder-side-stack-reveal);',
      '  overflow-x: visible;',
    ].join('\n');
    const rightEdgeRule = [
      '.folder-attachment--edge-right {',
      '  --ft-label-rotation: 90deg;',
      '',
      '  padding-inline-start: var(--folder-side-stack-reveal);',
      '  padding-inline-end: var(--folder-side-tab-outset);',
      '  overflow-x: visible;',
    ].join('\n');

    expect(folderTabsCss).toContain('--folder-side-stack-reveal: 6rem;');
    expect(folderTabsCss).toContain('--folder-side-tab-outset: max(');
    expect(folderTabsCss).toContain(leftEdgeRule);
    expect(folderTabsCss).toContain(rightEdgeRule);
    expect(folderTabsCss).toContain('.folder-attachment--mixed-edge.folder-attachment--has-edge-left.folder-attachment--has-edge-right');
    expect(folderTabsCss).toContain('  padding-inline-start: var(--folder-side-tab-outset);\n  padding-inline-end: var(--folder-side-tab-outset);');
  });

  it('keeps hover motion on the tab handle instead of the folder sheet', () => {
    expect(folderTabsCss).toContain('.folder-attachment__folder:not(.is-active).is-hovered .folder-attachment__tab');
    expect(folderTabsCss).toContain('.folder-attachment__folder:not(.is-active).is-focused .folder-attachment__tab');
    expect(folderTabsCss).toContain('--folder-tab-transform-x: var(--folder-tab-hover-x);');
    expect(folderTabsCss).toContain('--folder-tab-transform-y: var(--folder-tab-hover-y);');
    expect(folderTabsCss).toContain('transform: translate3d(var(--folder-tab-transform-x), var(--folder-tab-transform-y), 0px) rotate(var(--folder-tab-rotate));');
    expect(folderTabsCss).not.toContain('transform: translate3d(var(--folder-piece-hover-x), var(--folder-piece-hover-y), 0px);');
  });

  it('renders folder position from component-owned physical offset variables', () => {
    expect(folderTabsCss).toContain('--folder-piece-x: 0px;');
    expect(folderTabsCss).toContain('--folder-piece-y: 0px;');
    expect(folderTabsCss).toContain('--folder-piece-rotate: 0deg;');
    expect(folderTabsCss).toContain('--folder-tab-transform-x: 0px;');
    expect(folderTabsCss).toContain('--folder-tab-transform-y: 0px;');
    expect(folderTabsCss).toContain('--folder-tab-rotate: 0deg;');
    expect(folderTabsCss).toContain([
      '.folder-attachment__folder {',
      '  --folder-attached-tab-border: var(--folder-border);',
    ].join('\n'));
    expect(folderTabsCss).toContain('transform: translate3d(var(--folder-piece-x), var(--folder-piece-y), 0px);');
    expect(folderTabsCss).toContain([
      '.folder-attachment--stack-rotation-pieces .folder-attachment__folder {',
      '  transform: translate3d(var(--folder-piece-x), var(--folder-piece-y), 0px) rotate(var(--folder-piece-rotate));',
      '}',
    ].join('\n'));
    expect(folderTabsCss).not.toContain('transform: translate3d(var(--folder-piece-rest-x), var(--folder-piece-rest-y), 0px);');
    expect(folderTabsCss).not.toContain('transform: translate3d(var(--folder-piece-pull-x), var(--folder-piece-pull-y), 0px);');
  });

  it('lets integrations tune the physical pull distance explicitly', () => {
    expect(getFolderPullOffset('top')).toEqual({ x: 0, y: 0 });
    expect(getFolderPullOffset('top', 8)).toEqual({ x: 0, y: -8 });
    expect(getFolderPullOffset('right', 12)).toEqual({ x: 12, y: 0 });
    expect(getFolderPullOffset('bottom', 0)).toEqual({ x: 0, y: 0 });
    expect(getFolderPullOffset('left', -4)).toEqual({ x: 0, y: 0 });
    expect(normalizeFolderPullDistance(Number.NaN)).toBe(0);
    expect(normalizeFolderPullDistance(5.5)).toBe(5.5);
  });

  it('can rotate tucked folder sheets and tab handles independently', () => {
    expect(folderTabsCss).toContain([
      '.folder-attachment__sheet {',
      '  position: absolute;',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-attachment--stack-rotation-folders .folder-attachment__sheet {',
      '  transform: rotate(var(--folder-piece-rotate));',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-attachment--stack-rotation-folders.folder-attachment--tab-rotation-rotated .folder-attachment__folder:not(.is-active) {',
      '  --folder-tab-rotate: var(--folder-tab-piece-rotate);',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-attachment--stack-rotation-pieces.folder-attachment--tab-rotation-straight .folder-attachment__folder:not(.is-active) {',
      '  --folder-tab-rotate: var(--folder-tab-counter-rotate);',
      '}',
    ].join('\n'));
    expect(folderTabsCss).not.toContain('.folder-attachment--stack-rotation-folders .folder-attachment__folder {\n  transform: translate3d(var(--folder-piece-x), var(--folder-piece-y), 0px) rotate(var(--folder-piece-rotate));');
  });

  it('removes attached tab borders when whole physical pieces rotate', () => {
    expect(folderTabsCss).toContain([
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab,',
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab:hover,',
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab:focus-visible,',
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab.is-active,',
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab.is-expanded,',
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab.is-hovered,',
      '.folder-attachment--stack-rotation-pieces .folder-attachment__tab.is-open {',
      '  border-color: transparent;',
      '}',
    ].join('\n'));
  });

  it('keeps active pulled folders visually pinned without waiting for motion', () => {
    expect(folderTabsCss).toContain('.folder-attachment__folder.is-active.is-pulled');
    expect(folderTabsCss).toContain([
      '.folder-attachment__folder.is-active.is-pulled,',
      '.folder-attachment__folder.is-active.is-pulled .folder-attachment__sheet,',
      '.folder-attachment__folder.is-active.is-pulled .folder-attachment__tab {',
      '  transition-duration: 0ms;',
      '}',
    ].join('\n'));
  });

  it('shows newly selected folders immediately while the outgoing folder returns', () => {
    expect(folderTabsCss).toContain([
      '.folder-attachment__folder.is-selecting,',
      '.folder-attachment__folder.is-selecting .folder-attachment__sheet,',
      '.folder-attachment__folder.is-selecting .folder-attachment__tab {',
      '  transition-duration: 0ms;',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain('.folder-attachment__folder.is-returning {');
    expect(folderTabsCss).toContain('transition-duration: var(--folder-motion-return-duration);');
  });

  it('keeps tucked folders pinned to their current remembered rest variables', () => {
    expect(folderTabsCss).toContain([
      '.folder-attachment__folder.is-tucked {',
      '  transition-duration: 0ms;',
      '}',
    ].join('\n'));
  });

  it('uses physical size fallbacks so side reach lanes cannot collapse to compact width', () => {
    expect(folderTabsCss).toContain('height var(--folder-motion-duration) var(--folder-motion-ease),');
    expect(folderTabsCss).toContain('width var(--folder-motion-duration) var(--folder-motion-ease),');
    expect(folderTabsCss).toContain([
      '.folder-attachment__folder--vertical .folder-attachment__tab {',
      '  width: var(--folder-attached-tab-reach-size);',
      '  height: var(--folder-attached-tab-compact-size);',
      '  inline-size: var(--folder-attached-tab-reach-size);',
      '  block-size: var(--folder-attached-tab-compact-size);',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-attachment__folder--vertical .folder-attachment__tab.is-open,',
      '.folder-attachment__folder--vertical .folder-attachment__tab.is-expanded,',
      '.folder-attachment--expand-always .folder-attachment__folder--vertical .folder-attachment__tab {',
      '  width: var(--folder-attached-tab-reach-size);',
      '  height: var(--folder-attached-tab-open-size);',
      '  inline-size: var(--folder-attached-tab-reach-size);',
      '  block-size: var(--folder-attached-tab-open-size);',
      '}',
    ].join('\n'));
  });

  it('keeps attached folder expansion owned by component state classes', () => {
    expect(folderTabsCss).toContain('.folder-attachment__folder--horizontal .folder-attachment__tab.is-expanded,');
    expect(folderTabsCss).toContain('.folder-attachment__folder--vertical .folder-attachment__tab.is-expanded,');
    expect(folderTabsCss).not.toContain('.folder-attachment--expand-hover .folder-attachment__folder--horizontal .folder-attachment__tab:hover');
    expect(folderTabsCss).not.toContain('.folder-attachment--expand-hover .folder-attachment__folder--vertical .folder-attachment__tab:hover');
    expect(folderTabsCss).not.toContain('.folder-attachment--expand-focus .folder-attachment__folder--horizontal .folder-attachment__tab:focus-visible');
    expect(folderTabsCss).not.toContain('.folder-attachment--expand-focus .folder-attachment__folder--vertical .folder-attachment__tab:focus-visible');
  });

  it('keeps hidden attachment measurement tabs from forming a horizontal overflow rail', () => {
    expect(folderTabsCss).toContain([
      '.folder-attachment__measurer {',
      '  position: fixed;',
      '  inset: 0 auto auto 0;',
      '  z-index: -1;',
      '  display: grid;',
      '  grid-auto-flow: row;',
    ].join('\n'));
    expect(folderTabsCss).not.toContain([
      '.folder-attachment__measurer {',
      '  position: fixed;',
      '  inset: 0 auto auto 0;',
      '  z-index: -1;',
      '  display: flex;',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-attachment__measure-tab .folder-attachment__tab-icon,',
      '.folder-attachment__measure-tab .folder-attachment__tab-label,',
      '.folder-attachment__measure-tab .folder-attachment__tab-count,',
      '.folder-attachment__measure-tab .folder-attachment__tab-lock {',
      '  position: static;',
      '  opacity: 1;',
      '  transform: none;',
      '}',
    ].join('\n'));
    expect(folderTabsCss).not.toContain('  transform: none;\n  visibility: visible;\n}');
  });

  it('keeps reduced-motion overrides after physical folder transitions', () => {
    const folderTransitionRuleIndex = folderTabsCss.indexOf('.folder {\n  position: relative;');
    const reducedMotionPhysicalRuleIndex = folderTabsCss.lastIndexOf('@media (prefers-reduced-motion: reduce) {');
    const reducedMotionPhysicalRule = folderTabsCss.slice(reducedMotionPhysicalRuleIndex);

    expect(folderTransitionRuleIndex).toBeGreaterThan(-1);
    expect(reducedMotionPhysicalRuleIndex).toBeGreaterThan(folderTransitionRuleIndex);
    expect(folderTabsCss).toContain('  .folder-tabs__tab::before,');
    expect(folderTabsCss).toContain('  .folder-tabs__tab::after,');
    expect(reducedMotionPhysicalRule).toContain('.folder-attachment__tab-icon,');
    expect(reducedMotionPhysicalRule).toContain('.folder-attachment__tab-label,');
    expect(reducedMotionPhysicalRule).toContain('.folder-attachment__tab-count,');
    expect(reducedMotionPhysicalRule).toContain('    transition: none !important;');
    expect(reducedMotionPhysicalRule).toContain('    animation: none !important;');
    expect(folderTabsCss).not.toContain('    transition: none;\n');
  });

  it('keeps standalone horizontal tabs free of panel-seam underlines', () => {
    expect(folderTabsCss).toContain([
      '.folder-tabs--horizontal .folder-tabs__tab::before {',
      '  inset-inline: 0.5rem;',
      '  inset-block-end: 0;',
      '  block-size: 1px;',
      '  display: none;',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-tabs--horizontal .folder-tabs__tab::after {',
      '  inset-inline: 0;',
      '  inset-block-end: -1px;',
      '  block-size: 1px;',
      '  display: none;',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain([
      '.folder-tabs--horizontal .folder-tabs__tab:hover {',
      '  box-shadow:',
      '    0 0.65rem 1.45rem rgba(0, 0, 0, 0.18),',
      '    inset 0 1px 0 rgba(255, 255, 255, 0.055);',
      '  transform: translateY(var(--ft-hover-lift));',
      '}',
    ].join('\n'));
    expect(folderTabsCss).not.toContain('box-shadow: inset 0 -1px 0 var(--ft-surface-active), var(--ft-shadow);');
  });

  it('lets each attached folder piece own tab geometry independently of root orientation', () => {
    expect(folderTabsCss).toContain('.folder-attachment__folder--vertical .folder-attachment__tab {');
    expect(folderTabsCss).toContain('.folder-attachment__folder--edge-right .folder-attachment__tab {');
    expect(folderTabsCss).toContain('--folder-tab-slot: var(--folder-piece-slot);');
    expect(folderTabsCss).toContain('inset-block-start: calc(var(--folder-tab-slot) - var(--folder-attachment-border-width));');
    expect(folderTabsCss).toContain('inset-inline-start: calc(var(--folder-tab-slot) - var(--folder-attachment-border-width));');
    expect(folderTabsCss).toContain('.folder-attachment__folder--horizontal .folder-attachment__tab.is-open');
    expect(folderTabsCss).toContain('.folder-attachment__folder--vertical .folder-attachment__tab.is-open');
    expect(folderTabsCss).toContain('--folder-attached-tab-grab-size: var(--folder-attached-tab-cross-size);');
    expect(folderTabsCss).toContain('block-size: var(--folder-attached-tab-reach-size);');
    expect(folderTabsCss).toContain('inline-size: var(--folder-attached-tab-reach-size);');
    expect(folderTabsCss).toContain('inset-inline-start: calc(var(--folder-attached-tab-reach-size) - (var(--folder-attached-tab-grab-size) / 2));');
    expect(folderTabsCss).not.toMatch(/\.folder-attachment--(?:horizontal|vertical|mixed-edge)[^{]*\.folder-attachment__tab/);
    expect(folderTabsCss).not.toMatch(/\.folder-attachment--edge-(?:top|bottom|left|right)[^{]*\.folder-attachment__tab/);
  });

  it('keeps vertical attached tab counts in a bottom lane instead of stretching through labels', () => {
    const verticalCountRule = [
      '.folder-attachment__folder--vertical .folder-attachment__tab-count {',
      '  inset-block-start: auto;',
      '  inset-block-end: var(--folder-attached-tab-vertical-count-offset);',
      '  inset-inline-start: 50%;',
      '  inset-inline-end: auto;',
    ].join('\n');

    expect(folderTabsCss).toContain('--folder-attached-tab-vertical-label-size: max(4.75rem, calc(var(--folder-attached-tab-open-size) - 4.9rem));');
    expect(folderTabsCss).toContain('--folder-attached-tab-vertical-icon-offset: 0.78rem;');
    expect(folderTabsCss).toContain('--folder-attached-tab-vertical-count-offset: 0.72rem;');
    expect(folderTabsCss).toContain(verticalCountRule);
    expect(folderTabsCss).toContain('  min-inline-size: 1.35rem;\n  text-align: center;');
  });

  it('renders accessible tablist semantics and compact active labels', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    expect(wrapper.attributes('role')).toBe('tablist');
    expect(wrapper.attributes('aria-label')).toBe('Media folders');
    expect(wrapper.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 1/15');
    expect(wrapper.find('[role="tab"]').attributes('id')).toMatch(/^folder-tabs-/);
    expect(wrapper.find('[role="tab"]').attributes('aria-controls')).toBeUndefined();
    expect(wrapper.find('.folder-tabs__label').text()).toBe('Photos');
  });

  it('renders attachment measurement controls as an inert hidden subtree', () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });
    const measurer = wrapper.find('.folder-attachment__measurer');

    expect(measurer.attributes('aria-hidden')).toBe('true');
    expect(measurer.attributes()).toHaveProperty('inert');
    expect(measurer.findAll('.folder-attachment__measure-tab'))
      .toHaveLength(tabs.length * 2);
    for (const measureTab of measurer.findAll('.folder-attachment__measure-tab')) {
      expect(measureTab.attributes('tabindex')).toBe('-1');
    }
  });

  it('renders explicit countLabel-only counts visibly as well as accessibly', () => {
    const explicitCountTabs: FolderTabItem[] = [
      { key: 'docs', label: 'Documents', shortLabel: 'Docs', countLabel: '12' },
      { key: 'notes', label: 'Notes', shortLabel: 'Notes' },
    ];

    const rail = mount(FolderTabs, {
      props: {
        tabs: explicitCountTabs,
        modelValue: 'docs',
        ariaLabel: 'Document folders',
      },
    });

    expect(rail.find('[role="tab"]').attributes('aria-label')).toBe('Documents, 12');
    expect(rail.find('.folder-tabs__count').text()).toBe('12');

    const attached = mount(FolderAttachment, {
      props: {
        tabs: explicitCountTabs,
        modelValue: 'docs',
        ariaLabel: 'Attached document folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(attached.find('[role="tab"]').attributes('aria-label')).toBe('Documents, 12');
    expect(attached.find('.folder-attachment__tab-count').text()).toBe('12');
  });

  it('treats countLabel as the complete visible count instead of appending total suffixes', () => {
    const overrideTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Object photos', shortLabel: 'Photos', count: 1, totalCount: 15, countLabel: '15' },
    ];

    const rail = mount(FolderTabs, {
      props: {
        tabs: overrideTabs,
        modelValue: 'photos',
        ariaLabel: 'Photo folders',
      },
    });

    expect(rail.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 15');
    expect(rail.find('.folder-tabs__count').text()).toBe('15');
    expect(rail.find('.folder-tabs__lock').exists()).toBe(false);

    const attached = mount(FolderAttachment, {
      props: {
        tabs: overrideTabs,
        modelValue: 'photos',
        ariaLabel: 'Attached photo folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(attached.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 15');
    expect(attached.find('.folder-attachment__tab-count').text()).toBe('15');
    expect(attached.find('.folder-attachment__tab-lock').exists()).toBe(false);
  });

  it('does not render invalid runtime label or count values as object text', () => {
    const runtimeTextTabs = [
      {
        key: 'photos',
        label: 'Object photos',
        shortLabel: {},
        srLabel: {},
        count: 1,
        totalCount: 15,
        countLabel: {},
      },
      {
        key: 'plans',
        label: 'Floor plans',
        count: {},
        totalCount: 8,
      },
      {
        key: 'audit',
        label: 'Audit',
        count: 3,
        totalCount: 'Infinity',
      },
    ] as any;

    const rail = mount(FolderTabs, {
      props: {
        tabs: runtimeTextTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime text folders',
      },
    });

    const attached = mount(FolderAttachment, {
      props: {
        tabs: runtimeTextTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime attached text folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(rail.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 1/15');
    expect(rail.find('.folder-tabs__label').text()).toBe('Object photos');
    expect(rail.find('.folder-tabs__count').text()).toBe('1/15');
    expect(rail.html()).not.toContain('[object Object]');
    expect(attached.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 1/15');
    expect(attached.find('.folder-attachment__tab-label').text()).toBe('Object photos');
    expect(attached.find('.folder-attachment__tab-count').text()).toBe('1/15');
    expect(attached.find('.folder-attachment__tab-lock').text()).toBe('/15');
    expect(attached.html()).not.toContain('[object Object]');
    expect(attached.html()).not.toContain('Infinity');
  });

  it('sizes standalone tab labels from measured pixel geometry', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    Object.defineProperty(wrapper.find('.folder-tabs__label').element, 'scrollWidth', {
      configurable: true,
      value: 96,
    });
    Object.defineProperty(wrapper.find('.folder-tabs__count').element, 'scrollWidth', {
      configurable: true,
      value: 32,
    });

    window.dispatchEvent(new Event('resize'));
    await waitForMotionFrame();

    const activeTabStyle = wrapper.find('[role="tab"]').attributes('style') ?? '';

    expect(activeTabStyle).toContain('--folder-tab-label-size: 96.00px');
    expect(activeTabStyle).toContain('--folder-tab-count-size: 32.00px');
    expect(activeTabStyle).not.toContain('ch');
  });

  it('keeps standalone measured CSS variables finite when DOM metrics are non-finite', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    Object.defineProperty(wrapper.find('.folder-tabs__label').element, 'scrollWidth', {
      configurable: true,
      value: Number.POSITIVE_INFINITY,
    });
    Object.defineProperty(wrapper.find('.folder-tabs__count').element, 'scrollWidth', {
      configurable: true,
      value: Number.NaN,
    });

    window.dispatchEvent(new Event('resize'));
    await waitForMotionFrame();

    const activeTabStyle = wrapper.find('[role="tab"]').attributes('style') ?? '';

    expect(activeTabStyle).toContain('--folder-tab-label-size: 88.00px');
    expect(activeTabStyle).toContain('--folder-tab-count-size: 28.00px');
    expect(activeTabStyle).not.toContain('Infinity');
    expect(activeTabStyle).not.toContain('NaN');
  });

  it('does not reuse stale standalone measurements when a removed tab key returns', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    Object.defineProperty(wrapper.findAll('.folder-tabs__label')[1].element, 'scrollWidth', {
      configurable: true,
      value: 180,
    });

    window.dispatchEvent(new Event('resize'));
    await waitForMotionFrame();

    expect(wrapper.findAll('[role="tab"]')[1].attributes('style'))
      .toContain('--folder-tab-label-size: 180.00px');

    await wrapper.setProps({ tabs: tabs.filter((tab) => tab.key !== 'plans') });
    await nextTick();
    await wrapper.setProps({ tabs });
    await nextTick();

    expect(wrapper.findAll('[role="tab"]')[1].attributes('style'))
      .toContain('--folder-tab-label-size: 88.00px');
    expect(wrapper.findAll('[role="tab"]')[1].attributes('style'))
      .not.toContain('--folder-tab-label-size: 180.00px');
  });

  it('does not schedule standalone measurement frames after immediate unmount', async () => {
    const requestFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 456);
    const cancelFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    try {
      const wrapper = mount(FolderTabs, {
        props: {
          tabs,
          modelValue: 'photos',
          ariaLabel: 'Media folders',
        },
      });

      expect(requestFrameSpy).toHaveBeenCalledTimes(1);

      wrapper.unmount();
      expect(cancelFrameSpy).toHaveBeenCalledWith(456);

      await nextTick();

      expect(requestFrameSpy).toHaveBeenCalledTimes(1);
    } finally {
      requestFrameSpy.mockRestore();
      cancelFrameSpy.mockRestore();
    }
  });

  it('keeps attached measured CSS variables finite when DOM metrics are non-finite', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    for (const measureTab of wrapper.findAll('.folder-attachment__measure-tab')) {
      Object.defineProperty(measureTab.element, 'scrollHeight', {
        configurable: true,
        value: Number.POSITIVE_INFINITY,
      });
      Object.defineProperty(measureTab.element, 'scrollWidth', {
        configurable: true,
        value: Number.NaN,
      });
      measureTab.element.getBoundingClientRect = () => ({
        bottom: Number.POSITIVE_INFINITY,
        height: Number.POSITIVE_INFINITY,
        left: 0,
        right: Number.POSITIVE_INFINITY,
        top: 0,
        width: Number.POSITIVE_INFINITY,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
    }

    window.dispatchEvent(new Event('resize'));
    await waitForMotionFrame();

    const activeFolderStyle = wrapper.find('.folder-attachment__folder.is-active').attributes('style') ?? '';
    const activeTabStyle = wrapper.find('[role="tab"][aria-selected="true"]').attributes('style') ?? '';

    expect(activeFolderStyle).toContain('--folder-attached-tab-grab-size: 44.00px');
    expect(activeFolderStyle).toContain('--folder-attached-tab-reach-size: 44.00px');
    expect(activeTabStyle).toContain('--folder-attached-tab-compact-size: 44.00px');
    expect(activeTabStyle).toContain('--folder-attached-tab-open-size: 60.00px');
    expect(`${activeFolderStyle}${activeTabStyle}`).not.toContain('Infinity');
    expect(`${activeFolderStyle}${activeTabStyle}`).not.toContain('NaN');
  });

  it('does not reuse stale attached measurements when a removed folder key returns', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const plansOpenMeasure = wrapper.findAll('.folder-attachment__measure-tab--open')[1].element;

    plansOpenMeasure.getBoundingClientRect = () => ({
      bottom: 44,
      height: 44,
      left: 0,
      right: 180,
      top: 0,
      width: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    window.dispatchEvent(new Event('resize'));
    await waitForMotionFrame();

    expect(wrapper.findAll('[role="tab"]')[1].attributes('style'))
      .toContain('--folder-attached-tab-open-size: 196.00px');

    await wrapper.setProps({ tabs: tabs.filter((tab) => tab.key !== 'plans') });
    await nextTick();
    await wrapper.setProps({ tabs });
    await nextTick();

    expect(wrapper.findAll('[role="tab"]')[1].attributes('style'))
      .toContain('--folder-attached-tab-open-size: 156.00px');
    expect(wrapper.findAll('[role="tab"]')[1].attributes('style'))
      .not.toContain('--folder-attached-tab-open-size: 196.00px');
  });

  it('uses explicit external panel ids on the standalone rail without generating internal panels', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        panelIdForTab: (tab: FolderTabItem) => ` standalone-panel-${tab.key} `,
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('aria-controls')).toBe('standalone-panel-photos');
    expect(renderedTabs[1].attributes('aria-controls')).toBe('standalone-panel-plans');
    expect(renderedTabs[0].attributes('id')).toMatch(/^folder-tabs-/);
    expect(renderedTabs[1].attributes('id')).toMatch(/^folder-tabs-/);
    expect(renderedTabs[0].attributes('id')).not.toBe(renderedTabs[1].attributes('id'));
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false);
  });

  it('omits duplicate standalone aria-controls instead of pointing multiple tabs at one panel id', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Duplicate external panel folders',
        panelIdForTab: () => 'shared-panel',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('aria-controls')).toBe('shared-panel');
    expect(renderedTabs[1].attributes('aria-controls')).toBeUndefined();
    expect(renderedTabs[2].attributes('aria-controls')).toBeUndefined();
    expect(renderedTabs[3].attributes('aria-controls')).toBeUndefined();
    expect(renderedTabs.map((tab) => tab.attributes('aria-controls')).filter(Boolean)).toEqual(['shared-panel']);
  });

  it('falls back to tab panel ids when standalone callback panel ids collide', () => {
    const panelFallbackTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Photos', panelId: 'tab-panel-photos' },
      { key: 'plans', label: 'Plans', panelId: 'tab-panel-plans' },
      { key: 'docs', label: 'Docs', panelId: 'shared-panel' },
    ];
    const wrapper = mount(FolderTabs, {
      props: {
        tabs: panelFallbackTabs,
        modelValue: 'photos',
        ariaLabel: 'Fallback external panel folders',
        panelIdForTab: () => 'shared-panel',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('aria-controls')).toBe('shared-panel');
    expect(renderedTabs[1].attributes('aria-controls')).toBe('tab-panel-plans');
    expect(renderedTabs[2].attributes('aria-controls')).toBeUndefined();
    expect(new Set(renderedTabs.map((tab) => tab.attributes('aria-controls')).filter(Boolean)).size).toBe(2);
  });

  it('ignores invalid runtime panel ids on the standalone rail', () => {
    const runtimePanelTabs = [
      { key: 'photos', label: 'Photos', panelId: {} },
      { key: 'plans', label: 'Plans', panelId: 'external panel plans' },
      { key: 'docs', label: 'Docs', panelId: 'external-panel-docs' },
    ] as any;

    const wrapper = mount(FolderTabs, {
      props: {
        tabs: runtimePanelTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime panel folders',
        panelIdForTab: (tab: FolderTabItem) => (tab.key === 'photos' ? { id: 'bad' } : ''),
      } as any,
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('aria-controls')).toBeUndefined();
    expect(renderedTabs[1].attributes('aria-controls')).toBeUndefined();
    expect(renderedTabs[2].attributes('aria-controls')).toBe('external-panel-docs');
    expect(renderedTabs.map((tab) => tab.attributes('aria-controls') ?? ''))
      .not.toContain('[object Object]');
    expect(renderedTabs.map((tab) => tab.attributes('aria-controls') ?? ''))
      .not.toContain('external panel plans');
  });

  it('ignores invalid standalone panel id callback props at runtime', () => {
    const runtimePanelTabs = [
      { key: 'photos', label: 'Photos', panelId: 'external-panel-photos' },
      { key: 'plans', label: 'Plans' },
    ] as any;

    const wrapper = mount(FolderTabs, {
      props: {
        tabs: runtimePanelTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime panel callback folders',
        panelIdForTab: { id: 'bad-callback' },
      } as any,
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('aria-controls')).toBe('external-panel-photos');
    expect(renderedTabs[1].attributes('aria-controls')).toBeUndefined();
    expect(renderedTabs.map((tab) => tab.attributes('aria-controls') ?? '')).not.toContain('bad-callback');
  });

  it('deduplicates rendered tabs by string key identity', () => {
    const duplicateTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Original photos' },
      { key: 'photos', label: 'Duplicate photos' },
      { key: 12, label: 'Numeric report' },
      { key: '12', label: 'String duplicate report' },
    ];

    const wrapper = mount(FolderTabs, {
      props: {
        tabs: duplicateTabs,
        modelValue: 'photos',
        ariaLabel: 'Duplicate-safe folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    expect(renderedTabs).toHaveLength(2);
    expect(renderedTabs.map((tab) => tab.attributes('aria-label'))).toEqual(['Original photos', 'Numeric report']);
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
  });

  it('skips invalid runtime tab keys before rendering tablist state', () => {
    const runtimeTabs = [
      { key: 'photos', label: 'Photos' },
      { key: {}, label: 'Object key' },
      { key: false, label: 'Boolean key' },
      { key: Symbol('symbol'), label: 'Symbol key' },
      { key: () => 'function', label: 'Function key' },
      { key: 0, label: 'Zero key' },
    ] as any;

    const rail = mount(FolderTabs, {
      props: {
        tabs: runtimeTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime-safe folders',
      },
    });

    const attachment = mount(FolderAttachment, {
      props: {
        tabs: runtimeTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime-safe attached folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(rail.findAll('[role="tab"]').map((tab) => tab.attributes('aria-label')))
      .toEqual(['Photos', 'Zero key']);
    expect(attachment.findAll('[role="tab"]').map((tab) => tab.attributes('aria-label')))
      .toEqual(['Photos', 'Zero key']);
    expect(attachment.findAll('.folder-attachment__folder')).toHaveLength(2);
  });

  it('renders reactive icon components without Vue component proxy warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reactiveTabs = reactive(tabs.map((tab) => ({ ...tab }))) as FolderTabItem[];

    try {
      const rail = mount(FolderTabs, {
        props: {
          tabs: reactiveTabs,
          modelValue: 'photos',
          ariaLabel: 'Media folders',
        },
      });

      const attachment = mount(FolderAttachment, {
        props: {
          tabs: reactiveTabs,
          modelValue: 'photos',
          ariaLabel: 'Media folders',
        },
        slots: {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        },
      });

      const warningText = warn.mock.calls.flat().map((entry) => String(entry)).join('\n');
      expect(warningText).not.toContain('Vue received a Component that was made a reactive object');
      rail.unmount();
      attachment.unmount();
    } finally {
      warn.mockRestore();
    }
  });

  it('ignores invalid runtime icon values instead of rendering dynamic elements', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const invalidIconTabs = [
      { key: 'photos', label: 'Photos', icon: 'article' },
      { key: 'plans', label: 'Plans', icon: {} },
    ] as any;

    try {
      const rail = mount(FolderTabs, {
        props: {
          tabs: invalidIconTabs,
          modelValue: 'photos',
          ariaLabel: 'Runtime icon folders',
        },
      });

      const attachment = mount(FolderAttachment, {
        props: {
          tabs: invalidIconTabs,
          modelValue: 'photos',
          ariaLabel: 'Runtime attached icon folders',
        },
        slots: {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        },
      });

      const warningText = warn.mock.calls.flat().map((entry) => String(entry)).join('\n');
      expect(warningText).not.toContain('Component is missing template or render function');
      expect(warningText).not.toContain('Invalid vnode type');
      expect(rail.html()).not.toContain('<article');
      expect(attachment.html()).not.toContain('<article');
      rail.unmount();
      attachment.unmount();
    } finally {
      warn.mockRestore();
    }
  });

  it('supports stacked vertical folder appearance without changing tab semantics', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        appearance: 'stack',
      },
    });

    expect(wrapper.classes()).toContain('folder-tabs--appearance-stack');
    expect(wrapper.find('[role="tab"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.find('[role="tab"]').attributes('aria-label')).toBe('Object photos, 1/15');
  });

  it('does not let external pulled state visually pull a disabled standalone tab', () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        pulledKey: 'maps',
        ariaLabel: 'Media folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    expect(renderedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(renderedTabs[2].classes()).not.toContain('is-pulled');
    expect(renderedTabs.some((tab) => tab.classes().includes('is-pulled'))).toBe(false);
  });

  it('keeps disabled standalone tabs inert for keyboard events fired directly on them', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[2].trigger('keydown', { key: 'ArrowRight' });
    await renderedTabs[2].trigger('keydown', { key: 'Enter' });

    expect(renderedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
    expect(renderedTabs[0].attributes('tabindex')).toBe('0');
    expect(renderedTabs[2].attributes('tabindex')).toBe('-1');
  });

  it('treats non-boolean runtime disabled values as enabled in rendered tabs', async () => {
    const runtimeDisabledTabs = [
      { key: 'photos', label: 'Photos' },
      { key: 'plans', label: 'Plans', disabled: 'false' },
      { key: 'docs', label: 'Docs', disabled: true },
    ] as any;

    const rail = mount(FolderTabs, {
      props: {
        tabs: runtimeDisabledTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime disabled folders',
      },
    });
    const attached = mount(FolderAttachment, {
      props: {
        tabs: runtimeDisabledTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime disabled attached folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const railTabs = rail.findAll('[role="tab"]');
    const attachedTabs = attached.findAll('[role="tab"]');
    await railTabs[1].trigger('click');
    await attachedTabs[1].trigger('click');

    expect(railTabs[1].attributes('aria-disabled')).toBeUndefined();
    expect(railTabs[1].classes()).not.toContain('is-disabled');
    expect(railTabs[2].attributes('aria-disabled')).toBe('true');
    expect(rail.emitted('update:modelValue')).toEqual([['plans']]);
    expect(attachedTabs[1].attributes('aria-disabled')).toBeUndefined();
    expect(attachedTabs[1].classes()).not.toContain('is-disabled');
    expect(attachedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(attached.emitted('update:modelValue')).toEqual([['plans']]);
  });

  it('falls back unknown runtime enum props before generating classes or behavior', async () => {
    const rail = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime-safe rail',
        orientation: 'diagonal',
        edge: 'corner',
        density: 'loose',
        activation: 'instant',
        expandOn: 'touch',
        gravity: 'middle',
        appearance: 'accordion',
        texture: 'linen',
        textureBlendMode: 'smudge',
        textColor: 'invisible',
      } as any,
    });

    expect(rail.classes()).toContain('folder-tabs--horizontal');
    expect(rail.classes()).toContain('folder-tabs--edge-top');
    expect(rail.classes()).toContain('folder-tabs--density-spread');
    expect(rail.classes()).toContain('folder-tabs--activation-automatic');
    expect(rail.classes()).toContain('folder-tabs--expand-hover');
    expect(rail.classes()).toContain('folder-tabs--gravity-center');
    expect(rail.classes()).toContain('folder-tabs--appearance-rail');
    expect(rail.classes()).toContain('folder-tabs--texture-none');
    expect(rail.classes()).toContain('folder-tabs--texture-layer-sheet');
    expect(rail.classes()).toContain('folder-tabs--texture-layer-content');
    expect(rail.classes()).toContain('folder-tabs--texture-layer-tab');
    expect(rail.classes()).toContain('folder-tabs--texture-blend-auto');
    expect(rail.classes()).toContain('folder-tabs--text-color-auto');
    expect(rail.classes().some((className) => className.includes('diagonal') || className.includes('corner'))).toBe(false);
    expect(rail.attributes('aria-orientation')).toBe('horizontal');

    await rail.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(rail.emitted('update:modelValue')).toEqual([['plans']]);

    const attached = mount(FolderAttachment, {
      props: {
        tabs: tabs.map((tab, index) => (index === 0 ? { ...tab, edge: 'corner' as any, tone: 'neon' as any } : tab)),
        modelValue: 'photos',
        ariaLabel: 'Runtime-safe attachment',
        orientation: 'diagonal',
        edge: 'corner',
        density: 'loose',
        activation: 'instant',
        expandOn: 'touch',
        gravity: 'middle',
        appearance: 'accordion',
        depth: 'sunken',
        tone: 'neon',
        texture: 'linen',
        textureBlendMode: 'smudge',
        textColor: 'invisible',
        tabRotation: 'sideways',
        layers: Number.NaN,
      } as any,
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(attached.classes()).toContain('folder-attachment--horizontal');
    expect(attached.classes()).toContain('folder-attachment--edge-top');
    expect(attached.classes()).toContain('folder-attachment--density-spread');
    expect(attached.classes()).toContain('folder-attachment--activation-automatic');
    expect(attached.classes()).toContain('folder-attachment--expand-hover');
    expect(attached.classes()).toContain('folder-attachment--gravity-center');
    expect(attached.classes()).toContain('folder-attachment--appearance-rail');
    expect(attached.classes()).toContain('folder-attachment--texture-none');
    expect(attached.classes()).toContain('folder-attachment--texture-layer-sheet');
    expect(attached.classes()).toContain('folder-attachment--texture-layer-content');
    expect(attached.classes()).toContain('folder-attachment--texture-layer-tab');
    expect(attached.classes()).toContain('folder-attachment--texture-blend-auto');
    expect(attached.classes()).toContain('folder-attachment--text-color-auto');
    expect(attached.classes()).toContain('folder-attachment--tab-rotation-straight');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--depth-raised');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--layers-2');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--tone-slate');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--texture-none');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-sheet');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-content');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-tab');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--texture-blend-auto');
    expect(attached.find('.folder-binder').classes()).toContain('folder-binder--text-color-auto');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--tone-slate');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-none');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-layer-sheet');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-layer-content');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-layer-tab');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-blend-auto');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder--text-color-auto');
    expect(attached.find('.folder-attachment__folder.is-active').classes()).toContain('folder-attachment__folder--edge-top');

    const binder = mount({
      render: () => h(FolderBinder, {
        orientation: 'diagonal',
        edge: 'corner',
        depth: 'sunken',
        layers: Number.NaN,
        activeIndex: Number.POSITIVE_INFINITY,
        tone: 'neon',
        texture: 'linen',
        textureBlendMode: 'smudge',
        textColor: 'invisible',
        pulled: 'false',
      } as any, {
        default: () => h(Folder, {
          tone: 'neon' as any,
          texture: 'linen' as any,
          textureBlendMode: 'smudge' as any,
          textColor: 'invisible' as any,
        }, () => 'Folder content'),
      }),
    });

    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--edge-top');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--depth-raised');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--layers-2');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--tone-slate');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-none');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-sheet');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-content');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-tab');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-blend-auto');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--text-color-auto');
    expect(binder.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(binder.find('.folder-binder').attributes('style')).toContain('--folder-binder-active-index: 0');
    expect(binder.find('.folder').classes()).toContain('folder--tone-slate');
    expect(binder.find('.folder').classes()).toContain('folder--texture-none');
    expect(binder.find('.folder').classes()).toContain('folder--texture-layer-sheet');
    expect(binder.find('.folder').classes()).toContain('folder--texture-layer-content');
    expect(binder.find('.folder').classes()).toContain('folder--texture-layer-tab');
    expect(binder.find('.folder').classes()).toContain('folder--texture-blend-auto');
    expect(binder.find('.folder').classes()).toContain('folder--text-color-auto');

    const panelStack = mount(FolderTabPanelStack, {
      props: {
        orientation: 'diagonal',
        edge: 'corner',
        depth: 'sunken',
        layers: Number.NaN,
        activeIndex: Number.POSITIVE_INFINITY,
        tone: 'neon',
        texture: 'linen',
        textureBlendMode: 'smudge',
        textColor: 'invisible',
        pulled: 'false',
      } as any,
      slots: {
        default: 'Panel content',
      },
    });

    expect(panelStack.classes()).toContain('folder-tab-panel-stack--edge-top');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--depth-raised');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--layers-2');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--tone-slate');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-none');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-layer-sheet');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-layer-content');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-layer-tab');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-blend-auto');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--text-color-auto');
    expect(panelStack.classes()).not.toContain('is-pulled');
    expect(panelStack.attributes('style')).toContain('--folder-tab-panel-active-index: 0');
  });

  it('emits v-model updates when automatic keyboard activation is enabled', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    await wrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['plans']);
    expect(wrapper.emitted('activate')).toHaveLength(1);
    expect(wrapper.emitted('activate')?.[0]?.[0]).toBe('plans');
  });

  it('only consumes arrow keys that match the rendered standalone tablist orientation', async () => {
    const horizontal = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Horizontal media folders',
        orientation: 'horizontal',
      },
    });

    await horizontal.find('[role="tab"]').trigger('keydown', { key: 'ArrowDown' });
    expect(horizontal.emitted('update:modelValue')).toBeUndefined();

    await horizontal.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(horizontal.emitted('update:modelValue')).toEqual([['plans']]);

    const vertical = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Vertical media folders',
        orientation: 'vertical',
      },
    });

    await vertical.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(vertical.emitted('update:modelValue')).toBeUndefined();

    await vertical.find('[role="tab"]').trigger('keydown', { key: 'ArrowDown' });
    expect(vertical.emitted('update:modelValue')).toEqual([['plans']]);
  });

  it('keeps standalone boundary keys from re-activating the current tab', async () => {
    const firstTabWrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Boundary media folders',
      },
    });

    const firstTab = firstTabWrapper.findAll('[role="tab"]')[0];
    await firstTab.trigger('keydown', { key: 'ArrowLeft' });
    await firstTab.trigger('keydown', { key: 'Home' });

    expect(firstTabWrapper.emitted('update:modelValue')).toBeUndefined();
    expect(firstTabWrapper.emitted('activate')).toBeUndefined();
    expect(firstTab.classes()).not.toContain('is-grabbing');
    expect(firstTabWrapper.findAll('[role="tab"]')[1].attributes('tabindex')).toBe('-1');

    const lastTabWrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'docs',
        ariaLabel: 'Boundary media folders',
      },
    });

    const lastTab = lastTabWrapper.findAll('[role="tab"]')[3];
    await lastTab.trigger('keydown', { key: 'ArrowRight' });
    await lastTab.trigger('keydown', { key: 'End' });

    expect(lastTabWrapper.emitted('update:modelValue')).toBeUndefined();
    expect(lastTabWrapper.emitted('activate')).toBeUndefined();
    expect(lastTab.classes()).not.toContain('is-grabbing');
    expect(lastTabWrapper.findAll('[role="tab"]')[0].attributes('tabindex')).toBe('-1');
  });

  it('keeps standalone same-value activation idempotent while fallback selections can commit', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Same tab media folders',
      },
    });

    const firstTab = wrapper.findAll('[role="tab"]')[0];
    await firstTab.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
    expect(firstTab.classes()).not.toContain('is-grabbing');
    expect(wrapper.findAll('[role="tab"]')[1].classes()).not.toContain('is-receding');

    const manual = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Same tab manual media folders',
        activation: 'manual',
      },
    });

    await manual.findAll('[role="tab"]')[0].trigger('keydown', { key: 'Enter' });
    await manual.findAll('[role="tab"]')[0].trigger('keydown', { key: ' ' });

    expect(manual.emitted('update:modelValue')).toBeUndefined();
    expect(manual.emitted('activate')).toBeUndefined();
    expect(manual.findAll('[role="tab"]')[0].classes()).not.toContain('is-grabbing');

    const fallback = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'missing',
        ariaLabel: 'Fallback media folders',
      },
    });

    await fallback.findAll('[role="tab"]')[0].trigger('click');

    expect(fallback.emitted('update:modelValue')).toEqual([['photos']]);
    expect(fallback.emitted('activate')?.[0]?.[0]).toBe('photos');
    expect(fallback.findAll('[role="tab"]')[0].classes()).toContain('is-grabbing');
  });

  it('marks the selected tab as grabbed while the previous tab recedes', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('click');

    expect(renderedTabs[1].classes()).toContain('is-grabbing');
    expect(renderedTabs[0].classes()).toContain('is-receding');
  });

  it('keeps manual activation to focus movement only', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
      },
      attachTo: document.body,
    });

    await wrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Floor plans, 2');
    wrapper.unmount();
  });

  it('does not focus stale standalone tabs after unmounting before queued focus flushes', async () => {
    const focusSpy = vi.spyOn(HTMLButtonElement.prototype, 'focus')
      .mockImplementation(() => undefined);
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
      },
    });

    try {
      dispatchKeyboardEvent(wrapper.find('[role="tab"]').element, 'ArrowRight');
      wrapper.unmount();
      await nextTick();

      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      focusSpy.mockRestore();
    }
  });

  it('only consumes arrow keys that match the rendered attached tablist orientation', async () => {
    const horizontal = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Horizontal attached folders',
        orientation: 'horizontal',
        edge: 'top',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await horizontal.find('[role="tab"]').trigger('keydown', { key: 'ArrowDown' });
    expect(horizontal.emitted('update:modelValue')).toBeUndefined();

    await horizontal.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(horizontal.emitted('update:modelValue')).toEqual([['plans']]);

    const vertical = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Vertical attached folders',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await vertical.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(vertical.emitted('update:modelValue')).toBeUndefined();

    await vertical.find('[role="tab"]').trigger('keydown', { key: 'ArrowDown' });
    expect(vertical.emitted('update:modelValue')).toEqual([['plans']]);
  });

  it('keeps attached boundary keys from re-pulling the current folder', async () => {
    const firstFolderWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Boundary attached folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const firstTab = firstFolderWrapper.findAll('[role="tab"]')[0];
    await firstTab.trigger('keydown', { key: 'ArrowUp' });
    await firstTab.trigger('keydown', { key: 'Home' });

    expect(firstFolderWrapper.emitted('update:modelValue')).toBeUndefined();
    expect(firstFolderWrapper.emitted('activate')).toBeUndefined();
    expect(firstFolderWrapper.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');
    expect(firstTab.classes()).not.toContain('is-open');
    expect(firstFolderWrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(firstFolderWrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Object photos');

    const lastFolderWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'docs',
        ariaLabel: 'Boundary attached folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const lastTab = lastFolderWrapper.findAll('[role="tab"]')[3];
    await lastTab.trigger('keydown', { key: 'ArrowDown' });
    await lastTab.trigger('keydown', { key: 'End' });

    expect(lastFolderWrapper.emitted('update:modelValue')).toBeUndefined();
    expect(lastFolderWrapper.emitted('activate')).toBeUndefined();
    expect(lastFolderWrapper.findAll('.folder-attachment__folder')[3].classes()).not.toContain('is-pulling');
    expect(lastTab.classes()).not.toContain('is-open');
    expect(lastFolderWrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(lastFolderWrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Documents');
  });

  it('keeps attached same-value activation idempotent while fallback selections can commit', async () => {
    const topRightTabs: FolderTabItem[] = tabs.map((tab, index) => ({
      ...tab,
      edge: 'top',
      gravity: index < 2 ? 'start' : 'end',
    }));
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: topRightTabs,
        modelValue: 'docs',
        ariaLabel: 'Same attached folder',
        orientation: 'horizontal',
        edge: 'top',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const activeFolderBefore = wrapper.findAll('.folder-attachment__folder')[3];
    expect(activeFolderBefore.classes()).toContain('is-active');
    expect(activeFolderBefore.classes()).not.toContain('is-pulling');
    expect(activeFolderBefore.attributes('style')).toContain('--folder-piece-y: 0.00px');

    await wrapper.findAll('[role="tab"]')[3].trigger('click');
    await nextTick();

    const activeFolderAfter = wrapper.findAll('.folder-attachment__folder')[3];
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
    expect(activeFolderAfter.classes()).toContain('is-active');
    expect(activeFolderAfter.classes()).not.toContain('is-pulling');
    expect(activeFolderAfter.classes()).not.toContain('is-pulled');
    expect(activeFolderAfter.attributes('style')).toContain('--folder-piece-y: 0.00px');

    const manual = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Same attached manual folder',
        activation: 'manual',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await manual.findAll('[role="tab"]')[0].trigger('keydown', { key: 'Enter' });
    await manual.findAll('[role="tab"]')[0].trigger('keydown', { key: ' ' });

    expect(manual.emitted('update:modelValue')).toBeUndefined();
    expect(manual.emitted('activate')).toBeUndefined();
    expect(manual.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');

    const fallback = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'missing',
        ariaLabel: 'Fallback attached folder',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await fallback.findAll('[role="tab"]')[0].trigger('click');

    expect(fallback.emitted('update:modelValue')).toEqual([['photos']]);
    expect(fallback.emitted('activate')?.[0]?.[0]).toBe('photos');
    expect(fallback.findAll('.folder-attachment__folder')[0].classes()).toContain('is-pulling');
  });

  it('does not focus stale attached tabs after unmounting before queued focus flushes', async () => {
    const focusSpy = vi.spyOn(HTMLButtonElement.prototype, 'focus')
      .mockImplementation(() => undefined);
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    try {
      dispatchKeyboardEvent(wrapper.find('[role="tab"]').element, 'ArrowDown');
      wrapper.unmount();
      await nextTick();

      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      focusSpy.mockRestore();
    }
  });

  it('does not revive stale standalone focus or grab state when a tab key returns', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
      },
    });

    await wrapper.findAll('[role="tab"]')[0].trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    expect(wrapper.findAll('[role="tab"]')[1].attributes('tabindex')).toBe('0');

    await wrapper.findAll('[role="tab"]')[1].trigger('click');
    await nextTick();
    expect(wrapper.findAll('[role="tab"]')[1].classes()).toContain('is-grabbing');

    await wrapper.setProps({ tabs: tabs.filter((tab) => tab.key !== 'plans') });
    await nextTick();
    expect(wrapper.findAll('[role="tab"]')[0].attributes('tabindex')).toBe('0');

    await wrapper.setProps({ tabs });
    await nextTick();

    const restoredTabs = wrapper.findAll('[role="tab"]');
    expect(restoredTabs[0].attributes('tabindex')).toBe('0');
    expect(restoredTabs[1].attributes('tabindex')).toBe('-1');
    expect(restoredTabs[1].classes()).not.toContain('is-grabbing');
    expect(restoredTabs[0].classes()).not.toContain('is-receding');
  });

  it('clears standalone activation timers when a grabbed tab is removed', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    try {
      const wrapper = mount(FolderTabs, {
        props: {
          tabs,
          modelValue: 'photos',
          ariaLabel: 'Media folders',
          activationMotionDuration: 1000,
        },
      });

      await nextTick();
      vi.advanceTimersByTime(20);
      await nextTick();

      await wrapper.findAll('[role="tab"]')[1].trigger('click');
      await nextTick();
      vi.advanceTimersByTime(20);
      await nextTick();

      expect(wrapper.findAll('[role="tab"]')[1].classes()).toContain('is-grabbing');

      clearTimeoutSpy.mockClear();
      await wrapper.setProps({ tabs: tabs.filter((tab) => tab.key !== 'plans') });
      await nextTick();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.advanceTimersByTime(20);
      await nextTick();

      expect(wrapper.findAll('[role="tab"]').some((tab) => (
        tab.classes().includes('is-grabbing') || tab.classes().includes('is-receding')
      ))).toBe(false);

      wrapper.unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('activates the focused standalone tab with Enter or Space in manual mode', async () => {
    const enterWrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
      },
      attachTo: document.body,
    });

    await enterWrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    await enterWrapper.findAll('[role="tab"]')[1].trigger('keydown', { key: 'Enter' });

    expect(enterWrapper.emitted('update:modelValue')).toEqual([['plans']]);
    expect(enterWrapper.emitted('activate')?.[0]?.[0]).toBe('plans');
    enterWrapper.unmount();

    const spaceWrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        activation: 'manual',
      },
    });

    await spaceWrapper.findAll('[role="tab"]')[3].trigger('keydown', { key: ' ' });

    expect(spaceWrapper.emitted('update:modelValue')).toEqual([['docs']]);
    expect(spaceWrapper.emitted('activate')?.[0]?.[0]).toBe('docs');
  });

  it('falls back to one selected standalone tab when the controlled active key is disabled or missing', async () => {
    const wrapper = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'maps',
        ariaLabel: 'Media folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('tabindex')).toBe('0');
    expect(renderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(renderedTabs[2].attributes('aria-selected')).toBe('false');
    expect(renderedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(renderedTabs[2].attributes('tabindex')).toBe('-1');
    expect(renderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();

    await wrapper.setProps({ modelValue: 'missing' });

    const rerenderedTabs = wrapper.findAll('[role="tab"]');
    expect(rerenderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(rerenderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    expect(rerenderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('does not string-coerce invalid standalone control keys into object-looking tabs', () => {
    const objectLikeTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Object photos' },
      { key: '[object Object]', label: 'Object-looking string key' },
    ];
    const wrapper = mount(FolderTabs, {
      props: {
        tabs: objectLikeTabs,
        modelValue: {} as any,
        pulledKey: {} as any,
        ariaLabel: 'Runtime key folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(renderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(renderedTabs[0].attributes('tabindex')).toBe('0');
    expect(renderedTabs[1].attributes('aria-selected')).toBe('false');
    expect(renderedTabs[1].attributes('tabindex')).toBe('-1');
    expect(renderedTabs[1].classes()).not.toContain('is-pulled');
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('leaves all-disabled standalone tabs unselected and untabbable', () => {
    const disabledTabs = tabs.map((tab) => ({ ...tab, disabled: true }));
    const wrapper = mount(FolderTabs, {
      props: {
        tabs: disabledTabs,
        modelValue: 'photos',
        ariaLabel: 'Disabled media folders',
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    expect(renderedTabs).toHaveLength(disabledTabs.length);
    expect(renderedTabs.every((tab) => tab.attributes('aria-disabled') === 'true')).toBe(true);
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(0);
    expect(renderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(0);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('renders configurable stacked content panels in the requested direction', () => {
    const wrapper = mount(FolderTabPanelStack, {
      props: {
        orientation: 'horizontal',
        edge: 'right',
        depth: 'deep',
        layers: 5,
        activeIndex: 3,
        pulled: true,
      },
      slots: {
        default: 'Panel content',
      },
    });

    expect(wrapper.classes()).toContain('folder-tab-panel-stack--edge-right');
    expect(wrapper.classes()).toContain('folder-tab-panel-stack--vertical');
    expect(wrapper.classes()).not.toContain('folder-tab-panel-stack--horizontal');
    expect(wrapper.classes()).toContain('folder-tab-panel-stack--depth-deep');
    expect(wrapper.classes()).toContain('folder-tab-panel-stack--layers-2');
    expect(wrapper.classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--vertical');
    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.attributes('style')).toContain('--folder-tab-panel-active-index: 3');
    expect(wrapper.text()).toBe('Panel content');
  });

  it('renders tintable folders inside a directional binder pull state', () => {
    const wrapper = mount({
      render: () => h(FolderBinder, {
        orientation: 'vertical',
        edge: 'left',
        depth: 'deep',
        layers: 2,
        pulled: true,
        tone: 'teal',
      }, {
        default: () => h(Folder, { tone: 'teal' }, () => 'Folder content'),
      }),
    });

    const binder = wrapper.find('.folder-binder');
    expect(binder.classes()).toContain('folder-binder--edge-left');
    expect(binder.classes()).toContain('folder-binder--vertical');
    expect(binder.classes()).toContain('folder-binder--tone-teal');
    expect(binder.classes()).toContain('is-pulled');
    expect(wrapper.find('.folder').classes()).toContain('folder--tone-teal');
    expect(wrapper.text()).toBe('Folder content');
  });

  it('applies paper texture classes across rails, binders, folders, and compatibility stacks', () => {
    expect(folderTabsCss).toContain([
      '.folder-binder--texture-paper,',
      '.folder-tab-panel-stack--texture-paper,',
      '.folder--texture-paper {',
      '  --folder-border: color-mix(in srgb, var(--folder-tint) 44%, #8a8374);',
      '  --folder-layer-border: color-mix(in srgb, var(--folder-tint) 44%, rgba(226, 219, 201, 0.28));',
      '  --folder-paper-sheet-opacity: var(--folder-paper-sheet-opacity-custom, 0.5);',
      '  --folder-paper-content-opacity: var(--folder-paper-content-opacity-custom, 0.3);',
      '  --folder-paper-tab-opacity: var(--folder-paper-tab-opacity-custom, 0.42);',
      '}',
    ].join('\n'));
    expect(folderTabsCss).toContain('.folder-tabs--texture-paper.folder-tabs--texture-layer-tab .folder-tabs__tab {');
    expect(folderTabsCss).toContain('.folder-binder--texture-paper.folder-binder--texture-layer-sheet::before,');
    expect(folderTabsCss).toContain('.folder-attachment--texture-paper.folder-attachment--texture-layer-sheet .folder-attachment__sheet::after {');
    expect(folderTabsCss).toContain('.folder-attachment--texture-paper.folder-attachment--texture-layer-content .folder-attachment__content::before {');
    expect(folderTabsCss).toContain('.folder-attachment--texture-paper.folder-attachment--texture-layer-tab .folder-attachment__tab::before {');

    const rail = mount(FolderTabs, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Paper rail',
        texture: 'paper',
        textureLayers: 'tab',
        textureBlendMode: 'multiply',
        textColor: 'dark',
      },
    });

    expect(rail.classes()).toContain('folder-tabs--texture-paper');
    expect(rail.classes()).toContain('folder-tabs--texture-layer-tab');
    expect(rail.classes()).not.toContain('folder-tabs--texture-layer-sheet');
    expect(rail.classes()).not.toContain('folder-tabs--texture-layer-content');
    expect(rail.classes()).toContain('folder-tabs--texture-blend-multiply');
    expect(rail.classes()).toContain('folder-tabs--text-color-dark');

    const attachment = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Paper attachment',
        texture: 'paper',
        textureLayers: 'shell',
        textureBlendMode: 'multiply',
        textColor: 'dark',
      },
      slots: {
        default: 'Paper attachment content',
      },
    });

    expect(attachment.classes()).toContain('folder-attachment--texture-paper');
    expect(attachment.classes()).toContain('folder-attachment--texture-layer-sheet');
    expect(attachment.classes()).toContain('folder-attachment--texture-layer-tab');
    expect(attachment.classes()).not.toContain('folder-attachment--texture-layer-content');
    expect(attachment.classes()).toContain('folder-attachment--texture-blend-multiply');
    expect(attachment.classes()).toContain('folder-attachment--text-color-dark');
    expect(attachment.find('.folder-binder').classes()).toContain('folder-binder--texture-paper');
    expect(attachment.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-sheet');
    expect(attachment.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-tab');
    expect(attachment.find('.folder-binder').classes()).not.toContain('folder-binder--texture-layer-content');
    expect(attachment.find('.folder-binder').classes()).toContain('folder-binder--texture-blend-multiply');
    expect(attachment.find('.folder-binder').classes()).toContain('folder-binder--text-color-dark');
    expect(attachment.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-paper');
    expect(attachment.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-layer-sheet');
    expect(attachment.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-layer-tab');
    expect(attachment.find('.folder-attachment__folder.is-active').classes()).not.toContain('folder--texture-layer-content');
    expect(attachment.find('.folder-attachment__folder.is-active').classes()).toContain('folder--texture-blend-multiply');
    expect(attachment.find('.folder-attachment__folder.is-active').classes()).toContain('folder--text-color-dark');

    const binder = mount({
      render: () => h(FolderBinder, {
        texture: 'paper',
        textureLayers: ['sheet'],
        textureBlendMode: 'multiply',
        textColor: 'dark',
      }, {
        default: () => h(Folder, {
          texture: 'paper',
          textureLayers: ['sheet'],
          textureBlendMode: 'multiply',
          textColor: 'dark',
        }, () => 'Folder content'),
      }),
    });

    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-paper');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-layer-sheet');
    expect(binder.find('.folder-binder').classes()).not.toContain('folder-binder--texture-layer-content');
    expect(binder.find('.folder-binder').classes()).not.toContain('folder-binder--texture-layer-tab');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--texture-blend-multiply');
    expect(binder.find('.folder-binder').classes()).toContain('folder-binder--text-color-dark');
    expect(binder.find('.folder').classes()).toContain('folder--texture-paper');
    expect(binder.find('.folder').classes()).toContain('folder--texture-layer-sheet');
    expect(binder.find('.folder').classes()).not.toContain('folder--texture-layer-content');
    expect(binder.find('.folder').classes()).not.toContain('folder--texture-layer-tab');
    expect(binder.find('.folder').classes()).toContain('folder--texture-blend-multiply');
    expect(binder.find('.folder').classes()).toContain('folder--text-color-dark');

    const panelStack = mount(FolderTabPanelStack, {
      props: {
        texture: 'paper',
        textureLayers: 'none',
        textureBlendMode: 'multiply',
        textColor: 'dark',
      },
      slots: {
        default: 'Panel stack content',
      },
    });

    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-paper');
    expect(panelStack.classes()).not.toContain('folder-tab-panel-stack--texture-layer-sheet');
    expect(panelStack.classes()).not.toContain('folder-tab-panel-stack--texture-layer-content');
    expect(panelStack.classes()).not.toContain('folder-tab-panel-stack--texture-layer-tab');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--texture-blend-multiply');
    expect(panelStack.classes()).toContain('folder-tab-panel-stack--text-color-dark');
    expect(panelStack.find('.folder-binder').classes()).toContain('folder-binder--texture-paper');
    expect(panelStack.find('.folder-binder').classes()).not.toContain('folder-binder--texture-layer-sheet');
    expect(panelStack.find('.folder-binder').classes()).not.toContain('folder-binder--texture-layer-content');
    expect(panelStack.find('.folder-binder').classes()).not.toContain('folder-binder--texture-layer-tab');
    expect(panelStack.find('.folder-binder').classes()).toContain('folder-binder--texture-blend-multiply');
    expect(panelStack.find('.folder-binder').classes()).toContain('folder-binder--text-color-dark');
    expect(panelStack.find('.folder').classes()).toContain('folder--texture-paper');
    expect(panelStack.find('.folder').classes()).not.toContain('folder--texture-layer-sheet');
    expect(panelStack.find('.folder').classes()).not.toContain('folder--texture-layer-content');
    expect(panelStack.find('.folder').classes()).not.toContain('folder--texture-layer-tab');
    expect(panelStack.find('.folder').classes()).toContain('folder--texture-blend-multiply');
    expect(panelStack.find('.folder').classes()).toContain('folder--text-color-dark');
  });

  it('derives standalone binder physical orientation from edge rather than the default-edge hint', () => {
    const wrapper = mount({
      render: () => h(FolderBinder, {
        orientation: 'horizontal',
        edge: 'right',
      }, {
        default: () => h(Folder, null, () => 'Right folder content'),
      }),
    });

    const binder = wrapper.find('.folder-binder');
    expect(binder.classes()).toContain('folder-binder--edge-right');
    expect(binder.classes()).toContain('folder-binder--vertical');
    expect(binder.classes()).not.toContain('folder-binder--horizontal');
  });

  it('keeps the tab grab and folder pull attached through one activation', async () => {
    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          tone: 'teal',
          pullDuration: 480,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    const wrapper = mount(Harness);
    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('click');
    await nextTick();
    await waitForMotionFrame();

    const attachment = wrapper.findComponent(FolderAttachment);

    expect(attachment.emitted('update:modelValue')?.[0]).toEqual(['plans']);
    expect(attachment.emitted('activate')).toHaveLength(1);
    expect(attachment.emitted('activate')?.[0]?.[0]).toBe('plans');
    expect(wrapper.find('.folder .folder-attachment__tab').exists()).toBe(true);
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__tab').exists()).toBe(true);
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Floor plans');
    expect(renderedTabs[1].classes()).toContain('is-pulling');
    expect(renderedTabs[1].classes()).toContain('is-pulled');
    expect(renderedTabs[1].classes()).not.toContain('is-handoff');
    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--edge-left');
    expect(wrapper.find('.folder').classes()).toContain('folder--tone-teal');
  });

  it('starts tucked until a folder is explicitly pulled', () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        tone: 'teal',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(wrapper.find('[role="tab"]').classes()).not.toContain('is-open');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Object photos');
  });

  it('generates attached tab and panel ids with a two-way ARIA relationship', () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const activeTab = wrapper.find('[role="tab"][aria-selected="true"]');
    const panels = wrapper.findAll('[role="tabpanel"]');
    const activePanel = panels.find((panel) => panel.attributes('hidden') === undefined);

    expect(activeTab.attributes('id')).toMatch(/^folder-attachment-v-[a-z0-9-]+-photos-[a-z0-9]+-tab$/);
    expect(panels).toHaveLength(tabs.length);
    expect(activePanel?.attributes('id')).toMatch(/^folder-attachment-v-[a-z0-9-]+-photos-[a-z0-9]+-panel$/);
    expect(activeTab.attributes('aria-controls')).toBe(activePanel?.attributes('id'));
    expect(activePanel?.attributes('aria-labelledby')).toBe(activeTab.attributes('id'));

    for (const tab of renderedTabs) {
      const controlledPanel = panels.find((panel) => panel.attributes('id') === tab.attributes('aria-controls'));
      expect(controlledPanel?.attributes('aria-labelledby')).toBe(tab.attributes('id'));
    }

    const hiddenPanels = panels.filter((panel) => panel.attributes('hidden') !== undefined);
    expect(hiddenPanels).toHaveLength(tabs.length - 1);
    expect(hiddenPanels.every((panel) => panel.text() === '')).toBe(true);
  });

  it('deduplicates attached folders so tab and panel ids stay unique', () => {
    const duplicateTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Original photos' },
      { key: 'photos', label: 'Duplicate photos' },
      { key: 12, label: 'Numeric report' },
      { key: '12', label: 'String duplicate report' },
    ];

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: duplicateTabs,
        modelValue: 'photos',
        ariaLabel: 'Duplicate-safe folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const panels = wrapper.findAll('[role="tabpanel"]');
    const tabIds = renderedTabs.map((tab) => tab.attributes('id'));
    const panelIds = panels.map((panel) => panel.attributes('id'));

    expect(renderedTabs).toHaveLength(2);
    expect(panels).toHaveLength(2);
    expect(renderedTabs.map((tab) => tab.attributes('aria-label'))).toEqual(['Original photos', 'Numeric report']);
    expect(new Set(tabIds).size).toBe(tabIds.length);
    expect(new Set(panelIds).size).toBe(panelIds.length);
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text())
      .toBe('Original photos');
  });

  it('preserves explicit attached panel ids over generated defaults', () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        panelIdForTab: (tab: FolderTabItem) => ` external-panel-${tab.key} `,
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const activeTab = wrapper.find('[role="tab"][aria-selected="true"]');
    const panels = wrapper.findAll('[role="tabpanel"]');
    const panel = panels.find((candidate) => candidate.attributes('hidden') === undefined);

    expect(activeTab.attributes('aria-controls')).toBe('external-panel-photos');
    expect(panels).toHaveLength(tabs.length);
    expect(panel?.attributes('id')).toBe('external-panel-photos');
    expect(panel?.attributes('aria-labelledby')).toBe(activeTab.attributes('id'));
  });

  it('keeps callback-provided attached panel ids stable across tab and panel bindings', () => {
    let panelIdCounter = 0;
    const panelIdForTab = vi.fn((tab: FolderTabItem) => `external-panel-${tab.key}-${++panelIdCounter}`);
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Volatile panel folders',
        panelIdForTab,
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const panels = wrapper.findAll('[role="tabpanel"]');

    expect(panelIdForTab).toHaveBeenCalledTimes(tabs.length);

    for (const tab of renderedTabs) {
      const controlledPanel = panels.find((panel) => panel.attributes('id') === tab.attributes('aria-controls'));

      expect(controlledPanel).toBeTruthy();
      expect(controlledPanel?.attributes('aria-labelledby')).toBe(tab.attributes('id'));
    }
  });

  it('keeps attached tab and panel ids unique when external panel ids collide', () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Duplicate attached panel folders',
        panelIdForTab: () => 'shared-panel',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const panels = wrapper.findAll('[role="tabpanel"]');
    const tabControls = renderedTabs.map((tab) => tab.attributes('aria-controls'));
    const panelIds = panels.map((panel) => panel.attributes('id'));

    expect(tabControls[0]).toBe('shared-panel');
    expect(tabControls[1]).toMatch(/^folder-attachment-v-[a-z0-9-]+-plans-[a-z0-9]+-panel$/);
    expect(tabControls[2]).toMatch(/^folder-attachment-v-[a-z0-9-]+-maps-[a-z0-9]+-panel$/);
    expect(tabControls[3]).toMatch(/^folder-attachment-v-[a-z0-9-]+-docs-[a-z0-9]+-panel$/);
    expect(new Set(tabControls).size).toBe(tabControls.length);
    expect(new Set(panelIds).size).toBe(panelIds.length);

    for (const tab of renderedTabs) {
      const controlledPanel = panels.find((panel) => panel.attributes('id') === tab.attributes('aria-controls'));

      expect(controlledPanel).toBeTruthy();
      expect(controlledPanel?.attributes('aria-labelledby')).toBe(tab.attributes('id'));
    }
  });

  it('falls back through tab panel ids and generated ids when attached callback panel ids collide', () => {
    const panelFallbackTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Photos', panelId: 'tab-panel-photos' },
      { key: 'plans', label: 'Plans', panelId: 'tab-panel-plans' },
      { key: 'docs', label: 'Docs', panelId: 'shared-panel' },
    ];
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: panelFallbackTabs,
        modelValue: 'photos',
        ariaLabel: 'Fallback attached panel folders',
        panelIdForTab: () => 'shared-panel',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const panels = wrapper.findAll('[role="tabpanel"]');
    const tabControls = renderedTabs.map((tab) => tab.attributes('aria-controls'));
    const panelIds = panels.map((panel) => panel.attributes('id'));

    expect(tabControls[0]).toBe('shared-panel');
    expect(tabControls[1]).toBe('tab-panel-plans');
    expect(tabControls[2]).toMatch(/^folder-attachment-v-[a-z0-9-]+-docs-[a-z0-9]+-panel$/);
    expect(new Set(tabControls).size).toBe(tabControls.length);
    expect(new Set(panelIds).size).toBe(panelIds.length);

    for (const tab of renderedTabs) {
      const controlledPanel = panels.find((panel) => panel.attributes('id') === tab.attributes('aria-controls'));

      expect(controlledPanel).toBeTruthy();
      expect(controlledPanel?.attributes('aria-labelledby')).toBe(tab.attributes('id'));
    }
  });

  it('falls back to generated attached panel ids for invalid runtime panel ids', () => {
    const runtimePanelTabs = [
      { key: 'photos', label: 'Photos', panelId: {} },
      { key: 'plans', label: 'Plans', panelId: 'external panel plans' },
      { key: 'docs', label: 'Docs', panelId: 'external-panel-docs' },
    ] as any;

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: runtimePanelTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime panel folders',
        panelIdForTab: (tab: FolderTabItem) => (tab.key === 'photos' ? { id: 'bad' } : ''),
      } as any,
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const panels = wrapper.findAll('[role="tabpanel"]');

    expect(renderedTabs[0].attributes('aria-controls'))
      .toMatch(/^folder-attachment-v-[a-z0-9-]+-photos-[a-z0-9]+-panel$/);
    expect(panels[0].attributes('id')).toBe(renderedTabs[0].attributes('aria-controls'));
    expect(renderedTabs[1].attributes('aria-controls'))
      .toMatch(/^folder-attachment-v-[a-z0-9-]+-plans-[a-z0-9]+-panel$/);
    expect(panels[1].attributes('id')).toBe(renderedTabs[1].attributes('aria-controls'));
    expect(renderedTabs[2].attributes('aria-controls')).toBe('external-panel-docs');
    expect(panels[2].attributes('id')).toBe('external-panel-docs');
    expect(panels.map((panel) => panel.attributes('id') ?? '')).not.toContain('[object Object]');
    expect(panels.map((panel) => panel.attributes('id') ?? '')).not.toContain('external panel plans');
  });

  it('ignores invalid attached panel id callback props at runtime', () => {
    const runtimePanelTabs = [
      { key: 'photos', label: 'Photos', panelId: 'external-panel-photos' },
      { key: 'plans', label: 'Plans' },
    ] as any;

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: runtimePanelTabs,
        modelValue: 'photos',
        ariaLabel: 'Runtime attached panel callback folders',
        panelIdForTab: { id: 'bad-callback' },
      } as any,
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const panels = wrapper.findAll('[role="tabpanel"]');

    expect(renderedTabs[0].attributes('aria-controls')).toBe('external-panel-photos');
    expect(panels[0].attributes('id')).toBe('external-panel-photos');
    expect(renderedTabs[1].attributes('aria-controls'))
      .toMatch(/^folder-attachment-v-[a-z0-9-]+-plans-[a-z0-9]+-panel$/);
    expect(panels[1].attributes('id')).toBe(renderedTabs[1].attributes('aria-controls'));
    expect(panels.map((panel) => panel.attributes('id') ?? '')).not.toContain('bad-callback');
  });

  it('does not let a disabled attached tab steal the roving tab stop', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[2].trigger('click');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(renderedTabs[0].attributes('tabindex')).toBe('0');
    expect(renderedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(renderedTabs[2].attributes('tabindex')).toBe('-1');
    expect(renderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
  });

  it('keeps disabled attached tabs inert for keyboard events fired directly on them', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[2].trigger('keydown', { key: 'ArrowDown' });
    await renderedTabs[2].trigger('keydown', { key: 'Enter' });

    expect(renderedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
    expect(renderedTabs[0].attributes('tabindex')).toBe('0');
    expect(renderedTabs[2].attributes('tabindex')).toBe('-1');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text())
      .toBe('Object photos');
  });

  it('falls back attached selection and content when the controlled key is disabled or missing', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'maps',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const folders = wrapper.findAll('.folder-attachment__folder');
    const visiblePanels = wrapper.findAll('[role="tabpanel"]').filter((panel) => panel.attributes('hidden') === undefined);

    expect(renderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(renderedTabs[2].attributes('aria-selected')).toBe('false');
    expect(renderedTabs[2].attributes('aria-disabled')).toBe('true');
    expect(renderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(folders[0].classes()).toContain('is-active');
    expect(folders[2].classes()).not.toContain('is-active');
    expect(visiblePanels).toHaveLength(1);
    expect(visiblePanels[0].text()).toBe('Object photos');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();

    await wrapper.setProps({ modelValue: 'missing' });

    const rerenderedTabs = wrapper.findAll('[role="tab"]');
    const rerenderedPanels = wrapper.findAll('[role="tabpanel"]').filter((panel) => panel.attributes('hidden') === undefined);
    expect(rerenderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(rerenderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    expect(rerenderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(1);
    expect(rerenderedPanels).toHaveLength(1);
    expect(rerenderedPanels[0].text()).toBe('Object photos');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('does not string-coerce invalid attached control or hover keys into object-looking folders', () => {
    const objectLikeTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Object photos' },
      { key: '[object Object]', label: 'Object-looking string key' },
    ];
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: objectLikeTabs,
        modelValue: {} as any,
        emulatedHoverKey: {} as any,
        ariaLabel: 'Runtime attached key folders',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const folders = wrapper.findAll('.folder-attachment__folder');
    const visiblePanels = wrapper.findAll('[role="tabpanel"]').filter((panel) => panel.attributes('hidden') === undefined);

    expect(wrapper.classes()).not.toContain('folder-attachment--hover-emulated');
    expect(renderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(renderedTabs[0].attributes('tabindex')).toBe('0');
    expect(renderedTabs[1].attributes('aria-selected')).toBe('false');
    expect(renderedTabs[1].attributes('tabindex')).toBe('-1');
    expect(renderedTabs[1].classes()).not.toContain('is-hovered');
    expect(folders[0].classes()).toContain('is-active');
    expect(folders[1].classes()).not.toContain('is-active');
    expect(folders[1].classes()).not.toContain('is-hovered');
    expect(visiblePanels).toHaveLength(1);
    expect(visiblePanels[0].text()).toBe('Object photos');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('leaves all-disabled attached folders without an active panel or ghost slot content', () => {
    const disabledTabs = tabs.map((tab) => ({ ...tab, disabled: true }));
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: disabledTabs,
        modelValue: 'photos',
        ariaLabel: 'Disabled media folders',
        orientation: 'vertical',
        edge: 'left',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', { class: 'slot-content' }, activeTab?.label ?? 'No active folder'),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const visiblePanels = wrapper.findAll('[role="tabpanel"]').filter((panel) => panel.attributes('hidden') === undefined);
    expect(renderedTabs).toHaveLength(disabledTabs.length);
    expect(renderedTabs.every((tab) => tab.attributes('aria-disabled') === 'true')).toBe(true);
    expect(renderedTabs.filter((tab) => tab.attributes('aria-selected') === 'true')).toHaveLength(0);
    expect(renderedTabs.filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(0);
    expect(wrapper.findAll('.folder-attachment__folder.is-active')).toHaveLength(0);
    expect(visiblePanels).toHaveLength(0);
    expect(wrapper.find('.slot-content').exists()).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('treats the first enabled attached folder after all-disabled data as initial tucked state', async () => {
    const disabledTabs = tabs.map((tab) => ({ ...tab, disabled: true }));
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: disabledTabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(wrapper.findAll('[role="tab"]').filter((tab) => tab.attributes('aria-selected') === 'true'))
      .toHaveLength(0);
    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');

    await wrapper.setProps({ tabs });
    await nextTick();

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const activeFolder = wrapper.find('.folder-attachment__folder.is-active');
    expect(renderedTabs[0].attributes('aria-selected')).toBe('true');
    expect(activeFolder.exists()).toBe(true);
    expect(activeFolder.classes()).not.toContain('is-pulling');
    expect(activeFolder.classes()).not.toContain('is-pulled');
    expect(renderedTabs[0].classes()).not.toContain('is-open');
    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text())
      .toBe('Object photos');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('returns to tucked initial behavior when enabled attached folders reappear after all-disabled data', async () => {
    const disabledTabs = tabs.map((tab) => ({ ...tab, disabled: true }));
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(wrapper.find('.folder-attachment__folder.is-active').classes()).not.toContain('is-pulling');
    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');

    await wrapper.setProps({ tabs: disabledTabs });
    await nextTick();

    expect(wrapper.findAll('.folder-attachment__folder.is-active')).toHaveLength(0);
    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');

    await wrapper.setProps({ tabs });
    await nextTick();

    const restoredActiveFolder = wrapper.find('.folder-attachment__folder.is-active');
    const restoredActiveTab = wrapper.find('[role="tab"][aria-selected="true"]');
    expect(restoredActiveFolder.exists()).toBe(true);
    expect(restoredActiveFolder.classes()).not.toContain('is-pulling');
    expect(restoredActiveFolder.classes()).not.toContain('is-pulled');
    expect(restoredActiveTab.classes()).not.toContain('is-open');
    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Object photos');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('activate')).toBeUndefined();
  });

  it('expands active attached tabs without entering the pull state', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'bottom',
        expandOn: 'active',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const renderedTabs = wrapper.findAll('[role="tab"]');
    expect(renderedTabs[0].classes()).toContain('is-expanded');
    expect(renderedTabs[0].classes()).toContain('folder-attachment__tab--has-total');
    expect(renderedTabs[0].classes()).not.toContain('is-open');
    expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
    expect(wrapper.findAll('.folder-attachment__folder')[1].attributes('style'))
      .toContain('--folder-piece-slot: 156.00px');
  });

  it('keeps attached hover compact when expansion is active-only', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'docs',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        expandOn: 'active',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const folders = wrapper.findAll('.folder-attachment__folder');

    expect(folders[1].classes()).toContain('is-hovered');
    expect(folders[1].classes()).not.toContain('is-expanded');
    expect(renderedTabs[1].classes()).toContain('is-hovered');
    expect(renderedTabs[1].classes()).not.toContain('is-expanded');
    expect(folders[2].attributes('style')).toContain('--folder-piece-slot: 88.00px');
  });

  it('expands attached tabs on focus only when focus expansion is requested', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'docs',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        expandOn: 'focus',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('focus');
    await nextTick();

    const folders = wrapper.findAll('.folder-attachment__folder');

    expect(folders[1].classes()).not.toContain('is-hovered');
    expect(folders[1].classes()).toContain('is-expanded');
    expect(renderedTabs[1].classes()).toContain('is-expanded');
    expect(folders[2].attributes('style')).toContain('--folder-piece-slot: 200.00px');

    await renderedTabs[1].trigger('blur');
    await nextTick();

    expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).not.toContain('is-expanded');
  });

  it('writes expanded side slots directly on tab handles so open tags displace neighbors', async () => {
    const sideTabs: FolderTabItem[] = [
      ...tabs,
      { key: 'review', label: 'Counsel review', shortLabel: 'Review', icon: Icon, count: 2 },
    ];
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: sideTabs,
        modelValue: 'docs',
        ariaLabel: 'Right media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        expandOn: 'active',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const folders = wrapper.findAll('.folder-attachment__folder');
    const renderedTabs = wrapper.findAll('[role="tab"]');

    expect(folders[3].classes()).toContain('is-expanded');
    expect(renderedTabs[3].attributes('style')).toContain('--folder-tab-slot: 132.00px');
    expect(folders[4].attributes('style')).toContain('--folder-piece-slot: 288.00px');
    expect(renderedTabs[4].attributes('style')).toContain('--folder-tab-slot: 288.00px');
  });

  it('folds returning folders slightly faster than new folders unfold by default', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        pullDuration: 600,
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    expect(wrapper.attributes('style')).toContain('--folder-motion-duration: 600ms');
    expect(wrapper.attributes('style')).toContain('--folder-motion-return-duration: 450ms');

    await wrapper.setProps({ returnDuration: 180 });

    expect(wrapper.attributes('style')).toContain('--folder-motion-return-duration: 180ms');
  });

  it('keeps zero and non-finite attached durations from leaving transitional state stuck', async () => {
    vi.useFakeTimers();

    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          pullDuration: Number.NaN,
          returnDuration: 0,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    try {
      const wrapper = mount(Harness);
      const renderedTabs = wrapper.findAll('[role="tab"]');

      expect(wrapper.findComponent(FolderAttachment).attributes('style'))
        .toContain('--folder-motion-duration: 0ms');
      expect(wrapper.findComponent(FolderAttachment).attributes('style'))
        .toContain('--folder-motion-return-duration: 0ms');

      await renderedTabs[1].trigger('click');
      await nextTick();
      expect(renderedTabs[1].classes()).toContain('is-pulling');

      vi.runAllTimers();
      await nextTick();
      expect(wrapper.findAll('[role="tab"]')[1].classes()).toContain('is-pulled');
      expect(wrapper.findAll('[role="tab"]')[1].classes()).not.toContain('is-pulling');

      await wrapper.findAll('[role="tab"]')[3].trigger('click');
      await nextTick();
      expect(wrapper.findAll('.folder-attachment__folder')[3].attributes('style'))
        .toContain('--folder-piece-z: 300');

      vi.runAllTimers();
      await nextTick();

      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Documents');
      expect(wrapper.findAll('[role="tab"]')[3].classes()).toContain('is-pulled');
      expect(wrapper.findAll('[role="tab"]')[3].classes()).not.toContain('is-returning');
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears attached motion timers when unmounted mid-transition', async () => {
    vi.useFakeTimers();

    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          pullDuration: 40,
          returnDuration: 60,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    try {
      const wrapper = mount(Harness);
      await wrapper.findAll('[role="tab"]')[1].trigger('click');
      await nextTick();

      expect(vi.getTimerCount()).toBeGreaterThan(0);

      wrapper.unmount();

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not schedule attached measurement frames after immediate unmount', async () => {
    const requestFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 123);
    const cancelFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    try {
      const wrapper = mount(FolderAttachment, {
        props: {
          tabs,
          modelValue: 'photos',
          ariaLabel: 'Media folders',
        },
        slots: {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        },
      });

      expect(requestFrameSpy).toHaveBeenCalledTimes(1);

      wrapper.unmount();
      expect(cancelFrameSpy).toHaveBeenCalledWith(123);

      await nextTick();

      expect(requestFrameSpy).toHaveBeenCalledTimes(1);
    } finally {
      requestFrameSpy.mockRestore();
      cancelFrameSpy.mockRestore();
    }
  });

  it('fronts externally controlled model value changes immediately', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await wrapper.setProps({ modelValue: 'plans' });
    await nextTick();

    const folders = wrapper.findAll('.folder-attachment__folder');
    expect(folders[1].classes()).toContain('is-active');
    expect(folders[1].classes()).toContain('is-pulling');
    expect(folders[1].attributes('style')).toContain('--folder-piece-z: 300');
    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Floor plans');
  });

  it('keeps externally controlled folder handoffs in the pulled lane while the previous folder returns', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        returnDuration: 20,
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await wrapper.setProps({ modelValue: 'plans' });
    await nextTick();
    await waitForMotionFrame();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Floor plans');

    await wrapper.setProps({ modelValue: 'docs' });
    await nextTick();

    const folders = wrapper.findAll('.folder-attachment__folder');
    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Documents');
    expect(folders[1].classes()).toContain('is-returning');
    expect(folders[1].attributes('style')).toContain('--folder-piece-z: 240');
    expect(folderPieceStyleNumber(wrapper, 1, '--folder-piece-x'))
      .toBe(folderPieceStyleNumber(wrapper, 1, '--folder-piece-rest-x'));
    expect(folderPieceStyleNumber(wrapper, 1, '--folder-piece-y'))
      .toBe(folderPieceStyleNumber(wrapper, 1, '--folder-piece-rest-y'));
    expect(folders[3].classes()).toContain('is-active');
    expect(folders[3].classes()).toContain('is-selecting');
    expect(folders[3].classes()).toContain('is-handoff');
    expect(folders[3].classes()).not.toContain('is-pulling');
    expect(folders[3].attributes('style')).toContain('--folder-piece-z: 300');
    expect(folderPieceStyleNumber(wrapper, 3, '--folder-piece-x'))
      .toBe(folderPieceStyleNumber(wrapper, 3, '--folder-piece-pull-x'));
    expect(folderPieceStyleNumber(wrapper, 3, '--folder-piece-y'))
      .toBe(folderPieceStyleNumber(wrapper, 3, '--folder-piece-pull-y'));
    expect(wrapper.findAll('[role="tab"]')[3].classes()).toContain('is-open');
    expect(wrapper.findAll('[role="tab"]')[3].classes()).toContain('is-handoff');

    await new Promise((resolve) => window.setTimeout(resolve, 25));
    await nextTick();
    await waitForMotionFrame();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(folders[3].classes()).toContain('is-pulling');
  });

  it('cancels stale controlled handoff timers when active folders disappear mid-return', async () => {
    vi.useFakeTimers();

    const disabledTabs = tabs.map((tab) => ({ ...tab, disabled: true }));
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        pullDuration: 20,
        returnDuration: 60,
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    try {
      await wrapper.setProps({ modelValue: 'plans' });
      await nextTick();

      vi.advanceTimersByTime(20);
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-pulled');
      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');

      await wrapper.setProps({ modelValue: 'docs' });
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-returning');
      expect(wrapper.findAll('.folder-attachment__folder')[3].classes()).toContain('is-handoff');

      await wrapper.setProps({ tabs: disabledTabs });
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder.is-active')).toHaveLength(0);
      expect(wrapper.findAll('.folder-attachment__folder.is-returning')).toHaveLength(0);
      expect(wrapper.findAll('.folder-attachment__folder.is-handoff')).toHaveLength(0);
      expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');

      await wrapper.setProps({ tabs, modelValue: 'docs' });
      await nextTick();

      const restoredDocsFolder = wrapper.findAll('.folder-attachment__folder')[3];
      expect(restoredDocsFolder.classes()).toContain('is-active');
      expect(restoredDocsFolder.classes()).not.toContain('is-pulling');
      expect(restoredDocsFolder.classes()).not.toContain('is-pulled');
      expect(restoredDocsFolder.classes()).not.toContain('is-handoff');
      expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');

      vi.advanceTimersByTime(60);
      await nextTick();

      expect(restoredDocsFolder.classes()).toContain('is-active');
      expect(restoredDocsFolder.classes()).not.toContain('is-pulling');
      expect(restoredDocsFolder.classes()).not.toContain('is-pulled');
      expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');
      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Documents');
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses a tab item tone for its attached folder before the fallback tone', async () => {
    const tintedTabs: FolderTabItem[] = tabs.map((tab) => (
      tab.key === 'plans' ? { ...tab, tone: 'copper' } : tab
    ));

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: tintedTabs,
        modelValue: 'plans',
        ariaLabel: 'Media folders',
        tone: 'teal',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    expect(wrapper.find('.folder-attachment__folder.is-active').classes()).toContain('folder--tone-copper');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--tone-teal');
  });

  it('uses custom tab item tint and accent colors for attached folders', async () => {
    const customTintTabs: FolderTabItem[] = tabs.map((tab) => (
      tab.key === 'plans'
        ? { ...tab, accent: '#d7e9f7', tint: '#5f7896', tone: 'steel' }
        : tab
    ));

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: customTintTabs,
        modelValue: 'plans',
        ariaLabel: 'Media folders',
        tone: 'teal',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const activeFolder = wrapper.find('.folder-attachment__folder.is-active');

    expect(activeFolder.classes()).toContain('folder--tone-steel');
    expect(activeFolder.attributes('style')).toContain('--folder-tint: #5f7896');
    expect(activeFolder.attributes('style')).toContain('--folder-accent: #d7e9f7');
  });

  it('supports mixed per-folder edges inside one attached binder', async () => {
    const mixedTabs: FolderTabItem[] = [
      { ...tabs[0], edge: 'left' },
      { ...tabs[1], edge: 'right' },
      { ...tabs[2], edge: 'bottom' },
      { ...tabs[3], edge: 'right' },
    ];

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: mixedTabs,
        modelValue: 'plans',
        ariaLabel: 'Mixed media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const folders = wrapper.findAll('.folder-attachment__folder');

    expect(wrapper.classes()).toContain('folder-attachment--mixed-edge');
    expect(wrapper.classes()).toContain('folder-attachment--has-edge-left');
    expect(wrapper.classes()).toContain('folder-attachment--has-edge-right');
    expect(wrapper.classes()).toContain('folder-attachment--has-edge-bottom');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--edge-right');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--vertical');
    expect(wrapper.find('.folder-attachment__stack').attributes('aria-orientation')).toBeUndefined();
    expect(folders[0].classes()).toContain('folder-attachment__folder--edge-left');
    expect(folders[0].classes()).toContain('folder-attachment__folder--vertical');
    expect(folders[1].classes()).toContain('folder-attachment__folder--edge-right');
    expect(folders[1].classes()).toContain('folder-attachment__folder--vertical');
    expect(folders[2].classes()).toContain('folder-attachment__folder--edge-bottom');
    expect(folders[2].classes()).toContain('folder-attachment__folder--horizontal');
    expect(folders[0].attributes('style')).toContain('--folder-piece-slot: 0.00px');
    expect(folders[1].attributes('style')).toContain('--folder-piece-slot: 0.00px');
    expect(folders[2].attributes('style')).toContain('--folder-piece-slot: 0.00px');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Floor plans');
  });

  it('supports start and end tab groups on the same attached edge', async () => {
    const wraparoundTabs: FolderTabItem[] = [
      { ...tabs[0], edge: 'top', gravity: 'start' },
      { ...tabs[1], edge: 'top', gravity: 'start' },
      { ...tabs[2], disabled: false, edge: 'top', gravity: 'end' },
      { ...tabs[3], edge: 'top', gravity: 'end' },
    ];

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: wraparoundTabs,
        modelValue: 'photos',
        ariaLabel: 'Wraparound media folders',
        orientation: 'horizontal',
        edge: 'top',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const folders = wrapper.findAll('.folder-attachment__folder');

    expect(wrapper.classes()).not.toContain('folder-attachment--mixed-edge');
    expect(wrapper.classes()).toContain('folder-attachment--has-edge-top');
    expect(wrapper.classes()).toContain('folder-attachment--active-edge-top');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--edge-top');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--horizontal');
    expect(wrapper.find('.folder-attachment__stack').attributes('aria-orientation')).toBe('horizontal');
    expect(folders[0].classes()).toContain('folder-attachment__folder--edge-top');
    expect(folders[0].classes()).toContain('folder-attachment__folder--horizontal');
    expect(folders[0].classes()).toContain('folder-attachment__folder--gravity-start');
    expect(folders[1].classes()).toContain('folder-attachment__folder--gravity-start');
    expect(folders[2].classes()).toContain('folder-attachment__folder--edge-top');
    expect(folders[2].classes()).toContain('folder-attachment__folder--horizontal');
    expect(folders[2].classes()).toContain('folder-attachment__folder--gravity-end');
    expect(folders[3].classes()).toContain('folder-attachment__folder--gravity-end');
    expect(folders[0].attributes('style')).toContain('--folder-piece-slot: 0.00px');
    expect(folders[2].attributes('style')).toContain('--folder-piece-slot: 0.00px');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Object photos');

    await wrapper.setProps({ modelValue: 'docs' });
    await nextTick();

    expect(wrapper.classes()).toContain('folder-attachment--active-edge-top');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--edge-top');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--horizontal');
    expect(wrapper.find('.folder-attachment__folder.is-active').classes()).toContain('folder-attachment__folder--edge-top');
    expect(wrapper.find('.folder-attachment__folder.is-active').classes()).toContain('folder-attachment__folder--gravity-end');
    expect(wrapper.find('.folder-attachment__folder.is-active .folder-attachment__content').text()).toBe('Documents');
    expect(wrapper.find('.folder-attachment__folder.is-active').attributes('style')).toContain('--folder-piece-z: 300');
  });

  it('keeps tucked folder rotation opt-in', async () => {
    const squareWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'plans',
        ariaLabel: 'Square folders',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });
    const tiltedWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'plans',
        ariaLabel: 'Tilted folders',
        appearance: 'stack',
        tuckedTilt: true,
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });
    const sheetTiltWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'plans',
        ariaLabel: 'Sheet-tilted folders',
        appearance: 'stack',
        stackRotation: 'folders',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });
    const pieceTiltWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'plans',
        ariaLabel: 'Piece-tilted folders',
        appearance: 'stack',
        stackRotation: 'pieces',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });
    const rotatedTabsWrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'plans',
        ariaLabel: 'Rotated tab handles',
        appearance: 'stack',
        stackRotation: 'folders',
        tabRotation: 'rotated',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    expect(squareWrapper.classes()).not.toContain('folder-attachment--tucked-tilt');
    expect(squareWrapper.classes()).toContain('folder-attachment--stack-rotation-none');
    expect(squareWrapper.classes()).toContain('folder-attachment--tab-rotation-straight');
    expect(tiltedWrapper.classes()).toContain('folder-attachment--tucked-tilt');
    expect(tiltedWrapper.classes()).toContain('folder-attachment--stack-rotation-pieces');
    expect(sheetTiltWrapper.classes()).toContain('folder-attachment--tucked-tilt');
    expect(sheetTiltWrapper.classes()).toContain('folder-attachment--stack-rotation-folders');
    expect(pieceTiltWrapper.classes()).toContain('folder-attachment--stack-rotation-pieces');
    expect(pieceTiltWrapper.classes()).toContain('folder-attachment--tab-rotation-straight');
    expect(rotatedTabsWrapper.classes()).toContain('folder-attachment--tab-rotation-rotated');
    expect(folderPieceStyleNumber(squareWrapper, 0, '--folder-piece-rotate')).toBe(0);
    expect(folderPieceStyleNumber(tiltedWrapper, 0, '--folder-piece-rotate')).not.toBe(0);
    expect(folderPieceStyleNumber(sheetTiltWrapper, 0, '--folder-piece-rotate')).not.toBe(0);
    expect(folderPieceStyleNumber(pieceTiltWrapper, 0, '--folder-piece-rotate')).not.toBe(0);
    expect(pieceTiltWrapper.findAll('.folder-attachment__folder')[0].attributes('style'))
      .toContain('--folder-tab-counter-rotate:');
    expect(rotatedTabsWrapper.findAll('.folder-attachment__folder')[0].attributes('style'))
      .toContain('--folder-tab-piece-rotate:');
    expect(tiltedWrapper.find('.folder-attachment__folder.is-active').attributes('style'))
      .toContain('--folder-piece-rotate: 0.00deg');
    expect(sheetTiltWrapper.find('.folder-attachment__folder.is-active').attributes('style'))
      .toContain('--folder-piece-rotate: 0.00deg');
    expect(normalizeFolderStackRotation('folders')).toBe('folders');
    expect(normalizeFolderStackRotation('pieces')).toBe('pieces');
    expect(normalizeFolderStackRotation('surprise')).toBe('none');
    expect(normalizeFolderTabRotation('rotated')).toBe('rotated');
    expect(normalizeFolderTabRotation('sideways')).toBe('straight');
    expect(normalizeFolderSurfaceTexture('paper')).toBe('paper');
    expect(normalizeFolderSurfaceTexture('linen')).toBe('none');
    expect(normalizeFolderSurfaceTextureLayers('shell')).toEqual(['sheet', 'tab']);
    expect(normalizeFolderSurfaceTextureLayers(['content', 'tab', 'content'])).toEqual(['content', 'tab']);
    expect(normalizeFolderSurfaceTextColor('dark')).toBe('dark');
    expect(normalizeFolderSurfaceTextColor('invisible')).toBe('auto');
    expect(normalizeFolderSurfaceTextureBlendMode('multiply')).toBe('multiply');
    expect(normalizeFolderSurfaceTextureBlendMode('smudge')).toBe('auto');
  });

  it('lets mixed-edge binders follow the active physical edge instead of the root flow axis', async () => {
    const mixedTabs: FolderTabItem[] = [
      { ...tabs[0], edge: 'bottom' },
      { ...tabs[1], edge: 'right' },
      { ...tabs[2], edge: 'bottom' },
      { ...tabs[3], edge: 'right' },
    ];

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: mixedTabs,
        modelValue: 'plans',
        ariaLabel: 'Corner media folders',
        orientation: 'horizontal',
        edge: 'bottom',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const binderClasses = wrapper.find('.folder-binder').classes();
    const activeFolderClasses = wrapper.find('.folder-attachment__folder.is-active').classes();

    expect(wrapper.classes()).toContain('folder-attachment--horizontal');
    expect(wrapper.classes()).toContain('folder-attachment--mixed-edge');
    expect(wrapper.classes()).toContain('folder-attachment--active-edge-right');
    expect(binderClasses).toContain('folder-binder--edge-right');
    expect(binderClasses).toContain('folder-binder--vertical');
    expect(wrapper.find('.folder-attachment__stack').attributes('aria-orientation')).toBeUndefined();
    expect(activeFolderClasses).toContain('folder-attachment__folder--edge-right');
    expect(activeFolderClasses).toContain('folder-attachment__folder--vertical');
  });

  it('lets mixed-edge attached tablists use either arrow axis because they have no single ARIA orientation', async () => {
    const mixedTabs: FolderTabItem[] = [
      { ...tabs[0], edge: 'bottom' },
      { ...tabs[1], edge: 'right' },
      { ...tabs[2], edge: 'bottom' },
      { ...tabs[3], edge: 'right' },
    ];

    const horizontalArrow = mount(FolderAttachment, {
      props: {
        tabs: mixedTabs,
        modelValue: 'photos',
        ariaLabel: 'Corner media folders',
        orientation: 'horizontal',
        edge: 'bottom',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await horizontalArrow.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(horizontalArrow.emitted('update:modelValue')).toEqual([['plans']]);

    const verticalArrow = mount(FolderAttachment, {
      props: {
        tabs: mixedTabs,
        modelValue: 'photos',
        ariaLabel: 'Corner media folders',
        orientation: 'horizontal',
        edge: 'bottom',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await verticalArrow.find('[role="tab"]').trigger('keydown', { key: 'ArrowDown' });
    expect(verticalArrow.emitted('update:modelValue')).toEqual([['plans']]);
  });

  it('derives single-edge attached orientation from the physical edge', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'right',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    expect(wrapper.classes()).toContain('folder-attachment--vertical');
    expect(wrapper.classes()).toContain('folder-attachment--edge-right');
    expect(wrapper.find('.folder-binder').classes()).toContain('folder-binder--vertical');
    expect(wrapper.find('.folder-attachment__stack').attributes('aria-orientation')).toBe('vertical');
    expect(wrapper.find('.folder-attachment__folder').classes()).toContain('folder-attachment__folder--vertical');
    expect(wrapper.find('.folder-attachment__folder').classes()).toContain('folder-attachment__folder--edge-right');

    await wrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.find('[role="tab"]').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.emitted('update:modelValue')).toEqual([['plans']]);
  });

  it('tugs a hovered attached tab handle while keeping the folder tucked', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('pointerenter');
    await nextTick();

    const activeFolder = wrapper.findAll('.folder-attachment__folder')[0];
    const hoveredFolder = wrapper.findAll('.folder-attachment__folder')[1];
    const displacedFolder = wrapper.findAll('.folder-attachment__folder')[2];
    expect(hoveredFolder.classes()).toContain('is-hovered');
    expect(renderedTabs[1].classes()).toContain('is-hovered');
    expect(activeFolder.attributes('style')).toContain('--folder-piece-z: 300');
    expect(hoveredFolder.attributes('style')).toContain('--folder-piece-z: 40');
    expect(hoveredFolder.attributes('style')).toContain('--folder-piece-rest-x: 29.00px');
    expect(hoveredFolder.attributes('style')).toContain('--folder-tab-hover-x: -6.00px');
    expect(hoveredFolder.attributes('style')).toContain('--folder-tab-hover-y: 0.00px');
    expect(displacedFolder.attributes('style')).toContain('--folder-piece-slot: 200.00px');
  });

  it('tugs a focused attached tab handle while keeping the folder tucked', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
        expandOn: 'focus',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const renderedTabs = wrapper.findAll('[role="tab"]');
    await renderedTabs[1].trigger('focus');
    await nextTick();

    const activeFolder = wrapper.findAll('.folder-attachment__folder')[0];
    const focusedFolder = wrapper.findAll('.folder-attachment__folder')[1];
    expect(focusedFolder.classes()).toContain('is-focused');
    expect(renderedTabs[1].classes()).toContain('is-focused');
    expect(focusedFolder.classes()).not.toContain('is-hovered');
    expect(activeFolder.attributes('style')).toContain('--folder-piece-z: 300');
    expect(focusedFolder.attributes('style')).toContain('--folder-piece-z: 40');
    expect(focusedFolder.attributes('style')).toContain('--folder-piece-rest-x: 29.00px');
    expect(focusedFolder.attributes('style')).toContain('--folder-tab-hover-x: -6.00px');
    expect(focusedFolder.attributes('style')).toContain('--folder-tab-hover-y: 0.00px');
  });

  it('does not revive stale attached hover or focus state when a folder key returns', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'left',
        appearance: 'stack',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await wrapper.findAll('[role="tab"]')[1].trigger('pointerenter');
    await wrapper.findAll('[role="tab"]')[1].trigger('focus');
    await nextTick();
    expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-hovered');
    expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-focused');

    await wrapper.setProps({ tabs: tabs.filter((tab) => tab.key !== 'plans') });
    await nextTick();
    expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-active');

    await wrapper.setProps({ tabs });
    await nextTick();

    const restoredFolder = wrapper.findAll('.folder-attachment__folder')[1];
    const restoredTab = wrapper.findAll('[role="tab"]')[1];
    expect(restoredFolder.classes()).not.toContain('is-hovered');
    expect(restoredFolder.classes()).not.toContain('is-focused');
    expect(restoredTab.classes()).not.toContain('is-hovered');
    expect(restoredTab.classes()).not.toContain('is-focused');
    expect(wrapper.findAll('[role="tab"]')[0].attributes('tabindex')).toBe('0');
    expect(restoredTab.attributes('tabindex')).toBe('-1');
  });

  it('can emulate hover with BEM classes for visual QA', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'top',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const emulatedFolder = wrapper.findAll('.folder-attachment__folder')[1];
    const emulatedTab = wrapper.findAll('[role="tab"]')[1];

    expect(wrapper.find('.folder-attachment').classes()).toContain('folder-attachment--hover-emulated');
    expect(emulatedFolder.classes()).toContain('folder-attachment__folder--hover-emulated');
    expect(emulatedFolder.classes()).toContain('is-hovered');
    expect(emulatedTab.classes()).toContain('folder-attachment__tab--hover-emulated');
    expect(emulatedTab.classes()).toContain('is-hovered');
    expect(wrapper.findAll('.folder-attachment__folder')[0].attributes('style'))
      .toContain('--folder-piece-z: 300');
    expect(emulatedFolder.attributes('style')).toContain('--folder-piece-z: 40');
    expect(wrapper.findAll('.folder-attachment__folder')[2].attributes('style'))
      .toContain('--folder-piece-slot: 200.00px');
  });

  it('keeps active folders out of hover expansion and lets real hover own the QA hook', async () => {
    const wrapper = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const renderedTabs = wrapper.findAll('[role="tab"]');
    const folders = wrapper.findAll('.folder-attachment__folder');

    expect(folders[0].classes()).toContain('is-active');
    expect(folders[0].classes()).not.toContain('is-hovered');
    expect(renderedTabs[0].classes()).not.toContain('is-hovered');
    expect(folders[1].classes()).toContain('folder-attachment__folder--hover-emulated');

    await renderedTabs[3].trigger('pointerenter');
    await nextTick();

    expect(folders[1].classes()).not.toContain('is-hovered');
    expect(folders[1].classes()).not.toContain('folder-attachment__folder--hover-emulated');
    expect(folders[3].classes()).toContain('is-hovered');
    expect(renderedTabs[3].classes()).toContain('is-hovered');
  });

  it('lets an active end-gravity split tab suppress emulated neighbor hover', async () => {
    const wraparoundTabs: FolderTabItem[] = [
      { key: 'intake', label: 'Client intake', shortLabel: 'Intake', icon: Icon, count: 8, edge: 'top', gravity: 'start' },
      { key: 'evidence', label: 'Evidence cabinet', shortLabel: 'Evidence', icon: Icon, count: 14, edge: 'top', gravity: 'start' },
      { key: 'strategy', label: 'Strategy map', shortLabel: 'Strategy', icon: Icon, count: 3, edge: 'top', gravity: 'end' },
      { key: 'signals', label: 'Signal model', shortLabel: 'Signals', icon: Icon, count: 6, edge: 'top', gravity: 'end' },
      { key: 'review', label: 'Counsel review', shortLabel: 'Review', icon: Icon, count: 2, edge: 'top', gravity: 'end' },
    ];

    const wrapper = mount(FolderAttachment, {
      props: {
        tabs: wraparoundTabs,
        modelValue: 'review',
        ariaLabel: 'Split case binder',
        orientation: 'horizontal',
        edge: 'top',
        appearance: 'stack',
        expandOn: 'hover',
        emulatedHoverKey: 'strategy',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const renderedTabs = wrapper.findAll('[role="tab"]');
    let folders = wrapper.findAll('.folder-attachment__folder');

    expect(folders[2].classes()).toContain('is-hovered');
    expect(renderedTabs[2].classes()).toContain('is-expanded');
    expect(folders[4].classes()).toContain('is-active');
    expect(renderedTabs[4].classes()).not.toContain('is-expanded');

    await renderedTabs[4].trigger('pointerenter');
    await nextTick();
    folders = wrapper.findAll('.folder-attachment__folder');

    expect(folders[2].classes()).not.toContain('is-hovered');
    expect(renderedTabs[2].classes()).not.toContain('is-expanded');
    expect(folders[4].classes()).not.toContain('is-hovered');
    expect(renderedTabs[4].classes()).not.toContain('is-expanded');

    await renderedTabs[4].trigger('pointerleave');
    await nextTick();

    expect(wrapper.findAll('.folder-attachment__folder')[2].classes()).toContain('is-hovered');
  });

  it('does not hover-expand the selected bottom or right edge folder', async () => {
    const bottom = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'bottom',
        appearance: 'stack',
        emulatedHoverKey: 'photos',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const right = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        emulatedHoverKey: 'photos',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const bottomActive = bottom.findAll('.folder-attachment__folder')[0];
    const rightActive = right.findAll('.folder-attachment__folder')[0];

    expect(bottomActive.classes()).toContain('is-active');
    expect(bottomActive.classes()).not.toContain('is-hovered');
    expect(bottom.findAll('[role="tab"]')[0].classes()).not.toContain('is-hovered');

    expect(rightActive.classes()).toContain('is-active');
    expect(rightActive.classes()).not.toContain('is-hovered');
    expect(right.findAll('[role="tab"]')[0].classes()).not.toContain('is-hovered');
  });

  it('tugs bottom and right inactive hover handles without pulling folders', async () => {
    const bottom = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'horizontal',
        edge: 'bottom',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    const right = mount(FolderAttachment, {
      props: {
        tabs,
        modelValue: 'photos',
        ariaLabel: 'Media folders',
        orientation: 'vertical',
        edge: 'right',
        appearance: 'stack',
        emulatedHoverKey: 'plans',
      },
      slots: {
        default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
      },
    });

    await nextTick();

    const bottomActive = bottom.findAll('.folder-attachment__folder')[0];
    const bottomHovered = bottom.findAll('.folder-attachment__folder')[1];
    const rightActive = right.findAll('.folder-attachment__folder')[0];
    const rightHovered = right.findAll('.folder-attachment__folder')[1];

    expect(bottomActive.attributes('style')).toContain('--folder-piece-z: 300');
    expect(bottomHovered.attributes('style')).toContain('--folder-piece-z: 40');
    expect(bottomHovered.attributes('style')).toContain('--folder-piece-rest-y: -29.00px');
    expect(bottomHovered.attributes('style')).toContain('--folder-tab-hover-y: 6.00px');

    expect(rightActive.attributes('style')).toContain('--folder-piece-z: 300');
    expect(rightHovered.attributes('style')).toContain('--folder-piece-z: 40');
    expect(rightHovered.attributes('style')).toContain('--folder-piece-rest-x: -29.00px');
    expect(rightHovered.attributes('style')).toContain('--folder-tab-hover-x: 6.00px');
  });

  it('keeps deeply tucked handles large enough to expose the compact lane on every edge', async () => {
    const deepTabs: FolderTabItem[] = [
      tabs[0],
      tabs[1],
      { key: 'maps', label: 'Maps', shortLabel: 'Maps', icon: Icon },
      tabs[3],
      { key: 'audit', label: 'Audit trail', shortLabel: 'Audit', icon: Icon, count: 5 },
    ];
    const expectedRest = {
      top: ['0.00px', '36.00px'],
      bottom: ['0.00px', '-36.00px'],
      left: ['36.00px', '0.00px'],
      right: ['-36.00px', '0.00px'],
    } as const;

    for (const [edge, [expectedX, expectedY]] of Object.entries(expectedRest)) {
      const wrapper = mount(FolderAttachment, {
        props: {
          tabs: deepTabs,
          modelValue: 'photos',
          ariaLabel: `${edge} media folders`,
          orientation: edge === 'left' || edge === 'right' ? 'vertical' : 'horizontal',
          edge: edge as 'top' | 'bottom' | 'left' | 'right',
          appearance: 'stack',
        },
        slots: {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        },
      });

      await nextTick();

      expect(wrapper.find('.folder-attachment').attributes('style'))
        .toContain('--folder-side-stack-reveal: 120px');

      const deepestFolder = wrapper.findAll('.folder-attachment__folder')[1];
      const style = deepestFolder.attributes('style') ?? '';
      const expectedReachSize = edge === 'left' || edge === 'right' ? '156.00px' : '88.00px';

      expect(style).toContain(`--folder-piece-x: ${expectedX}`);
      expect(style).toContain(`--folder-piece-y: ${expectedY}`);
      expect(style).toContain(`--folder-piece-rest-x: ${expectedX}`);
      expect(style).toContain(`--folder-piece-rest-y: ${expectedY}`);
      expect(style).toContain('--folder-attached-tab-grab-size: 44.00px');
      expect(style).toContain(`--folder-attached-tab-reach-size: ${expectedReachSize}`);
      wrapper.unmount();
    }
  });

  it('derives deeply tucked handle reach from the visible grab-lane invariant', async () => {
    const deepTabs: FolderTabItem[] = [
      tabs[0],
      tabs[1],
      { key: 'maps', label: 'Maps', shortLabel: 'Maps', icon: Icon },
      tabs[3],
      { key: 'audit', label: 'Audit trail', shortLabel: 'Audit', icon: Icon, count: 5 },
    ];

    for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
      const wrapper = mount(FolderAttachment, {
        props: {
          tabs: deepTabs,
          modelValue: 'photos',
          ariaLabel: `${edge} media folders`,
          orientation: edge === 'left' || edge === 'right' ? 'vertical' : 'horizontal',
          edge,
          appearance: 'stack',
        },
        slots: {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        },
      });

      await nextTick();

      const deepestFolderIndex = 1;
      const reachSize = folderPieceStyleNumber(wrapper, deepestFolderIndex, '--folder-attached-tab-reach-size');
      const restX = folderPieceStyleNumber(wrapper, deepestFolderIndex, '--folder-piece-rest-x');
      const restY = folderPieceStyleNumber(wrapper, deepestFolderIndex, '--folder-piece-rest-y');
      const tuckedDistance = Math.max(Math.abs(restX), Math.abs(restY));
      const activePullCoverDistance = 0;

      expect(folderPieceStyleNumber(wrapper, deepestFolderIndex, '--folder-piece-x')).toBe(restX);
      expect(folderPieceStyleNumber(wrapper, deepestFolderIndex, '--folder-piece-y')).toBe(restY);
      expect(getFolderVisibleGrabSize(reachSize, tuckedDistance, activePullCoverDistance))
        .toBe(getFolderMinimumVisibleGrabSize(edge));

      wrapper.unmount();
    }
  });

  it('applies the same readable tucked depth ladder on every edge', async () => {
    const expectedRest = {
      top: ['0.00px', '29.00px'],
      bottom: ['0.00px', '-29.00px'],
      left: ['29.00px', '0.00px'],
      right: ['-29.00px', '0.00px'],
    } as const;

    for (const [edge, [expectedX, expectedY]] of Object.entries(expectedRest)) {
      const wrapper = mount(FolderAttachment, {
        props: {
          tabs,
          modelValue: 'photos',
          ariaLabel: `${edge} media folders`,
          orientation: edge === 'left' || edge === 'right' ? 'vertical' : 'horizontal',
          edge: edge as 'top' | 'bottom' | 'left' | 'right',
          appearance: 'stack',
        },
        slots: {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        },
      });

      await nextTick();

      const secondFolderStyle = wrapper.findAll('.folder-attachment__folder')[1].attributes('style') ?? '';

      expect(secondFolderStyle).toContain(`--folder-piece-x: ${expectedX}`);
      expect(secondFolderStyle).toContain(`--folder-piece-y: ${expectedY}`);
      expect(secondFolderStyle).toContain(`--folder-piece-rest-x: ${expectedX}`);
      expect(secondFolderStyle).toContain(`--folder-piece-rest-y: ${expectedY}`);
      wrapper.unmount();
    }
  });

  it('fronts the newly selected folder while the previous one returns', async () => {
    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          tone: 'teal',
          pullDistance: 8,
          returnDuration: 20,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    const wrapper = mount(Harness);
    const renderedTabs = wrapper.findAll('[role="tab"]');

    await renderedTabs[1].trigger('click');
    await nextTick();
    await waitForMotionFrame();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Floor plans');
    expect(wrapper.findAll('.folder-attachment__folder')[1].attributes('style')).toContain('--folder-piece-x: -8.00px');

    await renderedTabs[0].trigger('click');
    await nextTick();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Object photos');
    expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-selecting');
    expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-handoff');
    expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');
    expect(wrapper.findAll('.folder-attachment__folder')[0].attributes('style')).toContain('--folder-piece-z: 300');
    expect(wrapper.findAll('.folder-attachment__folder')[0].attributes('style')).toContain('--folder-piece-x: -8.00px');
    expect(wrapper.findAll('[role="tab"]')[0].classes()).toContain('is-open');
    expect(wrapper.findAll('[role="tab"]')[0].classes()).toContain('is-handoff');
    expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-returning');
    expect(wrapper.findAll('.folder-attachment__folder')[1].attributes('style')).toContain('--folder-piece-z: 240');

    await new Promise((resolve) => window.setTimeout(resolve, 25));
    await nextTick();
    await waitForMotionFrame();

    expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
    expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Object photos');
  });

  it('can keep active top-edge folders flush when pull distance is disabled', async () => {
    vi.useFakeTimers();

    const topTabs: FolderTabItem[] = [
      { key: 'photos', label: 'Photos', icon: Icon, count: 11, gravity: 'start' },
      { key: 'plans', label: 'Plans', icon: Icon, gravity: 'start' },
      { key: 'parking', label: 'Parking', shortLabel: 'Park', icon: Icon, count: 1, gravity: 'end' },
      { key: 'exterior', label: 'Exterior', shortLabel: 'Ext.', icon: Icon, count: 10, gravity: 'end' },
    ];

    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs: topTabs,
          modelValue: active.value,
          ariaLabel: 'Gallery categories',
          orientation: 'horizontal',
          edge: 'top',
          appearance: 'stack',
          expandOn: 'active',
          gravity: 'start',
          pullDuration: 30,
          returnDuration: 20,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    try {
      const wrapper = mount(Harness);
      const renderedTabs = wrapper.findAll('[role="tab"]');

      await renderedTabs[2].trigger('click');
      await nextTick();

      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Parking');
      expect(folderPieceStyleNumber(wrapper, 2, '--folder-piece-y')).toBe(0);
      expect(folderPieceStyleNumber(wrapper, 2, '--folder-piece-pull-y')).toBe(0);

      vi.advanceTimersByTime(30);
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[2].classes()).toContain('is-pulled');
      expect(folderPieceStyleNumber(wrapper, 2, '--folder-piece-y')).toBe(0);

      await renderedTabs[3].trigger('click');
      await nextTick();

      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Exterior');
      expect(folderPieceStyleNumber(wrapper, 3, '--folder-piece-y')).toBe(0);
      expect(folderPieceStyleNumber(wrapper, 3, '--folder-piece-pull-y')).toBe(0);
      expect(wrapper.findAll('.folder-attachment__folder')[3].attributes('style')).toContain('--folder-piece-z: 300');

      vi.advanceTimersByTime(50);
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[3].classes()).toContain('is-pulled');
      expect(folderPieceStyleNumber(wrapper, 3, '--folder-piece-y')).toBe(0);
      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Exterior');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps clicking an already pulled folder idempotent', async () => {
    vi.useFakeTimers();

    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Idempotent attached folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          pullDuration: 30,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    try {
      const wrapper = mount(Harness);
      const attachment = wrapper.findComponent(FolderAttachment);
      const renderedTabs = wrapper.findAll('[role="tab"]');

      await renderedTabs[0].trigger('click');
      await nextTick();

      expect(attachment.emitted('update:modelValue')).toBeUndefined();
      expect(attachment.emitted('activate')).toBeUndefined();
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');
      expect(wrapper.find('.folder-binder').classes()).not.toContain('is-pulled');

      await renderedTabs[1].trigger('click');
      await nextTick();

      expect(attachment.emitted('update:modelValue')).toEqual([['plans']]);
      expect(attachment.emitted('activate')?.[0]?.[0]).toBe('plans');
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-pulling');
      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');

      vi.advanceTimersByTime(30);
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-pulled');
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).not.toContain('is-pulling');

      await wrapper.findAll('[role="tab"]')[1].trigger('click');
      await nextTick();

      expect(attachment.emitted('update:modelValue')).toEqual([['plans']]);
      expect(attachment.emitted('activate')).toHaveLength(1);
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-pulled');
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).not.toContain('is-pulling');
      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Floor plans');
    } finally {
      vi.useRealTimers();
    }
  });

  it('remembers historical selection order for tucked folder z-indexes', async () => {
    vi.useFakeTimers();

    const historyTabs: FolderTabItem[] = [
      { key: 'one', label: 'One', icon: Icon },
      { key: 'two', label: 'Two', icon: Icon },
      { key: 'three', label: 'Three', icon: Icon },
      { key: 'four', label: 'Four', icon: Icon },
      { key: 'five', label: 'Five', icon: Icon },
    ];

    const Harness = defineComponent({
      setup() {
        const active = ref('three');

        return () => h(FolderAttachment, {
          tabs: historyTabs,
          modelValue: active.value,
          ariaLabel: 'Historical folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          pullDuration: 10,
          returnDuration: 10,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    try {
      const wrapper = mount(Harness);
      const initialFolders = wrapper.findAll('.folder-attachment__folder');

      expect(folderPieceZ(wrapper, 2)).toBe(300);
      expect(folderPieceZ(wrapper, 3)).toBeLessThan(folderPieceZ(wrapper, 2));
      expect(initialFolders[0].classes()).toContain('is-tucked');
      expect(initialFolders[2].classes()).not.toContain('is-tucked');

      await wrapper.findAll('[role="tab"]')[4].trigger('click');
      await nextTick();
      vi.advanceTimersByTime(10);
      await nextTick();

      expect(folderPieceZ(wrapper, 4)).toBe(300);
      expect(folderPieceZ(wrapper, 2)).toBeGreaterThan(folderPieceZ(wrapper, 3));
      expect(folderPieceZ(wrapper, 2)).toBeGreaterThan(folderPieceZ(wrapper, 1));
      expect(folderPieceStyleNumber(wrapper, 2, '--folder-piece-rest-x')).toBe(15);
      expect(folderPieceStyleNumber(wrapper, 3, '--folder-piece-rest-x')).toBe(22);

      await wrapper.findAll('[role="tab"]')[1].trigger('click');
      await nextTick();

      expect(folderPieceZ(wrapper, 1)).toBe(300);

      vi.advanceTimersByTime(20);
      await nextTick();

      expect(folderPieceZ(wrapper, 4)).toBeGreaterThan(folderPieceZ(wrapper, 2));
      expect(folderPieceZ(wrapper, 2)).toBeGreaterThan(folderPieceZ(wrapper, 3));
      expect(folderPieceZ(wrapper, 3)).toBeGreaterThan(folderPieceZ(wrapper, 0));
      expect(folderPieceStyleNumber(wrapper, 4, '--folder-piece-rest-x')).toBe(15);
      expect(folderPieceStyleNumber(wrapper, 2, '--folder-piece-rest-x')).toBe(22);
      expect(folderPieceStyleNumber(wrapper, 0, '--folder-piece-rest-x')).toBe(36);

      const historicalZBeforeHover = folderPieceZ(wrapper, 2);
      await wrapper.findAll('[role="tab"]')[2].trigger('pointerenter');
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[2].classes()).toContain('is-hovered');
      expect(folderPieceZ(wrapper, 2)).toBe(historicalZBeforeHover);
      expect(folderPieceZ(wrapper, 2)).not.toBe(180);
      expect(folderPieceZ(wrapper, 2)).not.toBe(190);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a returning folder folding while rapid clicks update the next pulled folder', async () => {
    vi.useFakeTimers();

    const Harness = defineComponent({
      setup() {
        const active = ref('photos');

        return () => h(FolderAttachment, {
          tabs,
          modelValue: active.value,
          ariaLabel: 'Media folders',
          orientation: 'vertical',
          edge: 'left',
          appearance: 'stack',
          tone: 'teal',
          pullDuration: 40,
          returnDuration: 60,
          'onUpdate:modelValue': (key: FolderTabKey) => {
            active.value = String(key);
          },
        }, {
          default: ({ activeTab }: { activeTab: FolderTabItem | null }) => h('p', activeTab?.label),
        });
      },
    });

    try {
      const wrapper = mount(Harness);
      await wrapper.findAll('[role="tab"]')[1].trigger('click');
      await nextTick();
      vi.advanceTimersByTime(40);
      await nextTick();

      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
      expect(wrapper.findAll('[role="tab"]')[1].classes()).toContain('is-pulled');

      await wrapper.findAll('[role="tab"]')[3].trigger('click');
      await nextTick();

      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Documents');
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-returning');
      expect(wrapper.findAll('.folder-attachment__folder')[3].classes()).toContain('is-selecting');
      expect(wrapper.findAll('.folder-attachment__folder')[3].classes()).toContain('is-handoff');
      expect(wrapper.findAll('.folder-attachment__folder')[3].attributes('style')).toContain('--folder-piece-z: 300');

      await wrapper.findAll('[role="tab"]')[0].trigger('click');
      await nextTick();

      expect(wrapper.find('.folder-attachment__content:not([hidden])').text()).toBe('Object photos');
      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-returning');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-selecting');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-handoff');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');
      expect(wrapper.findAll('.folder-attachment__folder')[0].attributes('style')).toContain('--folder-piece-z: 300');

      vi.advanceTimersByTime(59);
      await nextTick();

      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');
      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).toContain('is-returning');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-handoff');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');

      vi.advanceTimersByTime(1);
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[1].classes()).not.toContain('is-returning');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-pulling');
      expect(wrapper.find('.folder-binder').classes()).toContain('is-pulled');

      vi.advanceTimersByTime(40);
      await nextTick();

      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).toContain('is-pulled');
      expect(wrapper.findAll('.folder-attachment__folder')[0].classes()).not.toContain('is-pulling');
    } finally {
      vi.useRealTimers();
    }
  });
});
