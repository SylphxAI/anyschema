/**
 * Blind-Call Utilities
 *
 * Try native methods first, zero dependencies.
 * Most efficient: if schema knows how to do X, let it do X.
 */

import type { JSONSchema, ValidationResult } from './types.js'

// ============================================================================
// Type Helpers
// ============================================================================

// biome-ignore lint/suspicious/noExplicitAny: duck typing requires any
type AnyFn = (...args: any[]) => unknown

interface WithSafeParse {
	safeParse: (data: unknown) => {
		success: boolean
		data?: unknown
		error?: { issues?: Array<{ message: string; path?: (string | number)[] }> }
	}
}

interface WithValibotRun {
	'~run': (
		dataset: { typed: boolean; value: unknown },
		config: unknown
	) => {
		typed: boolean
		value: unknown
		issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>
	}
}

interface WithValidateSync {
	validateSync: (data: unknown) => unknown
}

interface WithValidate {
	validate: (data: unknown) => {
		error?: { details?: Array<{ message: string; path?: (string | number)[] }> }
		value?: unknown
	}
}

interface WithDecode {
	decode: (data: unknown) => { _tag: string; left?: unknown; right?: unknown }
}

interface WithSafeParseAsync {
	safeParseAsync: (data: unknown) => Promise<{
		success: boolean
		data?: unknown
		error?: { issues?: Array<{ message: string; path?: (string | number)[] }> }
	}>
}

interface WithToJsonSchema {
	toJsonSchema: () => JSONSchema
}

interface WithAnySchemaToJsonSchema {
	'~toJsonSchema': () => JSONSchema
}

function hasMethod<T>(obj: unknown, method: keyof T): obj is T {
	return obj != null && typeof (obj as Record<string, unknown>)[method as string] === 'function'
}

function isCallable(obj: unknown): obj is AnyFn {
	return typeof obj === 'function'
}

// ============================================================================
// Validation - Blind Call
// ============================================================================

/**
 * Try native validation methods in order of commonality
 *
 * Methods tried:
 * 1. safeParse(data) - Zod, Effect
 * 2. validate(data) - Joi, Yup (sync)
 * 3. validateSync(data) - Yup
 * 4. ~run({typed,value}, config) - Valibot
 * 5. parse(data) - Zod (throws)
 * 6. decode(data) - io-ts
 * 7. callable(data) - ArkType
 */
export function tryValidate(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	// 1. safeParse - Zod style (most common, returns result object)
	if (hasMethod<WithSafeParse>(schema, 'safeParse')) {
		const result = schema.safeParse(data)
		if (result.success) {
			return { success: true, data: result.data }
		}
		return {
			success: false,
			issues: result.error?.issues?.map((i) => ({
				message: i.message,
				...(i.path ? { path: i.path } : {}),
			})) ?? [{ message: 'Validation failed' }],
		}
	}

	// 2. Valibot ~run
	if (hasMethod<WithValibotRun>(schema, '~run')) {
		const result = schema['~run']({ typed: false, value: data }, {})
		if (!result.issues || result.issues.length === 0) {
			return { success: true, data: result.value }
		}
		return {
			success: false,
			issues: result.issues.map((i) => ({
				message: i.message,
				...(i.path ? { path: i.path.map((p) => p.key) } : {}),
			})),
		}
	}

	// 3. validateSync - Yup (throws on error)
	if (hasMethod<WithValidateSync>(schema, 'validateSync')) {
		try {
			const result = schema.validateSync(data)
			return { success: true, data: result }
		} catch (error) {
			const yupError = error as { errors?: string[]; path?: string }
			return {
				success: false,
				issues: (yupError.errors ?? ['Validation failed']).map((msg) => ({
					message: msg,
					...(yupError.path ? { path: [yupError.path] } : {}),
				})),
			}
		}
	}

	// 4. validate - Joi style (returns { error?, value })
	// Skip if has safeParse (Zod also has validate but different signature)
	if (
		hasMethod<WithValidate>(schema, 'validate') &&
		!hasMethod<WithSafeParse>(schema, 'safeParse')
	) {
		const result = schema.validate(data)
		if (!result.error) {
			return { success: true, data: result.value }
		}
		return {
			success: false,
			issues: result.error.details?.map((d) => ({
				message: d.message,
				...(d.path ? { path: d.path } : {}),
			})) ?? [{ message: 'Validation failed' }],
		}
	}

	// 5. decode - io-ts (returns Either)
	if (hasMethod<WithDecode>(schema, 'decode')) {
		const result = schema.decode(data)
		if (result._tag === 'Right') {
			return { success: true, data: result.right }
		}
		const errors = result.left as
			| Array<{ message?: string; context?: Array<{ key: string }> }>
			| undefined
		return {
			success: false,
			issues: (errors ?? []).map((e) => ({
				message: e.message ?? 'Validation failed',
				...(e.context?.length ? { path: e.context.map((c) => c.key) } : {}),
			})),
		}
	}

	// 6. Callable - ArkType (function that validates)
	// Skip if has safeParse (Zod schemas are also callable)
	if (isCallable(schema) && !hasMethod<WithSafeParse>(schema, 'safeParse')) {
		try {
			const result = schema(data)
			// ArkType returns ArkErrors on failure (iterable with summary)
			if (
				result !== null &&
				typeof result === 'object' &&
				Symbol.iterator in result &&
				'summary' in result
			) {
				return {
					success: false,
					issues: [...(result as Iterable<{ message: string; path?: unknown }>)].map((e) => ({
						message: e.message,
						...(e.path ? { path: e.path as (string | number)[] } : {}),
					})),
				}
			}
			return { success: true, data: result }
		} catch (error) {
			return { success: false, issues: [{ message: String(error) }] }
		}
	}

	// No native method found
	return null
}

