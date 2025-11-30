/**
 * AnySchema - Universal schema utilities
 *
 * Zero dependencies. Pure duck typing. Works with any version of any schema library.
 *
 * ## Plugin-Based Usage (Recommended)
 *
 * @example
 * ```typescript
 * import {
 *   createValidator,
 *   createTransformer,
 *   zodV4Validator,
 *   zodV4Transformer,
 *   valibotValidator,
 *   valibotTransformer,
 * } from 'anyschema';
 *
 * // Create validator with specific adapters
 * const { validate, parse, is, assert } = createValidator({
 *   adapters: [zodV4Validator, valibotValidator]
 * });
 *
 * // Create transformer with specific adapters
 * const { toJsonSchema } = createTransformer({
 *   adapters: [zodV4Transformer, valibotTransformer]
 * });
 *
 * // Works with Zod and Valibot schemas
 * validate(zodSchema, data);      // OK
 * toJsonSchema(valibotSchema);    // OK
 * ```
 */

// Adapter system
export type {
	ArkTypeSchema,
	EffectSchema,
	InferTransformerSchema,
	InferTransformerSchemas,
	InferValidatorSchema,
	InferValidatorSchemas,
	IoTsSchema,
	JoiSchema,
	PartialTransformerAdapter,
	PartialValidatorAdapter,
	RuntypesSchema,
	SchemaConstraints,
	SuperstructSchema,
	Transformer,
	TransformerAdapter,
	TransformerOptions,
	TypeBoxSchema,
	ValibotSchema,
	Validator,
	ValidatorAdapter,
	ValidatorOptions,
	YupSchema,
	ZodV3Schema,
	ZodV4Schema,
} from './adapter/index.js'

export {
	arktypeTransformer,
	arktypeValidator,
	createTransformer,
	createValidator,
	defineTransformerAdapter,
	defineValidatorAdapter,
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
} from './adapter/index.js'

// Detection utilities
export {
	detect,
	detectVendor,
	hasMetadata,
	isAnySchemaProtocol,
	isArkTypeSchema,
	isEffectSchema,
	isIoTsSchema,
	isJoiSchema,
	isRuntypesSchema,
	isStandardSchema,
	isSuperstructSchema,
	isTypeBoxSchema,
	isValibotSchema,
	isYupSchema,
	isZodSchema,
	supportsAsync,
	supportsJsonSchema,
} from './detection.js'

// Types
export type {
	AnySchema,
	AnySchemaV1,
	ArkTypeLike,
	AssertValidSchema,
	AsyncCapable,
	DetectionResult,
	EffectSchemaLike,
	InferCapable,
	InferInput,
	InferOutput,
	IoTsLike,
	IsValidSchema,
	JoiLike,
	JSONSchema,
	JsonSchemaCapable,
	JsonSchemaSyncCapable,
	MetadataCapable,
	RuntypesLike,
	SchemaMetadata,
	SchemaVendor,
	StandardSchemaV1,
	SuperstructLike,
	TypeBoxLike,
	ValibotLike,
	ValidationFailure,
	ValidationIssue,
	ValidationResult,
	ValidationSuccess,
	YupLike,
	ZodLike,
} from './types.js'

export { ValidationError } from './types.js'
