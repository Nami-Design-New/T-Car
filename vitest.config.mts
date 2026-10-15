import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

// Component and unit tests (jsdom). Styles are not loaded: behavior only.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
      '@assets': path.join(root, 'src/assets'),
      '@components': path.join(root, 'src/components'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
