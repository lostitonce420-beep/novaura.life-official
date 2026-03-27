import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      input: mode === 'landing' 
        ? path.resolve(__dirname, 'src/landing-main.jsx')
        : path.resolve(__dirname, 'index.html'),
    },
  },
}));
