import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const base = loadEnv(mode, '.', 'CIRCUIT_').CIRCUIT_BASE_PATH ?? '/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'icons/*.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        },
        manifest: {
          name: '回路 Circuit',
          short_name: '回路',
          description: '中式民俗恐怖叙事 AVG',
          lang: 'zh-CN',
          display: 'standalone',
          orientation: 'any',
          background_color: '#080a09',
          theme_color: '#111713',
          icons: [
            { src: `${base}icons/192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: `${base}icons/512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
            {
              src: `${base}icon.svg`,
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
  };
});
