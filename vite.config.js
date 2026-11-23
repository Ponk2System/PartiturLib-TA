import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'PartiturLib — Perpustakaan Partitur Musik',
        short_name: 'PartiturLib',
        description: 'Perpustakaan & Arsip Partitur Musik Digital (Orkestra, Strings, Solo Instrumen)',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8f6f0',
        theme_color: '#f8f6f0',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
