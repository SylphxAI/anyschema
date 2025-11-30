/**
 * Adapter System
 *
 * Plugin-based schema handling with zero dependencies.
 * Split into validator and transformer for optimal tree-shaking.
 */

// ============================================================================
// Factory Functions
// ============================================================================

export type { Validator, ValidatorOptions } from './createValidator.js'
export { createValidator } from './createValidator.js'
export type { Transformer, TransformerOptions } from './createTransformer.js'
export { createTransformer } from './createTransformer.js'

// ============================================================================
// Types
// ============================================================================

export type {
	// Adapter types
	ValidatorAdapter,
	TransformerAdapter,
	SchemaAdapter,
	PartialValidatorAdapter,
	PartialTransformerAdapter,
	PartialSchemaAdapter,
	SchemaConstraints,
	// Type inference
	InferValidatorSchema,
	InferValidatorSchemas,
	InferTransformerSchema,
	InferTransformerSchemas,
	InferSchema,
	InferSchemas,
} from './types.js'
export {
	defineValidatorAdapter,
	defineTransformerAdapter,
	defineAdapter,
	findAdapter,
	getAdapters,
	registerAdapter,
} from './types.js'

// ============================================================================
// Validators (minimal - for validation only)
// ============================================================================

export {
	zodV4Validator,
	zodV3Validator,
	valibotValidator,
	arktypeValidator,
	yupValidator,
	joiValidator,
	ioTsValidator,
	superstructValidator,
	typeboxValidator,
	effectValidator,
	runtypesValidator,
} from './adapters/index.js'

// ============================================================================
// Transformers (for JSON Schema conversion)
// ============================================================================

export {
	zodV4Transformer,
	zodV3Transformer,
	valibotTransformer,
	arktypeTransformer,
	yupTransformer,
	joiTransformer,
	ioTsTransformer,
	superstructTransformer,
	typeboxTransformer,
	effectTransformer,
	runtypesTransformer,
} from './adapters/index.js'

// ============================================================================
// Full Adapters (backwards compatible - deprecated)
// ============================================================================

export {
	zodV4Adapter,
	zodV3Adapter,
	valibotAdapter,
	arktypeAdapter,
	yupAdapter,
	joiAdapter,
	ioTsAdapter,
	superstructAdapter,
	typeboxAdapter,
	effectAdapter,
	runtypesAdapter,
} from './adapters/index.js'

// ============================================================================
// Schema Types (for type inference)
// ============================================================================

export type {
	ZodV4Schema,
	ZodV3Schema,
	ValibotSchema,
	ArkTypeSchema,
	YupSchema,
	JoiSchema,
	IoTsSchema,
	SuperstructSchema,
	TypeBoxSchema,
	EffectSchema,
	RuntypesSchema,
} from './adapters/index.js'

// ============================================================================
// Helpers and Legacy
// ============================================================================

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

export { toJsonSchema } from './transformer.js'
