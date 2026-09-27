import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' — щоб зібраний прототип працював і з підпапки GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5190, strictPort: true },
})
