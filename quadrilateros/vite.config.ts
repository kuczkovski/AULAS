import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Dois modos de build:
//  - padrão: PWA instalável (service worker + manifest) para hospedar em um servidor/GitHub Pages;
//  - "single": um único arquivo HTML autocontido que funciona offline abrindo direto no navegador.
// Navegadores atuais (Chrome, Samsung Internet) usam WOFF2: remove as alternativas
// WOFF/TTF das folhas de estilo de fontes para reduzir o tamanho do pacote offline.
const woff2Only = (): Plugin => ({
  name: 'woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('.css') || !id.includes('node_modules')) return null
    return code.replace(/,\s*url\([^)]*\.(?:woff|ttf)\)\s*format\(["'](?:woff|truetype)["']\)/g, '')
  },
})

export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    base: './',
    plugins: [
      woff2Only(),
      react(),
      tailwindcss(),
      single
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
              name: 'Geometria em Quadrinhos — Quadriláteros Notáveis',
              short_name: 'Quadriláteros',
              description: 'Quadro digital interativo para a aula de quadriláteros notáveis.',
              lang: 'pt-BR',
              theme_color: '#15803d',
              background_color: '#f0fdf4',
              display: 'fullscreen',
              orientation: 'landscape',
              start_url: './',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ttf}'],
              maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
            },
          }),
    ],
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000, cssCodeSplit: false }
      : { outDir: 'dist' },
  }
})
