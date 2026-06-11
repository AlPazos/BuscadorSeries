import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // tercer argumento '': carga también las variables sin prefijo VITE_
  // (TMDB_API_KEY no lleva el prefijo a propósito, para que no entre en el bundle)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), cloudflare()],
    server: {
      // En desarrollo, Vite hace de proxy igual que la Pages Function en producción:
      // reenvía /api/* a TMDB añadiendo la key, que así no aparece en el navegador.
      proxy: {
        '/api': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          rewrite: (path) => {
            const stripped = path.replace(/^\/api/, '')
            const sep = stripped.includes('?') ? '&' : '?'
            return `${stripped}${sep}api_key=${env.TMDB_API_KEY}`
          },
        },
      },
    },
  };
})