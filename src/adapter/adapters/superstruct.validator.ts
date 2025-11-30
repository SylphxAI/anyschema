/**
 * Superstruct Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withStructValidate } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Superstruct schema shape for type inference */
export interface SuperstructSchema {
	refiner: unknown
	validator: unknown
	coercer: unknown
}

// Type guard
const isSuperstructSchema = (s: unknown): s is SuperstructSchema => {
	if (!s || typeof s !== 'object') return false
	return 'refiner' in s && 'validator' in s && 'coercer' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const superstructValidator = defineValidatorAdapter<SuperstructSchema>({
	vendor: 'superstruct',
	match: isSuperstructSchema,
	validate: (s, data) =>
		withStructValidate(s, data) ?? {
			success: false,
			issues: [{ message: 'Invalid Superstruct schema' }],
		},

	validateAsync: async (s, data) => {
		// Superstruct is sync only
		return (
			withStructValidate(s, data) ?? {
				success: false,
				issues: [{ message: 'Invalid Superstruct schema' }],
			}
		)
	},
})
