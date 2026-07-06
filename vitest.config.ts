import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // PGlite boots a WASM Postgres per test file — allow generous timeouts
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: 'forks',
    server: {
      deps: {
        // Must be inlined so the #wasm-engine-loader alias below takes effect
        // inside the generated client.
        inline: [/prisma-generated/],
      },
    },
  },
  resolve: {
    alias: [
      // Tests run against an in-process PGlite Postgres instead of the real DB,
      // and a controllable Square fake instead of the live SDK client.
      { find: /^@\/lib\/prisma$/, replacement: path.resolve(__dirname, 'tests/helpers/prismaTestClient.ts') },
      { find: /^@\/lib\/square$/, replacement: path.resolve(__dirname, 'tests/helpers/squareMock.ts') },
      // Prisma's WASM engine loader needs bundler semantics; supply our own.
      { find: '#wasm-engine-loader', replacement: path.resolve(__dirname, 'tests/helpers/wasmEngineLoader.ts') },
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
    ],
  },
})
