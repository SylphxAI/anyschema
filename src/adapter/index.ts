/**
 * Adapter System
 *
 * Plugin-based schema handling with zero dependencies.
 * Supports all major schema libraries via duck typing.
 */

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
// Factory functions
export { createTransformer, createValidator } from './factory.js'
export type { Transformer, TransformerOptions, Validator, ValidatorOptions } from './factory.js'

// Built-in adapters (auto-registers)
import './adapters/index.js'

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

// Export schema types for type-safe usage
export type { ArkTypeSchema } from './adapters/arktype.js'
export type { EffectSchema } from './adapters/effect.js'
export type { IoTsSchema } from './adapters/io-ts.js'
export type { JoiSchema } from './adapters/joi.js'
export type { RuntypesSchema } from './adapters/runtypes.js'
export type { SuperstructSchema } from './adapters/superstruct.js'
export type { TypeBoxSchema } from './adapters/typebox.js'
export type { ValibotSchema } from './adapters/valibot.js'
export type { YupSchema } from './adapters/yup.js'
export type { ZodV3Schema } from './adapters/zod-v3.js'
export type { ZodV4Schema } from './adapters/zod-v4.js'
