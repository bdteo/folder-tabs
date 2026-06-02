import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src/components/folder-tabs',
      include: ['src/components/folder-tabs'],
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: 'src/components/folder-tabs/index.ts',
      name: 'FolderTabs',
      fileName: 'folder-tabs',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
