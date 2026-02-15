import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'https://capstone-project-daily-puzzle-logic-sand.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
