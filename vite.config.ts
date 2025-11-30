/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Base path for GitHub Pages deployment (repo name)
  // Set to '/' for custom domain or local development
  // GITHUB_ACTIONS is automatically set to 'true' in GitHub Actions
  base: process.env.GITHUB_ACTIONS === 'true' ? '/NeuroViz/' : '/',
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@presentation': resolve(__dirname, 'src/presentation'),
    },
  },
  build: {
    target: 'ES2022',
    sourcemap: true,
  },
  preview: {
    port: 5173,
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/index.ts'],
    },
    mockReset: true,
  },
});
