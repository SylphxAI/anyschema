/**
 * AnySchema Type Definitions
 *
 * Zero imports. Pure structural types. Works with any version of any library.
 *
 * @packageDocumentation
 */

// ============================================================================
// AnySchema Protocol (v1)
// ============================================================================

/**
 * Schema metadata
 */
export interface SchemaMetadata {
	readonly title?: string
	readonly description?: string
	readonly examples?: readonly unknown[]
	readonly default?: unknown
	readonly deprecated?: boolean
}

/**
 * Validation issue
 */
export interface ValidationIssue {
	readonly message: string
	readonly path?: readonly (string | number)[]
	readonly code?: string
}

/**
 * Validation result - success
 */
export interface ValidationSuccess<T> {
	readonly success: true
	readonly data: T
	readonly issues?: never
}

/**
 * Validation result - failure
 */
export interface ValidationFailure {
	readonly success: false
	readonly data?: never
	readonly issues: readonly ValidationIssue[]
}

/**
 * Unified validation result
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * AnySchema Protocol v1
 *
 * Implement this interface for first-class AnySchema support.
 *
 * @example
 * ```typescript
 * const mySchema: AnySchemaV1<string> = {
 *   '~anyschema': { version: 1, vendor: 'my-lib' },
 *   '~types': { input: null as unknown as string, output: null as unknown as string },
 *   '~validate': (data) => typeof data === 'string'
 *     ? { success: true, data }
 *     : { success: false, issues: [{ message: 'Expected string' }] },
 * };
 * ```
 */
export interface AnySchemaV1<Output = unknown, Input = Output> {
	/** Protocol identity marker */
	readonly '~anyschema': {
		readonly version: 1
		readonly vendor: string
	}

	/** Type carriers (compile-time only, never accessed at runtime) */
	readonly '~types': {
		readonly input: Input
		readonly output: Output
	}

	/** Core validation - MUST be implemented */
	readonly '~validate': (data: unknown) => ValidationResult<Output>

	/** Optional: Async validation */
	readonly '~validateAsync'?: (data: unknown) => Promise<ValidationResult<Output>>

	/** Optional: JSON Schema conversion */
	readonly '~toJsonSchema'?: () => JSONSchema

	/** Optional: Coercion (convert before validate) */
	readonly '~coerce'?: (data: unknown) => unknown

	/** Optional: Metadata */
	readonly '~meta'?: SchemaMetadata
}

// ============================================================================
// Standard Schema Protocol (v1)
// ============================================================================

/**
 * Standard Schema result type
 */
export type StandardSchemaResult<T> =
	| { value: T; issues?: never }
	| { value?: never; issues: readonly StandardSchemaIssue[] }

/**
 * Standard Schema issue
 */
export interface StandardSchemaIssue {
	readonly message: string
	readonly path?: readonly (PropertyKey | { key: PropertyKey })[]
}

/**
 * Standard Schema v1 interface
 *
 * @see https://github.com/standard-schema/standard-schema
 */
export interface StandardSchemaV1<Output = unknown, Input = unknown> {
	readonly '~standard': {
		readonly version: 1
		readonly vendor: string
		readonly validate: (data: unknown) => StandardSchemaResult<Output>
		readonly types?: {
			readonly input: Input
			readonly output: Output
		}
	}
}

// ============================================================================
// Library Structural Types (Duck Typing)
// ============================================================================

/**
 * Zod-like schema structure
 *
 * Matches: Zod v3+
 */
export interface ZodLike {
	readonly _output: unknown
	readonly _input: unknown
	readonly _def: unknown
	safeParse(data: unknown): unknown
	parse(data: unknown): unknown
}

/**
 * Valibot-like schema structure
 *
 * Matches: Valibot v1+
 */
export interface ValibotLike {
	readonly types: {
		readonly input: unknown
		readonly output: unknown
	}
	readonly kind: string
	readonly async: boolean
}

/**
 * ArkType-like schema structure
 *
 * Matches: ArkType v2+
 */
export interface ArkTypeLike {
	readonly infer: unknown
	readonly inferIn: unknown
	toJsonSchema(): unknown
	(data: unknown): unknown
}

/**
 * Yup-like schema structure
 *
 * Matches: Yup v1+
 */
export interface YupLike {
	readonly __outputType: unknown
	readonly __inputType: unknown
	readonly __isYupSchema__: true
	validate(data: unknown): Promise<unknown>
	validateSync(data: unknown): unknown
	isValidSync(data: unknown): boolean
}

/**
 * Joi-like schema structure
 *
 * Matches: Joi v17+
 * Note: Joi has NO type inference support
 */
export interface JoiLike {
	readonly $_root: unknown
	readonly type: string
	validate(data: unknown): { error?: unknown; value: unknown }
}

/**
 * io-ts-like schema structure
 *
 * Matches: io-ts v2+
 */
export interface IoTsLike {
	readonly _A: unknown
	readonly _I: unknown
	readonly _O: unknown
	readonly _tag: string
	decode(data: unknown): unknown
	encode(data: unknown): unknown
	is(data: unknown): boolean
}

/**
 * Superstruct-like schema structure
 *
 * Matches: Superstruct v1+
 */
