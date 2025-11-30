/**
 * Adapter System
 *
 * Plugin-based schema handling with zero dependencies.
 * Split into validator and transformer for optimal tree-shaking.
 */

// Schema Types
export type {
	ArkTypeSchema,
	EffectSchema,
	IoTsSchema,
	JoiSchema,
	RuntypesSchema,
	SuperstructSchema,
	TypeBoxSchema,
	ValibotSchema,
	YupSchema,
	ZodV3Schema,
	ZodV4Schema,
} from './adapters/index.js'
// Validators
// Transformers
export {
	arktypeTransformer,
	arktypeValidator,
	effectTransformer,
	effectValidator,
	ioTsTransformer,
	ioTsValidator,
	joiTransformer,
	joiValidator,
	runtypesTransformer,
	runtypesValidator,
	superstructTransformer,
	superstructValidator,
	typeboxTransformer,
	typeboxValidator,
	valibotTransformer,
	valibotValidator,
	yupTransformer,
	yupValidator,
	zodV3Transformer,
	zodV3Validator,
	zodV4Transformer,
	zodV4Validator,
} from './adapters/index.js'
// Factory Functions
export type { Transformer, TransformerOptions } from './createTransformer.js'
export { createTransformer } from './createTransformer.js'
export type { Validator, ValidatorOptions } from './createValidator.js'
export { createValidator } from './createValidator.js'
// Helpers
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
// Types
export type {
	InferTransformerSchema,
	InferTransformerSchemas,
	InferValidatorSchema,
	InferValidatorSchemas,
	PartialTransformerAdapter,
	PartialValidatorAdapter,
	SchemaConstraints,
	TransformerAdapter,
	ValidatorAdapter,
} from './types.js'
export { defineTransformerAdapter, defineValidatorAdapter } from './types.js'
