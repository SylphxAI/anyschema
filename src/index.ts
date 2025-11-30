/**
 * AnySchema - Universal schema utilities
 *
 * Zero dependencies. Pure duck typing. Works with any version of any schema library.
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
	// Protocol types
	AnySchemaV1,
	ArkTypeLike,
	AssertValidSchema,
	AsyncCapable,
	DetectionResult,
	EffectSchemaLike,
	InferCapable,
	InferInput,
	// Type inference
	InferOutput,
	IoTsLike,
	IsValidSchema,
	JoiLike,
	// JSON Schema
	JSONSchema,
	// Capability types
	JsonSchemaCapable,
	JsonSchemaSyncCapable,
	MetadataCapable,
	RuntypesLike,
	// Metadata
	SchemaMetadata,
	// Vendor
	SchemaVendor,
	StandardSchemaV1,
	SuperstructLike,
	TypeBoxLike,
	ValibotLike,
	ValidationFailure,
	ValidationIssue,
	// Validation
	ValidationResult,
	ValidationSuccess,
	YupLike,
	// Schema structure types
	ZodLike,
} from './types.js'
// Re-export error class
export { ValidationError } from './types.js'

import { detect, isAnySchemaProtocol, isStandardSchema } from './detection.js'
// Import for internal use
import type {
	AnySchemaV1,
	InferCapable,
	InferOutput,
	JSONSchema,
	JsonSchemaCapable,
	JsonSchemaSyncCapable,
	MetadataCapable,
	SchemaMetadata,
	SchemaVendor,
	ValidationResult,
} from './types.js'
import { ValidationError } from './types.js'

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate data against any supported schema
 *
 * Uses duck typing to detect schema type and call appropriate validation method.
 * Returns a unified result object with success/failure status.
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

	// 3. Duck typing
	const detection = detect(schema)
	if (!detection) {
		return {
			success: false,
			issues: [{ message: 'Unsupported schema type' }],
		}
	}

	return validateByVendor(detection.vendor as SchemaVendor, schema, data)
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

	// 3. Duck typing
	const detection = detect(schema)
	if (!detection) {
		return {
			success: false,
			issues: [{ message: 'Unsupported schema type' }],
		}
	}

	// For Valibot async schemas, use safeParseAsync
	if (detection.vendor === 'valibot' && isAsyncSchema(schema)) {
		return validateValibotAsync(schema, data)
	}

	return validateByVendor(detection.vendor as SchemaVendor, schema, data)
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
 * Automatically detects schema type and uses appropriate converter.
 * Uses dynamic import to load converters from user's installed packages.
 *
 * **Fully supported (no extra deps):**
 * - Zod v4: Built-in toJSONSchema()
 * - ArkType: Built-in toJsonSchema() method
 * - TypeBox: Schema IS JSON Schema
 *
 * **Requires extra package:**
 * - Zod v3: Requires `zod-to-json-schema`
 * - Valibot: Requires `@valibot/to-json-schema`
 * - Effect: Requires `@effect/schema`
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
	// 1. AnySchema Protocol with toJsonSchema
	if (
		typeof schema === 'object' &&
		schema !== null &&
		'~toJsonSchema' in schema &&
		typeof (schema as Record<string, unknown>)['~toJsonSchema'] === 'function'
	) {
		return (schema as { '~toJsonSchema': () => JSONSchema })['~toJsonSchema']()
	}

	// 2. Duck typing
	const detection = detect(schema)
	if (!detection) {
		throw new Error('Unsupported schema type. Expected a schema with JSON Schema support.')
	}

	return toJsonSchemaByVendor(detection.vendor as SchemaVendor, schema)
}

/**
 * Sync version of toJsonSchema
 *
 * **Limitations:**
 * - Zod v4: NOT supported (requires async). Use toJsonSchema() instead.
 * - Zod v3: Requires `zod-to-json-schema` package installed.
 * - Valibot: Requires `@valibot/to-json-schema` package installed.
 *
 * **Fully supported (no extra deps):**
 * - ArkType: Built-in toJsonSchema() method
 * - TypeBox: Schema IS JSON Schema
 */
