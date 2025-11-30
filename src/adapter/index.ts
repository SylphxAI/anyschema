/**
 * Adapter System
 *
 * Plugin-based schema handling with zero dependencies.
 * Supports all major schema libraries via duck typing.
 */

export type { Transformer, TransformerOptions } from './createTransformer.js'
export { createTransformer } from './createTransformer.js'
// Factory functions (separate files for tree-shaking)
export type { Validator, ValidatorOptions } from './createValidator.js'
export { createValidator } from './createValidator.js'
// Composable helpers
export {
	isJsonSchema,
	tryNativeToJsonSchema,
	withCallable,
	withCheck,
	withDecode,
	withJoiValidate,
	withSafeParse,
	withSafeParseAsync,
	withStructValidate,
	withValibotRun,
	withValibotRunAsync,
	withValidateSync,
} from './helpers.js'
// Transformer
export { toJsonSchema } from './transformer.js'
// Types and registry
export type {
	InferSchema,
	InferSchemas,
	PartialSchemaAdapter,
	SchemaAdapter,
	SchemaConstraints,
} from './types.js'
export { defineAdapter, findAdapter, getAdapters, registerAdapter } from './types.js'

// Register all adapters (side-effect import for backwards compatibility)
// import './register-all.js'  // Uncomment if you want auto-registration

// Export schema types for type-safe usage
export type { ArkTypeSchema } from './adapters/arktype.js'
export type { EffectSchema } from './adapters/effect.js'
// Export all adapters
export {
	arktypeAdapter,
	effectAdapter,
	ioTsAdapter,
	joiAdapter,
	runtypesAdapter,
	superstructAdapter,
	typeboxAdapter,
	valibotAdapter,
	yupAdapter,
	zodV3Adapter,
	zodV4Adapter,
} from './adapters/index.js'
export type { IoTsSchema } from './adapters/io-ts.js'
export type { JoiSchema } from './adapters/joi.js'
export type { RuntypesSchema } from './adapters/runtypes.js'
export type { SuperstructSchema } from './adapters/superstruct.js'
export type { TypeBoxSchema } from './adapters/typebox.js'
export type { ValibotSchema } from './adapters/valibot.js'
export type { YupSchema } from './adapters/yup.js'
export type { ZodV3Schema } from './adapters/zod-v3.js'
export type { ZodV4Schema } from './adapters/zod-v4.js'
