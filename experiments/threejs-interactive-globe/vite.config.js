import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'js/entry.js',
      name: 'InteractiveGlobe',
      formats: ['iife'],
      fileName: () => 'globe.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
  },
});
