/**
 * Effect Schema Validator Adapter
 *
 * Minimal adapter for validation only.
 * Effect uses decodeUnknownEither for validation.
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

// Type guard - Effect schemas can be functions with ast property
const isEffectSchema = (s: unknown): s is EffectSchema => {
	if (!s) return false
	// Effect schemas can be functions or objects
	if (typeof s !== 'object' && typeof s !== 'function') return false
	return 'Type' in s && 'Encoded' in s && 'ast' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const effectValidator = defineValidatorAdapter<EffectSchema>({
	vendor: 'effect',
	match: isEffectSchema,

	validate: (s, data) => {
		try {
			// Use decodeUnknownSync from @effect/schema/Schema
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { decodeUnknownSync } = require('@effect/schema/Schema')
			const result = decodeUnknownSync(s)(data)
			return { success: true as const, data: result }
		} catch (error) {
			const effectError = error as { message?: string }
			return {
				success: false as const,
				issues: [{ message: effectError.message ?? 'Validation failed' }],
			}
		}
	},

	validateAsync: async (s, data) => {
		try {
			const mod = (await import('@effect/schema/Schema')) as unknown as {
				decodeUnknownSync: (schema: EffectSchema) => (data: unknown) => unknown
			}
			const result = mod.decodeUnknownSync(s)(data)
			return { success: true as const, data: result }
		} catch (error) {
			const effectError = error as { message?: string }
			return {
				success: false as const,
				issues: [{ message: effectError.message ?? 'Validation failed' }],
			}
		}
	},
})
