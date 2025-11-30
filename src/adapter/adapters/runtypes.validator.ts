/**
 * Runtypes Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withCheck } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Runtypes schema shape for type inference */
export interface RuntypesSchema {
	tag?: string
	check: (x: unknown) => unknown
	guard: (x: unknown) => boolean
}

// Type guard - Runtypes has check and guard methods
const isRuntypesSchema = (s: unknown): s is RuntypesSchema => {
	if (!s || typeof s !== 'object') return false
	return 'check' in s && 'guard' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const runtypesValidator = defineValidatorAdapter<RuntypesSchema>({
	vendor: 'runtypes',
	match: isRuntypesSchema,
	validate: (s, data) =>
		withCheck(s, data) ?? { success: false, issues: [{ message: 'Invalid Runtypes schema' }] },

	validateAsync: async (s, data) => {
		// Runtypes is sync only
		return (
			withCheck(s, data) ?? { success: false, issues: [{ message: 'Invalid Runtypes schema' }] }
		)
	},
})