export function toJsonSchemaSync<T extends JsonSchemaSyncCapable>(schema: T): JSONSchema
export function toJsonSchemaSync(schema: unknown): JSONSchema {
	// 1. AnySchema Protocol with toJsonSchema
	if (
		typeof schema === 'object' &&
		schema !== null &&
		'~toJsonSchema' in schema &&
		typeof (schema as Record<string, unknown>)['~toJsonSchema'] === 'function'
	) {
		return (schema as { '~toJsonSchema': () => JSONSchema })['~toJsonSchema']()
	}

	// 2. Duck typing
	const detection = detect(schema)
	if (!detection) {
		throw new Error('Unsupported schema type. Expected a schema with JSON Schema support.')
	}

	return toJsonSchemaSyncByVendor(detection.vendor as SchemaVendor, schema)
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

	const detection = detect(schema)
	if (!detection) {
		return {}
	}

	return getMetadataByVendor(detection.vendor as SchemaVendor, schema)
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
 * Check if schema is async (Valibot)
 */
function isAsyncSchema(schema: unknown): boolean {
	return (
		typeof schema === 'object' &&
		schema !== null &&
		'async' in schema &&
		(schema as { async: boolean }).async === true
	)
}

/**
 * Check if object/function has a method
 */
function hasMethod(obj: unknown, method: string): boolean {
	if (obj === null || obj === undefined) return false
	if (typeof obj !== 'object' && typeof obj !== 'function') return false
	return method in obj && typeof (obj as Record<string, unknown>)[method] === 'function'
}

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

/**
 * Validate by vendor - runtime duck typing
 */
function validateByVendor(
	vendor: SchemaVendor,
	schema: unknown,
	data: unknown
): ValidationResult<unknown> {
	switch (vendor) {
		case 'zod':
			return validateZod(schema, data)
		case 'valibot':
			return validateValibot(schema, data)
		case 'arktype':
			return validateArkType(schema, data)
		case 'yup':
			return validateYup(schema, data)
		case 'joi':
			return validateJoi(schema, data)
		case 'io-ts':
			return validateIoTs(schema, data)
		case 'superstruct':
			return validateSuperstruct(schema, data)
		case 'typebox':
			return validateTypeBox(schema, data)
		case 'effect':
			return validateEffect(schema, data)
		case 'runtypes':
			return validateRuntypes(schema, data)
		default:
			return { success: false, issues: [{ message: `Unsupported vendor: ${vendor}` }] }
	}
}

/**
 * Zod validation - pure duck typing
 */
function validateZod(schema: unknown, data: unknown): ValidationResult<unknown> {
	if (!hasMethod(schema, 'safeParse')) {
		return { success: false, issues: [{ message: 'Invalid Zod schema' }] }
	}

	const result = (schema as { safeParse: (d: unknown) => unknown }).safeParse(data) as {
		success: boolean
		data?: unknown
		error?: { issues: Array<{ message: string; path: unknown[] }> }
	}

	if (result.success) {
		return { success: true, data: result.data }
	}

	return {
		success: false,
		issues: (result.error?.issues ?? []).map((issue) => ({
			message: issue.message,
			path: issue.path as (string | number)[],
		})),
	}
}

/**
 * Valibot validation - pure duck typing
 */
function validateValibot(schema: unknown, data: unknown): ValidationResult<unknown> {
	let safeParse: (s: unknown, d: unknown) => unknown
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const v = require('valibot') as { safeParse: typeof safeParse }
		safeParse = v.safeParse
	} catch {
		return { success: false, issues: [{ message: 'valibot not installed' }] }
	}

	const result = safeParse(schema, data) as {
		success: boolean
		output?: unknown
		issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>
	}

	if (result.success) {
		return { success: true, data: result.output }
	}

	return {
		success: false,
		issues: (result.issues ?? []).map((issue) => {
			const base: { message: string; path?: (string | number)[] } = {
				message: issue.message,
			}
			if (issue.path) {
				base.path = issue.path.map((p) => p.key)
			}
			return base
		}),
	}
}

/**
 * Valibot async validation
 */
