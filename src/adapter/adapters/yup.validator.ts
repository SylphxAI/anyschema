/**
 * Yup Validator Adapter
 *
 * Minimal adapter for validation only. ~50 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withValidateSync } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Yup schema shape for type inference */
export interface YupSchema {
	__isYupSchema__: true
	validate?: (data: unknown) => Promise<unknown>
	validateSync?: (data: unknown) => unknown
}

// Type guard
const isYupSchema = (s: unknown): s is YupSchema => {
	return s != null && typeof s === 'object' && '__isYupSchema__' in s && s.__isYupSchema__ === true
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const yupValidator = defineValidatorAdapter<YupSchema>({
	vendor: 'yup',
	match: isYupSchema,
	validate: (s, data) =>
		withValidateSync(s, data) ?? { success: false, issues: [{ message: 'Invalid Yup schema' }] },

	validateAsync: async (s, data) => {
		// Yup has validate() for async
		if (typeof s.validate !== 'function') {
			return { success: false, issues: [{ message: 'Invalid Yup schema' }] }
		}

		try {
			const result = await s.validate(data)
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
	},
})
