import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  // External - these are dynamically imported at runtime
  external: [
    'zod',
    'zod-to-json-schema',
    'valibot',
    '@valibot/to-json-schema',
    'arktype',
  ],
});
