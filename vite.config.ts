import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/apims': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        rewrite: () =>
          '/api3/publicmapproxy/PUBLIC_DISPLAY/CAQM_MCAQM_Current_Reading/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json',
        headers: {
          Referer: 'https://eqms.doe.gov.my/APIMS/main'
        }
      }
    }
  }
})
