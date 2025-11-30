import { defineConfig } from 'bunup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	clean: true,
	sourcemap: true,
	splitting: false,
	minify: false,
	external: [
		'zod',
		'zod/v4',
		'zod-to-json-schema',
		'valibot',
		'@valibot/to-json-schema',
		'arktype',
	],
})
