import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['leaflet', 'chart.js/auto'],
      output: {
        globals: {
          leaflet: 'L',
          'chart.js/auto': 'Chart',
        },
      },
    },
  },
});
