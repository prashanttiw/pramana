import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/zod/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
});
