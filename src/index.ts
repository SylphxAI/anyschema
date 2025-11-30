/**
 * AnySchema - Universal schema utilities
 *
 * Zero dependencies. Pure duck typing. Works with any version of any schema library.
 *
 * ## Plugin-Based Usage (Recommended)
 *
 * Create type-safe validators/transformers with only the adapters you need:
 *
 * @example
 * ```typescript
 * import {
 *   createValidator,
 *   createTransformer,
 *   zodV4Adapter,
 *   valibotAdapter
 * } from 'anyschema';
 *
 * // Create validator with specific adapters
 * const { validate, parse, is, assert } = createValidator({
 *   adapters: [zodV4Adapter, valibotAdapter]
 * });
 *
 * // Create transformer with specific adapters
 * const { toJsonSchema } = createTransformer({
 *   adapters: [zodV4Adapter, valibotAdapter]
 * });
 *
 * // Works with Zod and Valibot schemas
 * validate(zodSchema, data);      // OK
 * toJsonSchema(valibotSchema);    // OK
 *
 * // TypeScript error - Yup not in adapters!
 * validate(yupSchema, data);      // Error: Type 'YupSchema' is not assignable
 * ```
 *
 * ## Global Usage (All Adapters)
 *
 * @example
 * ```typescript
 * import { toJsonSchema, validate, is, parse, type InferOutput } from 'anyschema';
 * import { z } from 'zod';
 *
 * const schema = z.object({ name: z.string() });
 *
 * // Type inference (compile-time)
 * type Output = InferOutput<typeof schema>; // { name: string }
 *
 * // Validation (runtime)
 * const result = validate(schema, { name: 'John' });
 * if (result.success) {
 *   console.log(result.data); // typed as { name: string }
 * }
 *
 * // Type guard
 * if (is(schema, data)) {
 *   data.name; // typed!
 * }
 *
 * // Parse (throws on error)
 * const user = parse(schema, data);
 *
 * // JSON Schema conversion
 * const jsonSchema = await toJsonSchema(schema);
 * ```
 */

// Re-export adapter types
export type {
	// Schema types
	ArkTypeSchema,
	EffectSchema,
	InferSchema,
	InferSchemas,
	IoTsSchema,
	JoiSchema,
	PartialSchemaAdapter,
	RuntypesSchema,
	SchemaAdapter,
	SchemaConstraints,
	SuperstructSchema,
	Transformer,
	TransformerOptions,
	TypeBoxSchema,
	ValibotSchema,
	Validator,
	ValidatorOptions,
	YupSchema,
	ZodV3Schema,
	ZodV4Schema,
} from './adapter/index.js'
// Re-export adapter system
export {
	// All adapters
	arktypeAdapter,
	createTransformer,
	// Factory functions
	createValidator,
	defineAdapter,
	effectAdapter,
	findAdapter,
	getAdapters,
	ioTsAdapter,
	joiAdapter,
	registerAdapter,
	runtypesAdapter,
	superstructAdapter,
	toJsonSchema as adapterToJsonSchema,
	typeboxAdapter,
	valibotAdapter,
	yupAdapter,
	zodV3Adapter,
	zodV4Adapter,
} from './adapter/index.js'
// Re-export detection utilities
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
// Re-export all types
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
// Re-export error class
export { ValidationError } from './types.js'

import { isJsonSchema, tryNativeToJsonSchema } from './adapter/helpers.js'
import { toJsonSchema as adapterToJsonSchema, findAdapter } from './adapter/index.js'
import { isAnySchemaProtocol, isStandardSchema } from './detection.js'
import type {
	AnySchemaV1,
	InferCapable,
	InferOutput,
	JSONSchema,
	JsonSchemaCapable,
	JsonSchemaSyncCapable,
	MetadataCapable,
	SchemaMetadata,
	ValidationResult,
} from './types.js'
import { ValidationError } from './types.js'

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate data against any supported schema
 *
 * Strategy:
 * 1. AnySchema Protocol (~anyschema) - direct call
 * 2. Standard Schema (~standard) - normalize result
 * 3. Adapter-based validation - find adapter, call validate
 *
 * @param schema - Any supported schema (must support type inference)
 * @param data - Data to validate
 * @returns Typed validation result
 *
 * @example
 * ```typescript
 * const result = validate(schema, data);
 * if (result.success) {
 *   console.log(result.data); // typed!
 * } else {
 *   console.log(result.issues);
 * }
 * ```
 */
export function validate<T extends InferCapable>(
	schema: T,
	data: unknown
): ValidationResult<InferOutput<T>>
export function validate(schema: unknown, data: unknown): ValidationResult<unknown> {
	// 1. AnySchema Protocol
	if (isAnySchemaProtocol(schema)) {
		return (schema as AnySchemaV1)['~validate'](data)
	}

	// 2. Standard Schema
	if (isStandardSchema(schema)) {
		const result = (schema as { '~standard': { validate: (d: unknown) => unknown } })[
			'~standard'
		].validate(data)
		return normalizeStandardSchemaResult(result)
	}

	// 3. Adapter-based validation
	const adapter = findAdapter(schema)
	if (adapter) {
		return adapter.validate(schema, data)
	}

	return {
		success: false,
		issues: [{ message: 'Unsupported schema type' }],
	}
}

