/**
 * TypeBox Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 * TypeBox requires Value.Check() for validation.
 */

import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

const TypeBoxKind = Symbol.for('TypeBox.Kind')

/** TypeBox schema shape for type inference */
export interface TypeBoxSchema {
	[TypeBoxKind]?: string
	kind?: string
	type?: string
	static?: unknown
	params?: unknown
}

// Type guard
const isTypeBoxSchema = (s: unknown): s is TypeBoxSchema => {
	if (!s || typeof s !== 'object') return false
	// TypeBox schemas have the TypeBox.Kind symbol
	if (TypeBoxKind in s) return true
	// Or have static + params (older versions)
	return 'static' in s && 'params' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const typeboxValidator = defineValidatorAdapter<TypeBoxSchema>({
	vendor: 'typebox',
	match: isTypeBoxSchema,
	// TypeBox schemas don't have validation methods - need @sinclair/typebox/value
	// Users should use Standard Schema protocol or import Value directly
	validate: (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'TypeBox requires Value.Check() for validation. Use Standard Schema protocol or @sinclair/typebox/value directly.',
			},
		],
	}),

	validateAsync: async (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'TypeBox requires Value.Check() for validation. Use Standard Schema protocol or @sinclair/typebox/value directly.',
			},
		],
	}),
})
