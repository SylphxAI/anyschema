/**
 * Joi Validator Adapter
 *
 * Minimal adapter for validation only. ~50 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withJoiValidate } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Joi schema shape for type inference */
export interface JoiSchema {
	$_root: unknown
	type: string
	validate: (data: unknown) => unknown
	validateAsync?: (data: unknown) => Promise<unknown>
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
	validate: (s, data) =>
		withJoiValidate(s, data) ?? { success: false, issues: [{ message: 'Invalid Joi schema' }] },

	validateAsync: async (s, data) => {
		if (typeof s.validateAsync !== 'function') {
			// Fall back to sync
			return (
				withJoiValidate(s, data) ?? { success: false, issues: [{ message: 'Invalid Joi schema' }] }
			)
		}

		try {
			const result = await s.validateAsync(data)
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
