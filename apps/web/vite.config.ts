import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@x10think/constants': path.resolve(__dirname, '../../packages/constants/src/index.ts'),
      react: path.resolve(__dirname, 'node_modules/react'),
    },
  },
  server: {
    port: 5173,
  },
});
