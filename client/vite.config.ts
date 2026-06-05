import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('/node_modules/@mui/x-data-grid')) return 'vendor-datagrid';
          if (
            id.includes('/node_modules/@mui/material') ||
            id.includes('/node_modules/@mui/icons-material') ||
            id.includes('/node_modules/@emotion/react') ||
            id.includes('/node_modules/@emotion/styled')
          ) return 'vendor-mui';
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router-dom/')
          ) return 'vendor-react';
        },
      },
    },
  },
})
