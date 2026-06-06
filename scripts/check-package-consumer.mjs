import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const tscBin = path.join(nodeModulesDir, '.bin', 'tsc');
const vueTscBin = path.join(nodeModulesDir, '.bin', 'vue-tsc');

const requiredPackedFiles = [
  'dist/folder-tabs.css',
  'dist/folder-tabs.js',
  'dist/folder-tabs.umd.cjs',
  'dist/index.d.ts',
  'docs/screenshots/demo-attached-desktop.png',
  'docs/screenshots/demo-attached-mobile.png',
  'docs/screenshots/demo-desktop.png',
  'docs/screenshots/demo-mobile.png',
  'registry/vue/folder-tabs/css.d.ts',
  'registry/vue/folder-tabs/folder-tabs.json',
  'registry/vue/folder-tabs/index.ts',
  'scripts/check-demo-geometry.mjs',
  'scripts/check-demo-screenshots.mjs',
  'scripts/check-package-consumer.mjs',
  'scripts/capture-demo-screenshots.mjs',
  'scripts/demo-cdp-utils.mjs',
  'scripts/demo-screenshot-utils.mjs',
  'scripts/verify-all.mjs',
  'src/components/folder-tabs/css.d.ts',
  'src/components/folder-tabs/folder-tabs.css',
  'src/components/folder-tabs/index.ts',
  'src/vite-env.d.ts',
];

const forbiddenPackedFiles = [
  'dist-demo/index.html',
  'node_modules/vue/package.json',
  'registry/vue/folder-tabs/vue.d.ts',
  'src/App.vue',
  'src/components/folder-tabs/vue.d.ts',
  'src/demo/demo.css',
  'tests/folderTabs.test.ts',
];

