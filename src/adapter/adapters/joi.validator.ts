/**
 * Joi Validator Adapter
 *
 * Minimal adapter for validation only. ~50 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Joi schema shape for type inference */
export interface JoiSchema {
	$_root: unknown
	type: string
	validate: (data: unknown, options?: { convert?: boolean }) => { value: unknown; error?: Error }
	validateAsync?: (data: unknown, options?: { convert?: boolean }) => Promise<unknown>
}

// Type guard
const isJoiSchema = (s: unknown): s is JoiSchema => {
	if (!s || typeof s !== 'object') return false
	return '$_root' in s && 'type' in s && 'validate' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const joiValidator = defineValidatorAdapter<JoiSchema>({
	vendor: 'joi',
	match: isJoiSchema,
	validate: (s, data) => {
		// Use convert: false to prevent coercion ('true' should not become boolean true)
		const result = s.validate(data, { convert: false })
		if (result.error) {
			const joiError = result.error as unknown as {
				details?: Array<{ message: string; path: (string | number)[] }>
			}
			return {
				success: false as const,
				issues: joiError.details?.map((d) => ({
					message: d.message,
					path: d.path,
				})) ?? [{ message: 'Validation failed' }],
			}
		}
		return { success: true as const, data: result.value }
	},

	validateAsync: async (s, data) => {
		if (typeof s.validateAsync !== 'function') {
			// Fall back to sync
			const result = s.validate(data, { convert: false })
			if (result.error) {
				const joiError = result.error as unknown as {
					details?: Array<{ message: string; path: (string | number)[] }>
				}
				return {
					success: false as const,
					issues: joiError.details?.map((d) => ({
						message: d.message,
						path: d.path,
					})) ?? [{ message: 'Validation failed' }],
				}
			}
			return { success: true as const, data: result.value }
		}

		try {
			const result = await s.validateAsync(data, { convert: false })
			return { success: true, data: result }
		} catch (error) {
			const joiError = error as { details?: Array<{ message: string; path: (string | number)[] }> }
			return {
				success: false,
				issues: joiError.details?.map((d) => ({
					message: d.message,
					path: d.path,
				})) ?? [{ message: 'Validation failed' }],
			}
		}
	},
})
