import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages project site: https://aeschyleaa.github.io/u-sehat-badminton/
  base: '/u-sehat-badminton/',
  plugins: [react()],
})
