import { defineConfig } from 'vite';
import { resolve } from 'path';

const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