async function validateValibotAsync(
	schema: unknown,
	data: unknown
): Promise<ValidationResult<unknown>> {
	let safeParseAsync: (s: unknown, d: unknown) => Promise<unknown>
	try {
		const v = (await import('valibot')) as { safeParseAsync: typeof safeParseAsync }
		safeParseAsync = v.safeParseAsync
	} catch {
		return { success: false, issues: [{ message: 'valibot not installed' }] }
	}

	const result = (await safeParseAsync(schema, data)) as {
		success: boolean
		output?: unknown
		issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>
	}

	if (result.success) {
		return { success: true, data: result.output }
	}

	return {
		success: false,
		issues: (result.issues ?? []).map((issue) => {
			const base: { message: string; path?: (string | number)[] } = {
				message: issue.message,
			}
			if (issue.path) {
				base.path = issue.path.map((p) => p.key)
			}
			return base
		}),
	}
}

/**
 * ArkType validation - pure duck typing
 */
function validateArkType(schema: unknown, data: unknown): ValidationResult<unknown> {
	if (typeof schema !== 'function') {
		return { success: false, issues: [{ message: 'Invalid ArkType schema' }] }
	}

	const result = (schema as (d: unknown) => unknown)(data)

	// ArkType returns ArkErrors on failure (iterable with summary)
	if (
		result !== null &&
		typeof result === 'object' &&
		Symbol.iterator in result &&
		'summary' in result
	) {
		return {
			success: false,
			issues: [...(result as Iterable<{ message: string; path: unknown }>)].map((error) => ({
				message: error.message,
				path: error.path as unknown as (string | number)[],
			})),
		}
	}

	return { success: true, data: result }
}

/**
 * Yup validation - pure duck typing
 */
function validateYup(schema: unknown, data: unknown): ValidationResult<unknown> {
	if (!hasMethod(schema, 'validateSync')) {
		return { success: false, issues: [{ message: 'Invalid Yup schema' }] }
	}

	try {
		const result = (schema as { validateSync: (d: unknown) => unknown }).validateSync(data)
		return { success: true, data: result }
	} catch (error) {
		const yupError = error as { errors?: string[]; path?: string }
		return {
			success: false,
			issues: (yupError.errors ?? ['Validation failed']).map((msg) => {
				const base: { message: string; path?: (string | number)[] } = { message: msg }
				if (yupError.path) {
					base.path = [yupError.path]
				}
				return base
			}),
		}
	}
}

/**
 * Joi validation - pure duck typing
 */
function validateJoi(schema: unknown, data: unknown): ValidationResult<unknown> {
	if (!hasMethod(schema, 'validate')) {
		return { success: false, issues: [{ message: 'Invalid Joi schema' }] }
	}

	const result = (
		schema as { validate: (d: unknown) => { error?: unknown; value: unknown } }
	).validate(data)

	if (result.error) {
		const joiError = result.error as {
			details?: Array<{ message: string; path: (string | number)[] }>
		}
		return {
			success: false,
			issues: (joiError.details ?? []).map((detail) => ({
				message: detail.message,
				path: detail.path,
			})),
		}
	}

	return { success: true, data: result.value }
}

/**
 * io-ts validation - pure duck typing
 */
function validateIoTs(schema: unknown, data: unknown): ValidationResult<unknown> {
	if (!hasMethod(schema, 'decode')) {
		return { success: false, issues: [{ message: 'Invalid io-ts schema' }] }
	}

	const result = (schema as { decode: (d: unknown) => unknown }).decode(data)

	// io-ts returns Either<Errors, A>
	const either = result as { _tag: string; left?: unknown; right?: unknown }

	if (either._tag === 'Right') {
		return { success: true, data: either.right }
	}

	// Handle Left (errors)
	const errors = either.left as
		| Array<{ message?: string; context?: Array<{ key: string }> }>
		| undefined
	return {
		success: false,
		issues: (errors ?? []).map((e) => {
			const base: { message: string; path?: (string | number)[] } = {
				message: e.message ?? 'Validation failed',
			}
			if (e.context && e.context.length > 0) {
				base.path = e.context.map((c) => c.key)
			}
			return base
		}),
	}
}

/**
 * Superstruct validation - pure duck typing
 */
function validateSuperstruct(schema: unknown, data: unknown): ValidationResult<unknown> {
	let validate: (d: unknown, s: unknown) => [unknown, unknown]
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const ss = require('superstruct') as { validate: typeof validate }
		validate = ss.validate
	} catch {
		return { success: false, issues: [{ message: 'superstruct not installed' }] }
	}

	const [error, value] = validate(data, schema)

	if (error) {
		const ssError = error as {
			failures?: () => Array<{ message: string; path: (string | number)[] }>
		}
		const failures = ssError.failures?.() ?? []
		return {
			success: false,
			issues: failures.map((f) => ({
				message: f.message,
				path: f.path,
			})),
		}
	}

	return { success: true, data: value }
}