class CommandFailure extends Error {
  constructor(status) {
    super('Command failed.');
    this.status = status;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    env: process.env,
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`);

    if (result.stdout) {
      console.error(result.stdout);
    }

    if (result.stderr) {
      console.error(result.stderr);
    }

    throw new CommandFailure(result.status ?? 1);
  }

  return result.stdout.trim();
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function linkDependency(consumerDir, packageName) {
  mkdirSync(path.join(consumerDir, 'node_modules'), { recursive: true });
  symlinkSync(path.join(nodeModulesDir, packageName), path.join(consumerDir, 'node_modules', packageName));
}

function linkVueDependency(consumerDir) {
  linkDependency(consumerDir, 'vue');
}

function createPackedPackageConsumer(tempRoot, tarballPath) {
  const consumerDir = path.join(tempRoot, 'package-consumer');
  const scopeDir = path.join(consumerDir, 'node_modules', '@bdteo');

  mkdirSync(scopeDir, { recursive: true });
  mkdirSync(path.join(consumerDir, 'src'), { recursive: true });
  run('tar', ['-xzf', tarballPath, '-C', scopeDir], { cwd: rootDir });
  renameSync(path.join(scopeDir, 'package'), path.join(scopeDir, 'folder-tabs'));
  linkVueDependency(consumerDir);

  writeJson(path.join(consumerDir, 'package.json'), {
    type: 'module',
    dependencies: {
      '@bdteo/folder-tabs': '0.1.0',
      vue: '^3.5.0',
    },
    devDependencies: {
      typescript: '^5.9.0',
    },
  });

  writeJson(path.join(consumerDir, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      jsx: 'preserve',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: false,
    },
    include: ['src/**/*.ts'],
  });

  writeFileSync(path.join(consumerDir, 'src', 'type-fidelity.ts'), [
    "import { FolderAttachment, FolderTabs, type FolderTabItem } from '@bdteo/folder-tabs';",
    "import { FolderAttachment as SourceFolderAttachment, type FolderTabItem as SourceFolderTabItem } from '@bdteo/folder-tabs/source';",
    "import '@bdteo/folder-tabs/style.css';",
    '',
    'type PropsOf<T> = T extends new (...args: any[]) => { $props: infer Props } ? Props : never;',
    'type IsUnknown<T> = unknown extends T ? ([T] extends [unknown] ? true : false) : false;',
    'type AssertFalse<T extends false> = T;',
    '',
    "const builtTabs: FolderTabItem[] = [{ key: 'a', label: 'A' }];",
    "const sourceTabs: SourceFolderTabItem[] = [{ key: 'b', label: 'B', edge: 'right' }];",
    '',
    "type BuiltTabsIsUnknown = IsUnknown<PropsOf<typeof FolderAttachment>['tabs']>;",
    "type SourceTabsIsUnknown = IsUnknown<PropsOf<typeof SourceFolderAttachment>['tabs']>;",
    '',
    'type BuiltShouldKeepTabsType = AssertFalse<BuiltTabsIsUnknown>;',
    'type SourceShouldKeepTabsType = AssertFalse<SourceTabsIsUnknown>;',
    '',
    'void FolderAttachment;',
    'void FolderTabs;',
    'void SourceFolderAttachment;',
    'void builtTabs;',
    'void sourceTabs;',
    'void (null as unknown as BuiltShouldKeepTabsType);',
    'void (null as unknown as SourceShouldKeepTabsType);',
    '',
  ].join('\n'));

  return consumerDir;
}

function createRegistryCopyInConsumer(tempRoot) {
  const consumerDir = path.join(tempRoot, 'registry-copy-in-consumer');
  const registryDir = path.join(rootDir, 'registry', 'vue', 'folder-tabs');
  const registryItem = JSON.parse(readFileSync(path.join(registryDir, 'folder-tabs.json'), 'utf8'));

  mkdirSync(path.join(consumerDir, 'src'), { recursive: true });
  linkVueDependency(consumerDir);
  linkDependency(consumerDir, 'vite');

  for (const file of registryItem.files) {
    const sourcePath = path.join(registryDir, file.path);
    const targetPath = path.join(consumerDir, 'src', file.target);

    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }

  writeJson(path.join(consumerDir, 'package.json'), {
    type: 'module',
    dependencies: {
      vue: '^3.5.0',
    },
    devDependencies: {
      typescript: '^5.9.0',
      'vue-tsc': '^2.2.0',
    },
  });

  writeJson(path.join(consumerDir, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      jsx: 'preserve',
      resolveJsonModule: true,
      isolatedModules: true,
      esModuleInterop: true,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: false,
    },
    include: ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.d.ts'],
  });

  writeFileSync(path.join(consumerDir, 'src', 'env.d.ts'), [
    '/// <reference types="vite/client" />',
    '',
    "declare module '*.vue' {",
    "  import type { DefineComponent } from 'vue';",
    '  const component: DefineComponent<{}, {}, any>;',
    '  export default component;',
    '}',
    '',
  ].join('\n'));

  writeFileSync(path.join(consumerDir, 'src', 'type-fidelity.ts'), [
    "import { FolderAttachment, type FolderTabItem } from './components/ui/folder-tabs';",
    '',
    'type PropsOf<T> = T extends new (...args: any[]) => { $props: infer Props } ? Props : never;',
    'type IsUnknown<T> = unknown extends T ? ([T] extends [unknown] ? true : false) : false;',
    'type AssertFalse<T extends false> = T;',
    '',
    "const tabs: FolderTabItem[] = [{ key: 'b', label: 'B', edge: 'right' }];",
    "type TabsIsUnknown = IsUnknown<PropsOf<typeof FolderAttachment>['tabs']>;",
    'type ShouldKeepTabsType = AssertFalse<TabsIsUnknown>;',
    '',
    'void FolderAttachment;',
    'void tabs;',
    'void (null as unknown as ShouldKeepTabsType);',
    '',
  ].join('\n'));

  return consumerDir;
}

function packPackage(tempRoot) {
  const packOutput = run('pnpm', ['pack', '--json', '--out', path.join(tempRoot, '%s-%v.tgz')]);
  const parsed = JSON.parse(packOutput);
  const packResult = Array.isArray(parsed) ? parsed[0] : parsed;

  if (!packResult?.filename) {
    throw new Error('pnpm pack did not return a tarball filename.');
  }

  return packResult;
}

function verifyPackedPackageContents(packResult) {
  const packedFiles = new Set((packResult.files ?? []).map((file) => file.path));
  const missingFiles = requiredPackedFiles.filter((file) => !packedFiles.has(file));
  const unexpectedFiles = forbiddenPackedFiles.filter((file) => packedFiles.has(file));

  if (missingFiles.length > 0 || unexpectedFiles.length > 0) {
    throw new Error([
      'Packed package contents did not match the publish contract.',
      ...missingFiles.map((file) => `Missing: ${file}`),
      ...unexpectedFiles.map((file) => `Unexpected: ${file}`),
    ].join('\n'));
  }

  console.log(`Packed package contents passed (${packedFiles.size} files checked).`);
}

const tempRoot = mkdtempSync(path.join(tmpdir(), 'foldertabs-package-check-'));
let exitCode = 0;

try {
  console.log('Building package...');
  run('pnpm', ['build']);

  console.log('Packing package...');
  const packResult = packPackage(tempRoot);
  verifyPackedPackageContents(packResult);

  console.log('Checking packed package imports...');
  const packageConsumerDir = createPackedPackageConsumer(tempRoot, packResult.filename);
  run(tscBin, ['--noEmit', '--project', path.join(packageConsumerDir, 'tsconfig.json')]);

  console.log('Checking registry copy-in imports...');
  const registryConsumerDir = createRegistryCopyInConsumer(tempRoot);
  run(vueTscBin, ['--noEmit', '--project', path.join(registryConsumerDir, 'tsconfig.json')]);

  console.log('Package consumer checks passed.');
} catch (error) {
  if (error instanceof CommandFailure) {
    exitCode = error.status;
  } else {
    console.error(error instanceof Error ? error.message : error);
    exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { force: true, recursive: true });
}

if (exitCode !== 0) {
  process.exitCode = exitCode;
}