/**
 * Try native async validation methods
 */
export async function tryValidateAsync(
	schema: unknown,
	data: unknown
): Promise<ValidationResult<unknown> | null> {
	// 1. safeParseAsync - Zod
	if (hasMethod<WithSafeParseAsync>(schema, 'safeParseAsync')) {
		const result = await schema.safeParseAsync(data)
		if (result.success) {
			return { success: true, data: result.data }
		}
		return {
			success: false,
			issues: result.error?.issues?.map((i) => ({
				message: i.message,
				...(i.path ? { path: i.path } : {}),
			})) ?? [{ message: 'Validation failed' }],
		}
	}

	// 2. Valibot ~run (may return promise)
	if (hasMethod<WithValibotRun>(schema, '~run')) {
		const result = await schema['~run']({ typed: false, value: data }, {})
		if (!result.issues || result.issues.length === 0) {
			return { success: true, data: result.value }
		}
		return {
			success: false,
			issues: result.issues.map((i) => ({
				message: i.message,
				...(i.path ? { path: i.path.map((p) => p.key) } : {}),
			})),
		}
	}

	// Fallback to sync
	return tryValidate(schema, data)
}

// ============================================================================
// JSON Schema - Blind Call
// ============================================================================

/**
 * Try native JSON Schema methods
 *
 * Methods tried:
 * 1. ~toJsonSchema() - AnySchema Protocol
 * 2. toJsonSchema() - ArkType
 * 3. TypeBox - schema IS JSON Schema
 */
export function tryToJsonSchema(schema: unknown): JSONSchema | null {
	// 1. AnySchema Protocol
	if (hasMethod<WithAnySchemaToJsonSchema>(schema, '~toJsonSchema')) {
		return schema['~toJsonSchema']()
	}

	// 2. ArkType native
	if (hasMethod<WithToJsonSchema>(schema, 'toJsonSchema')) {
		return schema.toJsonSchema()
	}

	// 3. TypeBox - schema IS JSON Schema (has type or $ref without being Zod/Valibot)
	if (typeof schema === 'object' && schema !== null) {
		const s = schema as {
			type?: unknown
			$ref?: unknown
			anyOf?: unknown
			allOf?: unknown
			oneOf?: unknown
			_def?: unknown
			_zod?: unknown
			kind?: unknown
		}
		// Must look like JSON Schema and NOT be a validation library schema
		const looksLikeJsonSchema =
			typeof s.type === 'string' ||
			s.$ref !== undefined ||
			s.anyOf !== undefined ||
			s.allOf !== undefined ||
			s.oneOf !== undefined
		const isValidationLibrary = s._def !== undefined || s._zod !== undefined || s.kind === 'schema'

		if (looksLikeJsonSchema && !isValidationLibrary) {
			return schema as JSONSchema
		}
	}

	return null
}
