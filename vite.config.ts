import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from /<repository-name>/.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/examforge/' : '/',
  plugins: [react()],
})
