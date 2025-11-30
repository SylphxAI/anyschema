import type { DetectionResult, SchemaVendor } from './types.js'

// ============================================================================
// Core Detection
// ============================================================================

/**
 * Detect schema vendor using duck typing
 *
 * Detection order:
 * 1. AnySchema Protocol (`~anyschema`) - highest priority
 * 2. Standard Schema (`~standard`) - community standard
 * 3. Duck typing for specific libraries
 *
 * Zero runtime imports - only checks object shape
 */
export function detectVendor(schema: unknown): SchemaVendor | null {
	const result = detect(schema)
	return (result?.vendor as SchemaVendor) ?? null
}

/**
 * Detailed detection with type and vendor info
 */
export function detect(schema: unknown): DetectionResult | null {
	if (schema == null) return null

	// 1. AnySchema Protocol (highest priority)
	if (isAnySchemaProtocol(schema)) {
		const vendor = (schema as { '~anyschema': { vendor: string } })['~anyschema'].vendor
		return { type: 'anyschema', vendor: vendor as SchemaVendor }
	}

	// 2. Standard Schema
	if (isStandardSchema(schema)) {
		const vendor = (schema as { '~standard': { vendor: string } })['~standard'].vendor
		return { type: 'standard-schema', vendor: vendor as SchemaVendor }
	}

	// 3. Duck typing for specific libraries
	if (typeof schema === 'function') {
		// ArkType: callable with toJsonSchema method
		if (
			'toJsonSchema' in schema &&
			typeof (schema as { toJsonSchema?: unknown }).toJsonSchema === 'function'
		) {
			return { type: 'duck', vendor: 'arktype' }
		}
		return null
	}

	if (typeof schema !== 'object') return null

	// Zod v4: has _zod property
	if ('_zod' in schema) {
		return { type: 'duck', vendor: 'zod' }
	}

	// Zod v3: has _def property and parse/safeParse methods
	if (
		'_def' in schema &&
		'parse' in schema &&
		typeof (schema as { parse?: unknown }).parse === 'function'
	) {
		return { type: 'duck', vendor: 'zod' }
	}

	// Valibot: has kind property and async property
	if ('kind' in schema && 'async' in schema) {
		return { type: 'duck', vendor: 'valibot' }
	}

	// Yup: has __isYupSchema__ marker
	if (
		'__isYupSchema__' in schema &&
		(schema as { __isYupSchema__?: unknown }).__isYupSchema__ === true
	) {
		return { type: 'duck', vendor: 'yup' }
	}

	// Joi: has $_root and type properties
	if ('$_root' in schema && 'type' in schema && 'validate' in schema) {
		return { type: 'duck', vendor: 'joi' }
	}

	// io-ts: has _tag, decode, and encode
	if ('_tag' in schema && 'decode' in schema && 'encode' in schema) {
		return { type: 'duck', vendor: 'io-ts' }
	}

	// Superstruct: has refiner, validator, coercer methods
	if ('refiner' in schema && 'validator' in schema && 'coercer' in schema) {
		return { type: 'duck', vendor: 'superstruct' }
	}

	// TypeBox: has Symbol.for('TypeBox.Kind') or common TypeBox shape
	const typeBoxKind = Symbol.for('TypeBox.Kind')
	if (typeBoxKind in schema || ('static' in schema && 'params' in schema)) {
		return { type: 'duck', vendor: 'typebox' }
	}

	// Effect Schema: has Type, Encoded, ast, annotations
	if ('Type' in schema && 'Encoded' in schema && 'ast' in schema) {
		return { type: 'duck', vendor: 'effect' }
	}

	// Runtypes: has reflect property and check/guard methods
	if ('reflect' in schema && 'check' in schema && 'guard' in schema) {
		return { type: 'duck', vendor: 'runtypes' }
	}

	return null
}

// ============================================================================
// Protocol Detection
// ============================================================================

/**
 * Check if schema implements AnySchema Protocol
 */
export function isAnySchemaProtocol(schema: unknown): boolean {
	if (schema == null || typeof schema !== 'object') return false
	if (!('~anyschema' in schema)) return false

	const marker = (schema as Record<string, unknown>)['~anyschema']
	return typeof marker === 'object' && marker !== null && 'version' in marker && 'vendor' in marker
}

/**
 * Check if schema implements Standard Schema
 */
export function isStandardSchema(schema: unknown): boolean {
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

// ============================================================================
// Library-Specific Type Guards
// ============================================================================

/**
 * Check if schema is a Zod schema
 */
export function isZodSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'zod'
}

/**
 * Check if schema is a Valibot schema
 */
export function isValibotSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'valibot'
}

/**
 * Check if schema is an ArkType schema
 */
export function isArkTypeSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'arktype'
}

/**
 * Check if schema is a Yup schema
 */
export function isYupSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'yup'
}

/**
 * Check if schema is a Joi schema
 */
export function isJoiSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'joi'
}

/**
 * Check if schema is an io-ts schema
 */
export function isIoTsSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'io-ts'
}

/**
 * Check if schema is a Superstruct schema
 */
export function isSuperstructSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'superstruct'
}

/**
 * Check if schema is a TypeBox schema
 */
export function isTypeBoxSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'typebox'
}

/**
 * Check if schema is an Effect Schema
 */
export function isEffectSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'effect'
}

/**
 * Check if schema is a Runtypes schema
 */
export function isRuntypesSchema(schema: unknown): boolean {
	const result = detect(schema)
	return result?.vendor === 'runtypes'
}

// ============================================================================
// Capability Detection
// ============================================================================

/**
 * Check if schema supports JSON Schema conversion
 */
export function supportsJsonSchema(schema: unknown): boolean {
	// AnySchema Protocol with toJsonSchema
	if (
		typeof schema === 'object' &&
		schema !== null &&
		'~toJsonSchema' in schema &&
		typeof (schema as Record<string, unknown>)['~toJsonSchema'] === 'function'
	) {
		return true
	}

	const result = detect(schema)
	if (!result) return false

	// Libraries with JSON Schema support
	return ['zod', 'valibot', 'arktype', 'typebox', 'effect'].includes(result.vendor)
}

/**
 * Check if schema supports async validation
 */
export function supportsAsync(schema: unknown): boolean {
	// AnySchema Protocol with validateAsync
	if (
		typeof schema === 'object' &&
		schema !== null &&
		'~validateAsync' in schema &&
		typeof (schema as Record<string, unknown>)['~validateAsync'] === 'function'
	) {
		return true
	}

	const result = detect(schema)
	if (!result) return false

	// All libraries support async in some form
	return true
}

/**
 * Check if schema has metadata
 */
export function hasMetadata(schema: unknown): boolean {
	// AnySchema Protocol with meta
	if (typeof schema === 'object' && schema !== null && '~meta' in schema) {
		return true
	}

	const result = detect(schema)
	if (!result) return false

	// Libraries with metadata support
	return ['zod', 'yup', 'typebox', 'effect'].includes(result.vendor)
}