/**
 * TypeBox validation - pure duck typing
 */
function validateTypeBox(schema: unknown, data: unknown): ValidationResult<unknown> {
	let Value: {
		Check: (s: unknown, d: unknown) => boolean
		Errors: (s: unknown, d: unknown) => Iterable<{ message: string; path: string }>
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const tb = require('@sinclair/typebox/value') as { Value: typeof Value }
		Value = tb.Value
	} catch {
		return { success: false, issues: [{ message: '@sinclair/typebox not installed' }] }
	}

	if (Value.Check(schema, data)) {
		return { success: true, data }
	}

	const errors = [...Value.Errors(schema, data)]
	return {
		success: false,
		issues: errors.map((e) => ({
			message: e.message,
			path: e.path.split('/').filter(Boolean) as (string | number)[],
		})),
	}
}

/**
 * Effect Schema validation - pure duck typing
 */
function validateEffect(schema: unknown, data: unknown): ValidationResult<unknown> {
	let decodeUnknownSync: (s: unknown) => (d: unknown) => unknown
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const S = require('@effect/schema/Schema') as { decodeUnknownSync: typeof decodeUnknownSync }
		decodeUnknownSync = S.decodeUnknownSync
	} catch {
		return { success: false, issues: [{ message: '@effect/schema not installed' }] }
	}

	try {
		const result = decodeUnknownSync(schema)(data)
		return { success: true, data: result }
	} catch (error) {
		const effectError = error as { message?: string; errors?: Array<{ message: string }> }
		return {
			success: false,
			issues: effectError.errors?.map((e) => ({ message: e.message })) ?? [
				{ message: effectError.message ?? 'Validation failed' },
			],
		}
	}
}

/**
 * Runtypes validation - pure duck typing
 */
function validateRuntypes(schema: unknown, data: unknown): ValidationResult<unknown> {
	if (!hasMethod(schema, 'check')) {
		return { success: false, issues: [{ message: 'Invalid Runtypes schema' }] }
	}

	try {
		const result = (schema as { check: (d: unknown) => unknown }).check(data)
		return { success: true, data: result }
	} catch (error) {
		const rtError = error as { message?: string }
		return {
			success: false,
			issues: [{ message: rtError.message ?? 'Validation failed' }],
		}
	}
}

/**
 * Convert to JSON Schema by vendor (async)
 */
async function toJsonSchemaByVendor(vendor: SchemaVendor, schema: unknown): Promise<JSONSchema> {
	switch (vendor) {
		case 'zod': {
			// Zod v4 native schemas have _zod property, use toJSONSchema from zod/v4
			if (typeof schema === 'object' && schema !== null && '_zod' in schema) {
				try {
					const { toJSONSchema } = await import('zod/v4')
					return toJSONSchema(schema as unknown as Parameters<typeof toJSONSchema>[0]) as JSONSchema
				} catch {
					throw new Error('Zod v4 schema detected but zod/v4 not available')
				}
			}
			// Zod v3 schemas have _def property, use zod-to-json-schema
			try {
				const { zodToJsonSchema } = await import('zod-to-json-schema')
				return zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0]) as JSONSchema
			} catch {
				throw new Error('zod-to-json-schema not installed. Run: npm install zod-to-json-schema')
			}
		}
		case 'valibot': {
			try {
				const { toJsonSchema } = await import('@valibot/to-json-schema')
				return toJsonSchema(schema as Parameters<typeof toJsonSchema>[0]) as JSONSchema
			} catch {
				throw new Error(
					'@valibot/to-json-schema not installed. Run: npm install @valibot/to-json-schema'
				)
			}
		}
		case 'arktype': {
			if (hasMethod(schema, 'toJsonSchema')) {
				return (schema as { toJsonSchema: () => unknown }).toJsonSchema() as JSONSchema
			}
			throw new Error('ArkType schema does not have toJsonSchema method')
		}
		case 'typebox': {
			// TypeBox schemas ARE JSON Schema
			return schema as JSONSchema
		}
		case 'effect': {
			try {
				// @ts-expect-error - dynamic import of optional dependency
				const effectSchema = (await import('@effect/schema')) as {
					JSONSchema?: { make: (s: unknown) => unknown }
				}
				if (!effectSchema.JSONSchema) {
					throw new Error('@effect/schema not installed')
				}
				return effectSchema.JSONSchema.make(schema) as unknown as JSONSchema
			} catch {
				throw new Error('@effect/schema not installed. Run: npm install @effect/schema')
			}
		}
		default:
			throw new Error(`JSON Schema conversion not supported for ${vendor}`)
	}
}

