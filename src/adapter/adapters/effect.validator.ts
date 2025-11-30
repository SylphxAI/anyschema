/**
 * Effect Schema Validator Adapter
 *
 * Minimal adapter for validation only. ~30 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 * Effect implements Standard Schema, so validation should go through ~standard.
 */

import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Effect schema shape for type inference */
export interface EffectSchema {
	Type: unknown
	Encoded: unknown
	ast: { _tag?: string }
}

// Type guard
const isEffectSchema = (s: unknown): s is EffectSchema => {
	if (!s || typeof s !== 'object') return false
	return 'Type' in s && 'Encoded' in s && 'ast' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const effectValidator = defineValidatorAdapter<EffectSchema>({
	vendor: 'effect',
	match: isEffectSchema,
	// Effect implements Standard Schema, should use ~standard.validate
	validate: (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'Effect Schema should be validated via Standard Schema protocol (~standard.validate).',
			},
		],
	}),

	validateAsync: async (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'Effect Schema should be validated via Standard Schema protocol (~standard.validate).',
			},
		],
	}),
})
