/**
 * TypeBox Validator Adapter
 *
 * Minimal adapter for validation only.
 * Uses dynamic import to avoid bundling @sinclair/typebox/value.
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

// Lazy-loaded Value module
let Value: {
	Check: (schema: unknown, value: unknown) => boolean
	Errors: (schema: unknown, value: unknown) => Iterable<{ message: string; path: string }>
} | null = null

const loadValue = async () => {
	if (!Value) {
		try {
			const mod = await import('@sinclair/typebox/value')
			Value = mod.Value
		} catch {
			return null
		}
	}
	return Value
}

// Sync validation using Check
const validateSync = (schema: TypeBoxSchema, data: unknown) => {
	// Try to use globally available Value if loaded
	if (Value) {
		try {
			if (Value.Check(schema, data)) {
				return { success: true as const, data }
			}
			const errors = [...Value.Errors(schema, data)]
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
			// Fall through
		}
	}

	// Try dynamic require for sync validation
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { Value: V } = require('@sinclair/typebox/value')
		Value = V
		if (V.Check(schema, data)) {
			return { success: true as const, data }
		}
		const errors = [...V.Errors(schema, data)]
		return {
			success: false as const,
			issues: errors.map((e: { message: string; path?: string }) => {
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
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const typeboxValidator = defineValidatorAdapter<TypeBoxSchema>({
	vendor: 'typebox',
	match: isTypeBoxSchema,
	validate: (s, data) => validateSync(s, data),
	validateAsync: async (s, data) => {
		await loadValue()
		return validateSync(s, data)
	},
})
