import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '回路 Circuit',
        short_name: '回路',
        description: '中式民俗恐怖叙事 AVG',
        lang: 'zh-CN',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#080a09',
        theme_color: '#111713',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true
  }
});
