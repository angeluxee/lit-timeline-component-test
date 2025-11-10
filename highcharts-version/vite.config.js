import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'component.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: /^lit/
    }
  },
  css: {
    preprocessorOptions: {
      scss: {}
    }
  }
});
