/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

interface RewriteComfyImportsOptions {
  isDev: boolean;
}

// Plugin to correctly handle the ComfyUI scripts in development mode
const rewriteComfyImports = ({ isDev }: RewriteComfyImportsOptions) => {
  return {
    name: 'rewrite-comfy-imports',
    resolveId(source: string) {
      if (!isDev) {
        return;
      }
      if (source === '/scripts/app.js') {
        return 'http://127.0.0.1:8188/scripts/app.js';
      }
      if (source === '/scripts/api.js') {
        return 'http://127.0.0.1:8188/scripts/api.js';
      }
      return null;
    },
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), rewriteComfyImports({ isDev: mode === 'development' })],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      // Don't bundle ComfyUI scripts - they will be loaded from the ComfyUI server
      external: ['/scripts/app.js', '/scripts/api.js'],
      input: {
        main: path.resolve(__dirname, 'src/main.tsx'),
      },
      output: {
        // Output to the dist/asset_manager directory
        dir: '../dist',
        entryFileNames: 'asset_manager/[name].js',
        chunkFileNames: 'asset_manager/[name]-[hash].js',
        assetFileNames: 'asset_manager/[name][extname]',
        // Split React into a separate vendor chunk for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    reporters: ['default', 'junit'],
    outputFile: 'test-results/junit.xml',
    exclude: [
      'tests-e2e/**',
      'playwright-report/**',
      'blob-report/**',
      'node_modules/**',
    ],
  },
}));