/**
 * Convert to JSON Schema by vendor (sync)
 */
function toJsonSchemaSyncByVendor(vendor: SchemaVendor, schema: unknown): JSONSchema {
	switch (vendor) {
		case 'zod': {
			// Zod v4: NOT supported in sync mode
			// toJSONSchema is a static function that requires dynamic import to avoid ESM/CJS dual package issue
			if (typeof schema === 'object' && schema !== null && '_zod' in schema) {
				throw new Error(
					'Zod v4 does not support toJsonSchemaSync(). Use async toJsonSchema() instead.'
				)
			}
			// Zod v3 schemas have _def property, use zod-to-json-schema
			try {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const { zodToJsonSchema } = require('zod-to-json-schema') as {
					zodToJsonSchema: (s: unknown) => JSONSchema
				}
				return zodToJsonSchema(schema)
			} catch {
				throw new Error('zod-to-json-schema not installed. Run: npm install zod-to-json-schema')
			}
		}
		case 'valibot': {
			try {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const { toJsonSchema } = require('@valibot/to-json-schema') as {
					toJsonSchema: (s: unknown) => JSONSchema
				}
				return toJsonSchema(schema)
			} catch {
				throw new Error(
					'@valibot/to-json-schema not installed. Run: npm install @valibot/to-json-schema'
				)
			}
		}
		case 'arktype': {
			if (hasMethod(schema, 'toJsonSchema')) {
				return (schema as { toJsonSchema: () => unknown }).toJsonSchema() as JSONSchema
			}
			throw new Error('ArkType schema does not have toJsonSchema method')
		}
		case 'typebox': {
			// TypeBox schemas ARE JSON Schema
			return schema as JSONSchema
		}
		case 'effect': {
			try {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const { JSONSchema } = require('@effect/schema') as {
					JSONSchema: { make: (s: unknown) => unknown }
				}
				return JSONSchema.make(schema) as JSONSchema
			} catch {
				throw new Error('@effect/schema not installed. Run: npm install @effect/schema')
			}
		}
		default:
			throw new Error(`JSON Schema conversion not supported for ${vendor}`)
	}
}

/**
 * Get metadata by vendor
 */
function getMetadataByVendor(vendor: SchemaVendor, schema: unknown): SchemaMetadata {
	switch (vendor) {
		case 'zod': {
			// Zod v4: use description getter
			if (typeof schema === 'object' && schema !== null && '_zod' in schema) {
				const desc = (schema as { description?: string }).description
				return desc ? { description: desc } : {}
			}
			// Zod v3: use _def.description
			const def = (schema as { _def?: { description?: string } })._def
			return def?.description ? { description: def.description } : {}
		}
		case 'yup': {
			const spec = (schema as { spec?: { meta?: SchemaMetadata } }).spec
			return spec?.meta ?? {}
		}
		case 'typebox': {
			const tb = schema as {
				title?: string
				description?: string
				default?: unknown
				examples?: unknown[]
				deprecated?: boolean
			}
			const result: {
				title?: string
				description?: string
				default?: unknown
				examples?: readonly unknown[]
				deprecated?: boolean
			} = {}
			if (tb.title !== undefined) result.title = tb.title
			if (tb.description !== undefined) result.description = tb.description
			if (tb.default !== undefined) result.default = tb.default
			if (tb.examples !== undefined) result.examples = tb.examples
			if (tb.deprecated !== undefined) result.deprecated = tb.deprecated
			return result
		}
		case 'effect': {
			const annotations = (schema as { annotations?: Record<string, unknown> }).annotations
			const result: { title?: string; description?: string } = {}
			if (annotations) {
				const title = annotations['title']
				const description = annotations['description']
				if (typeof title === 'string') result.title = title
				if (typeof description === 'string') result.description = description
			}
			return result
		}
		default:
			return {}
	}
}
