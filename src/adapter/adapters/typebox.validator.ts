/**
 * TypeBox Validator Adapter
 *
 * Minimal adapter for validation only.
 * TypeBox uses Value.Check from @sinclair/typebox/value.
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

	validate: (s, data) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { Value } = require('@sinclair/typebox/value')
			if (Value.Check(s, data)) {
				return { success: true as const, data }
			}
			const errors = [...Value.Errors(s, data)] as Array<{ message: string; path?: string }>
			return {
				success: false as const,
				issues: errors.map((e) => {
					const issue: { message: string; path?: readonly (string | number)[] } = {
						message: e.message,
					}
					if (e.path) {
						issue.path = e.path.split('/').filter(Boolean)
					}
					return issue
				}),
			}
		} catch {
			return {
				success: false as const,
				issues: [{ message: 'TypeBox validation requires @sinclair/typebox/value' }],
			}
		}
	},

	validateAsync: async (s, data) => {
		try {
			const mod = (await import('@sinclair/typebox/value')) as {
				Value: {
					Check: (schema: unknown, value: unknown) => boolean
					Errors: (schema: unknown, value: unknown) => Iterable<{ message: string; path?: string }>
				}
			}
			if (mod.Value.Check(s, data)) {
				return { success: true as const, data }
			}
			const errors = [...mod.Value.Errors(s, data)]
			return {
				success: false as const,
				issues: errors.map((e) => {
					const issue: { message: string; path?: readonly (string | number)[] } = {
						message: e.message,
					}
					if (e.path) {
						issue.path = e.path.split('/').filter(Boolean)
					}
					return issue
				}),
			}
		} catch {
			return {
				success: false as const,
				issues: [{ message: 'TypeBox validation requires @sinclair/typebox/value' }],
			}
		}
	},
})
