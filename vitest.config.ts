import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Server-side unit tests only. They import route files directly and stub the
// Nuxt/Nitro pieces those files expect (see tests/setup.ts and tests/mocks).
export default defineConfig({
  resolve: {
    alias: {
      '#supabase/server': fileURLToPath(new URL('./tests/mocks/supabase-server.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
