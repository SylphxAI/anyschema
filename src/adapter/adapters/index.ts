/**
 * Built-in Adapters
 *
 * No auto-registration - import only what you need for tree-shaking.
 * Use with createValidator/createTransformer for type-safe plugin architecture.
 */

// Export all adapters (no side effects)
export { arktypeAdapter } from './arktype.js'
export { effectAdapter } from './effect.js'
export { ioTsAdapter } from './io-ts.js'
export { joiAdapter } from './joi.js'
export { runtypesAdapter } from './runtypes.js'
export { superstructAdapter } from './superstruct.js'
export { typeboxAdapter } from './typebox.js'
export { valibotAdapter } from './valibot.js'
export { yupAdapter } from './yup.js'
export { zodV3Adapter } from './zod-v3.js'
export { zodV4Adapter } from './zod-v4.js'

// Pre-configured adapter arrays for convenience
export const allAdapters = [
	// Order matters - more specific first
	// Dynamic imports would be needed for true lazy loading
] as const