export interface SuperstructLike {
	readonly TYPE: unknown
	refiner(data: unknown, context: unknown): unknown
	validator(data: unknown, context: unknown): unknown
	coercer(data: unknown, context: unknown): unknown
}

/**
 * TypeBox-like schema structure
 *
 * Matches: TypeBox v0.28+
 * Note: TypeBox schemas ARE JSON Schema
 */
export interface TypeBoxLike {
	readonly static: unknown
	readonly params: unknown
	// TypeBox uses Symbol.for('TypeBox.Kind')
	readonly [key: symbol]: unknown
}

/**
 * Effect Schema-like structure
 *
 * Matches: Effect Schema (formerly @effect/schema)
 */
export interface EffectSchemaLike {
	readonly Type: unknown
	readonly Encoded: unknown
	readonly ast: unknown
	readonly annotations: unknown
}

/**
 * Runtypes-like schema structure
 *
 * Matches: Runtypes v6+
 */
export interface RuntypesLike {
	readonly reflect: unknown
	check(data: unknown): unknown
	guard(data: unknown): boolean
}

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Infer output type from any supported schema
 *
 * Detection order:
 * 1. AnySchema Protocol (`~types.output`)
 * 2. Standard Schema (`~standard.types.output`)
 * 3. Duck typing for known libraries
 *
 * Returns `never` if schema is not recognized.
 */
export type InferOutput<T> =
	// 1. AnySchema Protocol
	T extends { '~types': { output: infer O } }
		? O
		: // 2. Standard Schema
			T extends { '~standard': { types: { output: infer O } } }
			? O
			: // 3. Zod
				T extends { _output: infer O }
				? O
				: // 4. Valibot
					T extends { types: { output: infer O } }
					? O
					: // 5. ArkType
						T extends { infer: infer O }
						? O
						: // 6. Yup
							T extends { __outputType: infer O }
							? O
							: // 7. io-ts
								T extends { _A: infer O }
								? O
								: // 8. Superstruct
									T extends { TYPE: infer O }
									? O
									: // 9. TypeBox
										T extends { static: infer O }
										? O
										: // 10. Effect Schema
											T extends { Type: infer O }
											? O
											: // Not recognized
												never

/**
 * Infer input type from any supported schema
 *
 * For schemas with transforms, this is the type before transformation.
 */
export type InferInput<T> =
	// AnySchema Protocol
	T extends { '~types': { input: infer I } }
		? I
		: // Standard Schema
			T extends { '~standard': { types: { input: infer I } } }
			? I
			: // Zod
				T extends { _input: infer I }
				? I
				: // Valibot
					T extends { types: { input: infer I } }
					? I
					: // ArkType
						T extends { inferIn: infer I }
						? I
						: // Yup
							T extends { __inputType: infer I }
							? I
							: // io-ts
								T extends { _I: infer I }
								? I
								: // Effect Schema
									T extends { Encoded: infer I }
									? I
									: // Fallback to output type
										InferOutput<T>

/**
 * Check if a type is a valid schema (has type inference)
 */
export type IsValidSchema<T> = InferOutput<T> extends never ? false : true

/**
 * Assert that T is a valid schema, otherwise return never
 *
 * Use this in function parameters to cause compile-time errors.
 */
export type AssertValidSchema<T> = InferOutput<T> extends never ? never : T

// ============================================================================
// Capability Types
// ============================================================================

/**
 * Schemas that support JSON Schema conversion
 *
 * Used to restrict toJsonSchema() at compile time.
 */
export type JsonSchemaCapable =
	// AnySchema Protocol with toJsonSchema
	| { '~toJsonSchema': () => unknown }
	// ArkType built-in
	| { toJsonSchema: () => unknown; infer: unknown }
	// Zod v4 (built-in toJSONSchema, requires async)
	| { _zod: unknown; '~standard': unknown }
	// Zod v3 (via zod-to-json-schema)
	| { _def: unknown; _output: unknown; safeParse: unknown }
	// Valibot (via @valibot/to-json-schema)
	| { kind: string; types: { output: unknown } }
	// TypeBox (is JSON Schema)
	| { static: unknown; type?: string; properties?: unknown }
	// Effect Schema (via built-in)
	| { Type: unknown; ast: unknown }

/**
 * Schemas that support SYNC JSON Schema conversion
 *
 * Note: Zod v4 is NOT included because it requires async dynamic import.
 * Use toJsonSchema() (async) for Zod v4 schemas.
 */
export type JsonSchemaSyncCapable =
	// AnySchema Protocol with toJsonSchema
	| { '~toJsonSchema': () => unknown }
	// ArkType built-in
	| { toJsonSchema: () => unknown; infer: unknown }
	// Zod v3 only (NOT v4 - v4 has _zod property)
	| { _def: unknown; _output: unknown; safeParse: unknown; _zod?: never }
	// TypeBox (is JSON Schema)
	| { static: unknown; type?: string; properties?: unknown }
	// Valibot and Effect are also problematic for sync, but we keep them for now
	| { kind: string; types: { output: unknown } }
	| { Type: unknown; ast: unknown }

