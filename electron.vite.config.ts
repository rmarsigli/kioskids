import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { cpSync } from 'fs'

/**
 * Copies the SQL migration files into the bundled output directory so the
 * Main process can find them at runtime via __dirname-relative paths.
 * SQL files are not JS — Rollup won't bundle them automatically.
 */
function copyMigrations() {
  return {
    name: 'copy-migrations',
    closeBundle() {
      cpSync(
        resolve('src/main/database/migrations/sql'),
        resolve('out/main/migrations/sql'),
        { recursive: true },
      )
    },
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMigrations()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer/src'),
      },
    },
  },
})
