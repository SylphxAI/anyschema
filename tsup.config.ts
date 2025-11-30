import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/zod.ts',
    'src/valibot.ts',
    'src/arktype.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  external: [
    'zod',
    'zod-to-json-schema',
    'valibot',
    '@valibot/to-json-schema',
    'arktype',
  ],
});
