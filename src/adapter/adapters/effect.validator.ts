/**
 * Effect Schema Validator Adapter
 *
 * Minimal adapter for validation only.
 * Uses dynamic import to avoid bundling @effect/schema.
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

// Module type for Effect Schema
interface EffectSchemaModule {
	decodeUnknownSync: (schema: EffectSchema) => (data: unknown) => unknown
}

// Lazy-loaded Schema module
let SchemaModule: EffectSchemaModule | null = null

const loadSchemaModule = async (): Promise<EffectSchemaModule | null> => {
	if (!SchemaModule) {
		try {
			const mod = await import('@effect/schema/Schema')
			SchemaModule = mod as unknown as EffectSchemaModule
		} catch {
			return null
		}
	}
	return SchemaModule
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const effectValidator = defineValidatorAdapter<EffectSchema>({
	vendor: 'effect',
	match: isEffectSchema,

	validate: (s, data) => {
		// Try to use globally available module if loaded
		if (SchemaModule) {
			try {
				const result = SchemaModule.decodeUnknownSync(s)(data)
				return { success: true as const, data: result }
			} catch (error) {
				const effectError = error as { message?: string }
				return {
					success: false as const,
					issues: [{ message: effectError.message ?? 'Validation failed' }],
				}
			}
		}

		// Try dynamic require for sync validation
		try {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('@effect/schema/Schema') as EffectSchemaModule
			SchemaModule = mod
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

	validateAsync: async (s, data) => {
		await loadSchemaModule()
		if (!SchemaModule) {
			return {
				success: false as const,
				issues: [{ message: 'Effect Schema requires @effect/schema' }],
			}
		}

		try {
			const result = SchemaModule.decodeUnknownSync(s)(data)
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
