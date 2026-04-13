import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'cli/index': 'src/cli/index.ts',
        'zod/index': 'src/zod/index.ts',
        'express/index': 'src/express/index.ts',
        'yup/index': 'src/yup/index.ts',
        'valibot/index': 'src/valibot/index.ts',
        'react/index': 'src/react/index.ts',
        'rhf/index': 'src/rhf/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
});
