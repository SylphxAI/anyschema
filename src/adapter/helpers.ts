/**
 * Composable Validation Helpers
 *
 * Reusable functions for common validation patterns.
 * Each helper checks if the schema supports a method, calls it, and normalizes the result.
 */

import type { ValidationResult } from '../types.js'

// ============================================================================
// Type Helpers
// ============================================================================

type AnyFn = (...args: unknown[]) => unknown

function hasMethod(obj: unknown, method: string): boolean {
	return obj != null && typeof (obj as Record<string, unknown>)[method] === 'function'
}

function isCallable(obj: unknown): obj is AnyFn {
	return typeof obj === 'function'
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Zod-style safeParse validation
 * Works with: Zod v3, Zod v4
 */
export function withSafeParse(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	if (!hasMethod(schema, 'safeParse')) return null

	const result = (schema as { safeParse: (d: unknown) => unknown }).safeParse(data) as {
		success: boolean
		data?: unknown
		error?: { issues?: Array<{ message: string; path?: (string | number)[] }> }
	}

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

/**
 * Zod-style safeParseAsync validation
 * Works with: Zod v3, Zod v4
 */
export async function withSafeParseAsync(
	schema: unknown,
	data: unknown
): Promise<ValidationResult<unknown> | null> {
	if (!hasMethod(schema, 'safeParseAsync')) return null

	const result = (await (
		schema as { safeParseAsync: (d: unknown) => Promise<unknown> }
	).safeParseAsync(data)) as {
		success: boolean
		data?: unknown
		error?: { issues?: Array<{ message: string; path?: (string | number)[] }> }
	}

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

/**
 * Valibot ~run validation
 * Works with: Valibot
 */
export function withValibotRun(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	if (!hasMethod(schema, '~run')) return null

	const result = (
		schema as {
			'~run': (
				dataset: { typed: boolean; value: unknown },
				config: unknown
			) => {
				typed: boolean
				value: unknown
				issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>
			}
		}
	)['~run']({ typed: false, value: data }, {})

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

/**
 * Valibot ~run async validation
 * Works with: Valibot (async schemas)
 */
export async function withValibotRunAsync(
	schema: unknown,
	data: unknown
): Promise<ValidationResult<unknown> | null> {
	if (!hasMethod(schema, '~run')) return null

	const result = await (
		schema as {
			'~run': (
				dataset: { typed: boolean; value: unknown },
				config: unknown
			) => Promise<{
				typed: boolean
				value: unknown
				issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>
			}>
		}
	)['~run']({ typed: false, value: data }, {})

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

/**
 * Yup validateSync validation
 * Works with: Yup
 */
export function withValidateSync(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	if (!hasMethod(schema, 'validateSync')) return null

	try {
		const result = (schema as { validateSync: (d: unknown) => unknown }).validateSync(data)
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

/**
 * Joi validate validation
 * Works with: Joi
 */
export function withJoiValidate(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	// Skip if has safeParse (Zod also has validate but different signature)
	if (hasMethod(schema, 'safeParse')) return null
	if (!hasMethod(schema, 'validate')) return null

	const result = (
		schema as {
			validate: (d: unknown) => {
				error?: { details?: Array<{ message: string; path?: (string | number)[] }> }
				value?: unknown
			}
		}
	).validate(data)

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

/**
 * io-ts decode validation
 * Works with: io-ts
 */
export function withDecode(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	if (!hasMethod(schema, 'decode')) return null

	const result = (
		schema as { decode: (d: unknown) => { _tag: string; left?: unknown; right?: unknown } }
	).decode(data)

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

/**
 * ArkType callable validation
 * Works with: ArkType (callable schemas)
 */
export function withCallable(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	// Skip if has safeParse (Zod schemas are also callable)
	if (hasMethod(schema, 'safeParse')) return null
	if (!isCallable(schema)) return null

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

/**
 * Runtypes check validation
 * Works with: Runtypes
 */
export function withCheck(schema: unknown, data: unknown): ValidationResult<unknown> | null {
	if (!hasMethod(schema, 'check')) return null

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
 * Superstruct validate validation
 * Works with: Superstruct (struct.validate method)
 */
export function withStructValidate(
	schema: unknown,
	data: unknown
): ValidationResult<unknown> | null {
	const s = schema as {
		validate?: (
			value: unknown,
			options?: unknown
		) => [{ failures: () => Array<{ message: string; path: (string | number)[] }> } | null, unknown]
	}

	if (typeof s.validate !== 'function') return null

	const [error, value] = s.validate(data)

	if (error) {
		const failures = error.failures?.() ?? []
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

// ============================================================================
// JSON Schema Helpers
// ============================================================================

/**
 * Try to call native toJsonSchema method
 * Works with: ArkType, AnySchema Protocol
 */
export function tryNativeToJsonSchema(schema: unknown): unknown | null {
	// AnySchema Protocol
	if (hasMethod(schema, '~toJsonSchema')) {
		return (schema as { '~toJsonSchema': () => unknown })['~toJsonSchema']()
	}

	// ArkType
	if (hasMethod(schema, 'toJsonSchema')) {
		return (schema as { toJsonSchema: () => unknown }).toJsonSchema()
	}

	return null
}

/**
 * Check if schema IS JSON Schema (TypeBox)
 */
export function isJsonSchema(schema: unknown): boolean {
	if (typeof schema !== 'object' || schema === null) return false

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

	// Must look like JSON Schema
	const looksLikeJsonSchema =
		typeof s.type === 'string' ||
		s.$ref !== undefined ||
		s.anyOf !== undefined ||
		s.allOf !== undefined ||
		s.oneOf !== undefined

	// Must NOT be a validation library schema
	const isValidationLibrary = s._def !== undefined || s._zod !== undefined || s.kind === 'schema'

	return looksLikeJsonSchema && !isValidationLibrary
}
