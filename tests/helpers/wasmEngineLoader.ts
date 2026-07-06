/**
 * Replacement for prisma-generated's `#wasm-engine-loader` (see vitest.config.ts).
 * The stock loader does `import('./query_engine_bg.wasm')`, which only bundlers
 * understand. Prisma awaits this module's default export and expects a compiled
 * WebAssembly.Module, which it then instantiates itself.
 *
 * We use the WASM query engine in tests because this machine is Windows ARM64,
 * where Prisma's native x64 query engine DLL cannot load.
 */
import fs from 'fs'
import path from 'path'

const wasmPath = path.resolve(
  __dirname,
  '../../node_modules/prisma-generated/query_engine_bg.wasm'
)

// Prisma does `const engine = (await loader).default` — mimic a wasm module
// namespace whose default export is the compiled WebAssembly.Module.
export default (async () => ({
  default: new WebAssembly.Module(fs.readFileSync(wasmPath)),
}))()
