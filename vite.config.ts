import { defineConfig } from 'vite';

// base: './' emits relative asset URLs so the built bundle in dist/ opens
// fully offline from any path (including file://) with no server rewrites.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