/**
 * Schemas that support type inference
 *
 * Used to restrict validate(), is(), parse() at compile time.
 */
export type InferCapable =
	// AnySchema Protocol
	| { '~types': { output: unknown } }
	// Standard Schema
	| { '~standard': { types: { output: unknown } } }
	// Zod
	| { _output: unknown; safeParse: unknown }
	// Valibot
	| { types: { output: unknown }; kind: string }
	// ArkType
	| { infer: unknown }
	// Yup
	| { __outputType: unknown; __isYupSchema__: true }
	// io-ts
	| { _A: unknown; decode: unknown }
	// Superstruct
	| { TYPE: unknown; refiner: unknown }
	// TypeBox
	| { static: unknown }
	// Effect Schema
	| { Type: unknown; ast: unknown }

/**
 * Schemas that support async validation
 */
export type AsyncCapable =
	// AnySchema Protocol
	| { '~validateAsync': (data: unknown) => Promise<unknown> }
	// Standard Schema (always async-capable)
	| { '~standard': unknown }
	// Zod
	| { parseAsync: (data: unknown) => Promise<unknown> }
	// Valibot async
	| { async: true }
	// Yup
	| { validate: (data: unknown) => Promise<unknown> }
	// io-ts
	| { decode: unknown }
	// Effect Schema
	| { ast: unknown }

/**
 * Schemas that have metadata
 */
export type MetadataCapable =
	// AnySchema Protocol
	| { '~meta': SchemaMetadata }
	// Zod
	| { _def: { description?: string } }
	// Yup
	| { spec: { meta?: unknown } }
	// TypeBox
	| { title?: string; description?: string }
	// Effect Schema
	| { annotations: unknown }

// ============================================================================
// Union Types
// ============================================================================

/**
 * Any schema that implements AnySchema Protocol
 */
export type AnySchemaProtocol = AnySchemaV1<unknown, unknown>

/**
 * Any schema that implements Standard Schema
 */
export type StandardSchema = StandardSchemaV1<unknown, unknown>

/**
 * Any known schema type (structural union)
 */
export type AnySchema =
	| AnySchemaProtocol
	| StandardSchema
	| ZodLike
	| ValibotLike
	| ArkTypeLike
	| YupLike
	| JoiLike
	| IoTsLike
	| SuperstructLike
	| TypeBoxLike
	| EffectSchemaLike
	| RuntypesLike

// ============================================================================
// Vendor Detection
// ============================================================================

/**
 * Supported schema vendors
 */
export type SchemaVendor =
	| 'anyschema'
	| 'standard-schema'
	| 'zod'
	| 'valibot'
	| 'arktype'
	| 'yup'
	| 'joi'
	| 'io-ts'
	| 'superstruct'
	| 'typebox'
	| 'effect'
	| 'runtypes'

/**
 * Detection result
 */
export interface DetectionResult {
	readonly type: 'anyschema' | 'standard-schema' | 'duck'
	readonly vendor: SchemaVendor | string
}

// ============================================================================
// JSON Schema
// ============================================================================

/**
 * JSON Schema type definition (Draft-07 compatible)
 */
export interface JSONSchema {
	$schema?: string
	$id?: string
	$ref?: string
	$defs?: Record<string, JSONSchema>
	definitions?: Record<string, JSONSchema>

	type?:
		| 'string'
		| 'number'
		| 'integer'
		| 'boolean'
		| 'object'
		| 'array'
		| 'null'
		| Array<'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'>

	// String
	minLength?: number
	maxLength?: number
	pattern?: string
	format?: string

	// Number
	minimum?: number
	maximum?: number
	exclusiveMinimum?: number | boolean
	exclusiveMaximum?: number | boolean
	multipleOf?: number

	// Object
	properties?: Record<string, JSONSchema>
	additionalProperties?: boolean | JSONSchema
	required?: string[]
	propertyNames?: JSONSchema
	minProperties?: number
	maxProperties?: number
	patternProperties?: Record<string, JSONSchema>

	// Array
	items?: JSONSchema | JSONSchema[]
	additionalItems?: boolean | JSONSchema
	minItems?: number
	maxItems?: number
	uniqueItems?: boolean
	contains?: JSONSchema

	// Composition
	allOf?: JSONSchema[]
	anyOf?: JSONSchema[]
	oneOf?: JSONSchema[]
	not?: JSONSchema

	// Conditionals
	if?: JSONSchema
	then?: JSONSchema
	else?: JSONSchema

	// Metadata
	title?: string
	description?: string
	default?: unknown
	examples?: unknown[]
	deprecated?: boolean
	readOnly?: boolean
	writeOnly?: boolean

	// Enum
	enum?: unknown[]
	const?: unknown

	// Extensible
	[key: string]: unknown
}

// ============================================================================
// Errors
// ============================================================================

/**
 * Validation error thrown by parse() and assert()
 */
export class ValidationError extends Error {
	readonly issues: readonly ValidationIssue[]

	constructor(issues: readonly ValidationIssue[]) {
		const message = issues.map((i) => i.message).join('; ')
		super(message)
		this.name = 'ValidationError'
		this.issues = issues
	}
}