/**
 * Validate without type inference (escape hatch)
 *
 * Use this for schemas that don't support type inference (e.g., Joi).
 */
export function validateAny(schema: unknown, data: unknown): ValidationResult<unknown> {
	return validate(schema as InferCapable, data)
}

/**
 * Async validation for any supported schema
 */
export async function validateAsync<T extends InferCapable>(
	schema: T,
	data: unknown
): Promise<ValidationResult<InferOutput<T>>>
export async function validateAsync(
	schema: unknown,
	data: unknown
): Promise<ValidationResult<unknown>> {
	// 1. AnySchema Protocol with async
	if (isAnySchemaProtocol(schema)) {
		const s = schema as AnySchemaV1
		if (s['~validateAsync']) {
			return s['~validateAsync'](data)
		}
		return s['~validate'](data)
	}

	// 2. Standard Schema
	if (isStandardSchema(schema)) {
		const result = await (schema as { '~standard': { validate: (d: unknown) => unknown } })[
			'~standard'
		].validate(data)
		return normalizeStandardSchemaResult(result)
	}

	// 3. Adapter-based validation (async)
	const adapter = findAdapter(schema)
	if (adapter) {
		if (adapter.validateAsync) {
			return adapter.validateAsync(schema, data)
		}
		return adapter.validate(schema, data)
	}

	return {
		success: false,
		issues: [{ message: 'Unsupported schema type' }],
	}
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard that narrows the type of data
 *
 * @param schema - Any supported schema
 * @param data - Data to check
 * @returns True if data matches schema, with type narrowing
 *
 * @example
 * ```typescript
 * if (is(userSchema, data)) {
 *   data.name; // TypeScript knows data is User
 * }
 * ```
 */
export function is<T extends InferCapable>(schema: T, data: unknown): data is InferOutput<T> {
	const result = validate(schema, data)
	return result.success
}

/**
 * Assert that data matches schema, throws if not
 *
 * @param schema - Any supported schema
 * @param data - Data to assert
 * @throws ValidationError if data doesn't match
 *
 * @example
 * ```typescript
 * assert(userSchema, data);
 * data.name; // TypeScript knows data is User
 * ```
 */
export function assert<T extends InferCapable>(
	schema: T,
	data: unknown
): asserts data is InferOutput<T> {
	const result = validate(schema, data)
	if (!result.success) {
		throw new ValidationError(result.issues)
	}
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse data, throwing on validation errors
 *
 * @param schema - Any supported schema
 * @param data - Data to parse
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const user = parse(userSchema, data);
 * } catch (error) {
 *   // ValidationError with issues
 * }
 * ```
 */
export function parse<T extends InferCapable>(schema: T, data: unknown): InferOutput<T> {
	const result = validate(schema, data)
	if (!result.success) {
		throw new ValidationError(result.issues)
	}
	return result.data as InferOutput<T>
}

/**
 * Async version of parse
 */
export async function parseAsync<T extends InferCapable>(
	schema: T,
	data: unknown
): Promise<InferOutput<T>> {
	const result = await validateAsync(schema, data)
	if (!result.success) {
		throw new ValidationError(result.issues)
	}
	return result.data as InferOutput<T>
}

// ============================================================================
// JSON Schema Conversion
// ============================================================================

/**
 * Convert any supported schema to JSON Schema (async)
 *
 * Strategy:
 * 1. Try native toJsonSchema() method (ArkType, AnySchema Protocol)
 * 2. Check if schema IS JSON Schema (TypeBox)
 * 3. Build via adapter transformer
 *
 * **Fully supported (no extra deps):**
 * - Zod v3/v4: Via adapter
 * - Valibot: Via adapter
 * - ArkType: Built-in toJsonSchema() method
 * - TypeBox: Schema IS JSON Schema
 *
 * @param schema - Any supported schema with JSON Schema capability
 * @returns Promise resolving to JSON Schema
 *
 * @example
 * ```typescript
 * const jsonSchema = await toJsonSchema(z.object({ name: z.string() }));
 * ```
 */
export async function toJsonSchema<T extends JsonSchemaCapable>(schema: T): Promise<JSONSchema>
export async function toJsonSchema(schema: unknown): Promise<JSONSchema> {
	// 1. Try native toJsonSchema method (ArkType, AnySchema Protocol)
	const native = tryNativeToJsonSchema(schema)
	if (native) return native as JSONSchema

	// 2. Check if schema IS JSON Schema (TypeBox)
	if (isJsonSchema(schema)) {
		return schema as JSONSchema
	}

	// 3. Build via adapter transformer
	return adapterToJsonSchema(schema)
}

/**
 * Sync version of toJsonSchema
 *
 * **Fully supported (no extra deps):**
 * - Zod v3/v4: Via adapter
 * - Valibot: Via adapter
 * - ArkType: Built-in toJsonSchema() method
 * - TypeBox: Schema IS JSON Schema
 */
export function toJsonSchemaSync<T extends JsonSchemaSyncCapable>(schema: T): JSONSchema
export function toJsonSchemaSync(schema: unknown): JSONSchema {
	// 1. Try native toJsonSchema method
	const native = tryNativeToJsonSchema(schema)
	if (native) return native as JSONSchema

	// 2. Check if schema IS JSON Schema (TypeBox)
	if (isJsonSchema(schema)) {
		return schema as JSONSchema
	}

	// 3. Build via adapter transformer
	return adapterToJsonSchema(schema)
}

// ============================================================================
// Metadata
// ============================================================================

/**
 * Extract metadata from a schema
 *
 * @param schema - Any supported schema with metadata capability
 * @returns Schema metadata
 *
 * @example
 * ```typescript
 * const meta = getMetadata(schema);
 * // { title?, description?, examples?, default?, deprecated? }
 * ```
 */
export function getMetadata<T extends MetadataCapable>(schema: T): SchemaMetadata {
	// 1. AnySchema Protocol
	if (typeof schema === 'object' && schema !== null && '~meta' in schema) {
		return (schema as { '~meta': SchemaMetadata })['~meta'] ?? {}
	}

	// 2. Adapter-based metadata extraction
	const adapter = findAdapter(schema)
	if (adapter) {
		const description = adapter.getDescription(schema)
		const title = adapter.getTitle(schema)
		const defaultValue = adapter.getDefault(schema)
		const examples = adapter.getExamples(schema)
		const deprecated = adapter.isDeprecated(schema)

		return {
			...(description ? { description } : {}),
			...(title ? { title } : {}),
			...(defaultValue !== undefined ? { default: defaultValue } : {}),
			...(examples ? { examples } : {}),
			...(deprecated ? { deprecated } : {}),
		}
	}

	return {}
}

// ============================================================================
// Schema Creation (Protocol)
// ============================================================================

/**
 * Options for creating an AnySchema Protocol schema
 */
export interface CreateSchemaOptions<Output, Input = Output> {
	/** Vendor name (your library name) */
	vendor: string
	/** Core validation function */
	validate: (data: unknown) => ValidationResult<Output>
	/** Optional async validation */
	validateAsync?: (data: unknown) => Promise<ValidationResult<Output>>
	/** Optional JSON Schema conversion */
	toJsonSchema?: () => JSONSchema
	/** Optional coercion function */
	coerce?: (data: unknown) => unknown
	/** Optional metadata */
	meta?: SchemaMetadata
	/** Type carriers (for inference) - not used at runtime */
	types?: { input: Input; output: Output }
}

/**
 * Create an AnySchema Protocol compliant schema
 *
 * @param options - Schema configuration
 * @returns AnySchema Protocol v1 compliant schema
 *
 * @example
 * ```typescript
 * const myStringSchema = createSchema<string>({
 *   vendor: 'my-library',
 *   validate: (data) => {
 *     if (typeof data === 'string') {
 *       return { success: true, data };
 *     }
 *     return { success: false, issues: [{ message: 'Expected string' }] };
 *   },
 *   toJsonSchema: () => ({ type: 'string' }),
 * });
 *
 * // Now works with all AnySchema functions
 * validate(myStringSchema, 'hello');  // ✓
 * toJsonSchema(myStringSchema);       // ✓
 * type Output = InferOutput<typeof myStringSchema>; // string
 * ```
 */
export function createSchema<Output, Input = Output>(
	options: CreateSchemaOptions<Output, Input>
): AnySchemaV1<Output, Input> {
	const schema: AnySchemaV1<Output, Input> = {
		'~anyschema': {
			version: 1,
			vendor: options.vendor,
		},
		'~types': {
			input: null as unknown as Input,
			output: null as unknown as Output,
		},
		'~validate': options.validate,
	}

	if (options.validateAsync) {
		;(schema as unknown as Record<string, unknown>)['~validateAsync'] = options.validateAsync
	}

	if (options.toJsonSchema) {
		;(schema as unknown as Record<string, unknown>)['~toJsonSchema'] = options.toJsonSchema
	}

	if (options.coerce) {
		;(schema as unknown as Record<string, unknown>)['~coerce'] = options.coerce
	}

	if (options.meta) {
		;(schema as unknown as Record<string, unknown>)['~meta'] = options.meta
	}

	return schema
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Normalize Standard Schema result to ValidationResult
 */
function normalizeStandardSchemaResult(result: unknown): ValidationResult<unknown> {
	const r = result as {
		value?: unknown
		issues?: readonly { message: string; path?: readonly unknown[] }[]
	}

	if (r.issues && r.issues.length > 0) {
		return {
			success: false,
			issues: r.issues.map((issue) => {
				const base: { message: string; path?: (string | number)[] } = {
					message: issue.message,
				}
				if (issue.path && issue.path.length > 0) {
					base.path = issue.path.map((p) => {
						if (typeof p === 'object' && p !== null && 'key' in p) {
							return (p as { key: PropertyKey }).key as string | number
						}
						return p as string | number
					})
				}
				return base
			}),
		}
	}

	return { success: true, data: r.value }
}
