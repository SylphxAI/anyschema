/**
 * Convenience exports with all adapters pre-configured.
 * Use this for quick prototyping or when you want all adapters.
 */

import {
	arktypeTransformer,
	arktypeValidator,
	createTransformer,
	createValidator,
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
import type { JSONSchema, SchemaMetadata, ValidationResult } from './types.js'
import { ValidationError } from './types.js'

// ============================================================================
// Pre-configured Validators and Transformers
// ============================================================================

const allValidators = [
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
] as const

const allTransformers = [
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
] as const

const validator = createValidator({ adapters: allValidators })
const transformer = createTransformer({ adapters: allTransformers })

// ============================================================================
// Validation Functions
// ============================================================================

const {
	validate: validatorValidate,
	validateAsync: validatorValidateAsync,
	findAdapter,
} = validator

/**
 * Validate data against a schema
 */
export function validate(schema: unknown, data: unknown): ValidationResult<unknown> {
	// Handle null/undefined schema
	if (schema == null) {
		return {
			success: false,
			issues: [{ message: 'Unsupported schema: null or undefined' }],
		}
	}

	// Try AnySchema Protocol first (highest priority)
	if (isAnySchemaProtocolSchema(schema)) {
		const fn = (schema as { '~validate': (data: unknown) => ValidationResult<unknown> })[
			'~validate'
		]
		return fn(data)
	}

	// Try adapter-based validation (more accurate than Standard Schema)
	const adapter = findAdapter(schema as any)
	if (adapter) {
		return validatorValidate(schema as any, data)
	}

	// Fall back to Standard Schema for unknown schemas
	if (isStandardSchemaSchema(schema)) {
		const standard = (schema as { '~standard': { validate: (data: unknown) => unknown } })[
			'~standard'
		]
		const result = standard.validate(data) as { value?: unknown; issues?: unknown[] }
		if ('value' in result) {
			return { success: true, data: result.value }
		}
		return {
			success: false,
			issues: (result.issues || []).map((i: any) => ({
				message: i?.message || 'Validation failed',
				path: normalizeStandardSchemaPath(i?.path),
			})),
		}
	}

	// No handler found
	return {
		success: false,
		issues: [{ message: 'No adapter found for schema' }],
	}
}

/**
 * Async validation
 */
export async function validateAsync(
	schema: unknown,
	data: unknown
): Promise<ValidationResult<unknown>> {
	// Handle null/undefined schema
	if (schema == null) {
		return {
			success: false,
			issues: [{ message: 'Unsupported schema: null or undefined' }],
		}
	}

	// Try AnySchema Protocol first (highest priority)
	if (isAnySchemaProtocolSchema(schema)) {
		const s = schema as Record<string, unknown>
		// Prefer async validation if available
		if ('~validateAsync' in s && typeof s['~validateAsync'] === 'function') {
			return (s['~validateAsync'] as (data: unknown) => Promise<ValidationResult<unknown>>)(data)
		}
		// Fall back to sync
		const fn = (schema as { '~validate': (data: unknown) => ValidationResult<unknown> })[
			'~validate'
		]
		return fn(data)
	}

	// Try adapter-based validation (more accurate than Standard Schema)
	const adapter = findAdapter(schema as any)
	if (adapter) {
		return validatorValidateAsync(schema as any, data)
	}

	// Fall back to Standard Schema for unknown schemas (may be async)
	if (isStandardSchemaSchema(schema)) {
		const standard = (schema as { '~standard': { validate: (data: unknown) => unknown } })[
			'~standard'
		]
		const result = (await Promise.resolve(standard.validate(data))) as {
			value?: unknown
			issues?: unknown[]
		}
		if ('value' in result) {
			return { success: true, data: result.value }
		}
		return {
			success: false,
			issues: (result.issues || []).map((i: any) => ({
				message: i?.message || 'Validation failed',
				path: normalizeStandardSchemaPath(i?.path),
			})),
		}
	}

	// No handler found
	return {
		success: false,
		issues: [{ message: 'No adapter found for schema' }],
	}
}

/**
 * Type guard that narrows the type of data
 */
export function is(schema: unknown, data: unknown): boolean {
	return validate(schema, data).success
}

/**
 * Assert that data matches schema, throws if not
 */
export function assert(schema: unknown, data: unknown): void {
	const result = validate(schema, data)
	if (!result.success) {
		throw new ValidationError(result.issues)
	}
}

/**
 * Parse data, throwing on validation errors
 */
export function parse(schema: unknown, data: unknown): unknown {
	const result = validate(schema, data)
	if (!result.success) {
		throw new ValidationError(result.issues)
	}
	return result.data
}

/**
 * Async version of parse
 */
export async function parseAsync(schema: unknown, data: unknown): Promise<unknown> {
	const result = await validateAsync(schema, data)
	if (!result.success) {
		throw new ValidationError(result.issues)
	}
	return result.data
}

/**
 * Validate without type inference
 */
export function validateAny(schema: unknown, data: unknown): ValidationResult<unknown> {
	// Handle null/undefined schema
	if (schema == null) {
		return {
			success: false,
			issues: [{ message: 'Unsupported schema: null or undefined' }],
		}
	}

	// Try AnySchema Protocol first
	if (isAnySchemaProtocolSchema(schema)) {
		const fn = (schema as { '~validate': (data: unknown) => ValidationResult<unknown> })[
			'~validate'
		]
		return fn(data)
	}

	// Try Standard Schema
	if (isStandardSchemaSchema(schema)) {
		const standard = (schema as { '~standard': { validate: (data: unknown) => unknown } })[
			'~standard'
		]
		const result = standard.validate(data) as { value?: unknown; issues?: unknown[] }
		if ('value' in result) {
			return { success: true, data: result.value }
		}
		return {
			success: false,
			issues: (result.issues || []).map((i: any) => ({
				message: i?.message || 'Validation failed',
				path: normalizeStandardSchemaPath(i?.path),
			})),
		}
	}

	// Use validator
	return validator.validate(schema as any, data)
}

// ============================================================================
// Transformation Functions
// ============================================================================

export const { toJsonSchema: toJsonSchemaInternal } = transformer

/**
 * Convert schema to JSON Schema (async)
 */
export async function toJsonSchema(schema: unknown): Promise<JSONSchema> {
	// Handle AnySchema Protocol
	if (isAnySchemaProtocolSchema(schema)) {
		const s = schema as Record<string, unknown>
		if ('~toJsonSchema' in s && typeof s['~toJsonSchema'] === 'function') {
			return Promise.resolve(s['~toJsonSchema']() as JSONSchema)
		}
	}

	return toJsonSchemaInternal(schema as any)
}

/**
 * Convert schema to JSON Schema (sync)
 */
export function toJsonSchemaSync(schema: unknown): JSONSchema {
	// Handle AnySchema Protocol
	if (isAnySchemaProtocolSchema(schema)) {
		const s = schema as Record<string, unknown>
		if ('~toJsonSchema' in s && typeof s['~toJsonSchema'] === 'function') {
			return s['~toJsonSchema']() as JSONSchema
		}
	}

	return toJsonSchemaInternal(schema as any)
}

// ============================================================================
// AnySchema Protocol
// ============================================================================

interface AnySchemaOptions<TOutput, _TInput = TOutput> {
	vendor: string
	validate: (data: unknown) => ValidationResult<TOutput>
	validateAsync?: (data: unknown) => Promise<ValidationResult<TOutput>>
	toJsonSchema?: () => JSONSchema | Promise<JSONSchema>
	meta?: SchemaMetadata
}

interface AnySchemaProtocol<TOutput, TInput = TOutput> {
	'~anyschema': {
		version: 1
		vendor: string
	}
	'~types': {
		input: TInput
		output: TOutput
	}
	'~validate': (data: unknown) => ValidationResult<TOutput>
	'~validateAsync'?: (data: unknown) => Promise<ValidationResult<TOutput>>
	'~toJsonSchema'?: () => JSONSchema | Promise<JSONSchema>
	'~meta'?: SchemaMetadata
}

/**
 * Create an AnySchema Protocol schema
 */
export function createSchema<TOutput, TInput = TOutput>(
	options: AnySchemaOptions<TOutput, TInput>
): AnySchemaProtocol<TOutput, TInput> {
	return {
		'~anyschema': {
			version: 1,
			vendor: options.vendor,
		},
		'~types': {
			input: null as unknown as TInput,
			output: null as unknown as TOutput,
		},
		'~validate': options.validate,
		...(options.validateAsync && { '~validateAsync': options.validateAsync }),
		...(options.toJsonSchema && { '~toJsonSchema': options.toJsonSchema }),
		...(options.meta && { '~meta': options.meta }),
	}
}

// ============================================================================
// Metadata
// ============================================================================

/**
 * Extract metadata from a schema
 */
export function getMetadata(schema: unknown): SchemaMetadata {
	if (schema == null || typeof schema !== 'object') {
		return {}
	}

	// AnySchema Protocol
	if ('~meta' in schema) {
		return (schema as { '~meta': SchemaMetadata })['~meta']
	}

	// Zod v4: description as direct property
	if ('_zod' in schema && 'description' in schema) {
		const desc = (schema as { description?: string }).description
		if (desc) {
			return { description: desc }
		}
	}

	// Zod v3: description in _def
	if ('_def' in schema) {
		const def = (schema as { _def: { description?: string } })._def
		if (def.description) {
			return { description: def.description }
		}
	}

	// Valibot: metadata in pipe
	if ('pipe' in schema && Array.isArray((schema as { pipe: unknown[] }).pipe)) {
		const pipe = (schema as { pipe: unknown[] }).pipe
		for (const item of pipe) {
			if (
				item &&
				typeof item === 'object' &&
				'type' in item &&
				(item as { type: string }).type === 'metadata'
			) {
				const metadata = item as { metadata?: SchemaMetadata }
				if (metadata.metadata) {
					return metadata.metadata
				}
			}
		}
	}

	// Yup: spec.meta or meta property
	if ('__isYupSchema__' in schema) {
		const yup = schema as { spec?: { meta?: SchemaMetadata }; meta?: SchemaMetadata }
		if (yup.spec?.meta) return yup.spec.meta
		if (yup.meta) return yup.meta
	}

	// TypeBox: Symbol.for('TypeBox.Transform') or direct properties
	const typeBoxKind = Symbol.for('TypeBox.Kind')
	if (typeBoxKind in schema) {
		const tb = schema as {
			title?: string
			description?: string
			examples?: unknown[]
			deprecated?: boolean
		}
		const meta: {
			title?: string
			description?: string
			examples?: unknown[]
			deprecated?: boolean
		} = {}
		if (tb.title) meta.title = tb.title
		if (tb.description) meta.description = tb.description
		if (tb.examples) meta.examples = tb.examples
		if (tb.deprecated) meta.deprecated = tb.deprecated
		if (Object.keys(meta).length > 0) return meta
	}

	// Effect: annotations
	if ('annotations' in schema) {
		const annotations = (schema as { annotations: Record<string, unknown> }).annotations
		const meta: {
			title?: string
			description?: string
			examples?: unknown[]
		} = {}
		// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
		if (annotations['title']) meta.title = String(annotations['title'])
		// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
		if (annotations['description']) meta.description = String(annotations['description'])
		// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
		if (annotations['examples']) meta.examples = annotations['examples'] as unknown[]
		if (Object.keys(meta).length > 0) return meta
	}

	return {}
}

// ============================================================================
// Helpers
// ============================================================================

function isAnySchemaProtocolSchema(schema: unknown): boolean {
	if (schema == null || typeof schema !== 'object') return false
	if (!('~anyschema' in schema)) return false
	const marker = (schema as Record<string, unknown>)['~anyschema']
	return (
		typeof marker === 'object' &&
		marker !== null &&
		'version' in marker &&
		'vendor' in marker &&
		'~validate' in schema
	)
}

function isStandardSchemaSchema(schema: unknown): boolean {
	if (schema == null || typeof schema !== 'object') return false
	if (!('~standard' in schema)) return false
	const standard = (schema as Record<string, unknown>)['~standard']
	return (
		typeof standard === 'object' &&
		standard !== null &&
		'version' in standard &&
		'vendor' in standard &&
		'validate' in standard
	)
}

function normalizeStandardSchemaPath(path: unknown): (string | number)[] {
	if (!Array.isArray(path)) return []
	return path.map((p) => {
		if (typeof p === 'string' || typeof p === 'number') return p
		if (typeof p === 'object' && p !== null && 'key' in p) {
			const key = (p as { key: unknown }).key
			return typeof key === 'string' || typeof key === 'number' ? key : String(key)
		}
		return String(p)
	})
}

// ============================================================================
// Re-exports from index.ts
// ============================================================================

// Adapter types for advanced usage
export type {
	InferTransformerSchema,
	InferTransformerSchemas,
	InferValidatorSchema,
	InferValidatorSchemas,
	PartialTransformerAdapter,
	PartialValidatorAdapter,
	SchemaConstraints,
	Transformer,
	TransformerAdapter,
	TransformerOptions,
	Validator,
	ValidatorAdapter,
	ValidatorOptions,
} from './adapter/index.js'
export {
	createTransformer,
	createValidator,
	defineTransformerAdapter,
	defineValidatorAdapter,
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
	StandardSchemaResult,
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
