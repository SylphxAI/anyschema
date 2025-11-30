/**
 * Zod v3 Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withSafeParse, withSafeParseAsync } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Zod v3 schema shape for type inference */
export interface ZodV3Schema {
	_def: { typeName?: string }
}

// Type guard - Zod v3 has _def.typeName but NOT _zod
const isZodV3 = (s: unknown): s is ZodV3Schema => {
	if (!s || typeof s !== 'object') return false
	if ('_zod' in s) return false // Zod v4
	if (!('_def' in s)) return false
	const def = (s as { _def: { typeName?: string } })._def
	return typeof def?.typeName === 'string'
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const zodV3Validator = defineValidatorAdapter<ZodV3Schema>({
	vendor: 'zod',
	match: isZodV3,
	validate: (s, data) =>
		withSafeParse(s, data) ?? { success: false, issues: [{ message: 'Invalid Zod v3 schema' }] },
	validateAsync: async (s, data) =>
		(await withSafeParseAsync(s, data)) ??
		withSafeParse(s, data) ?? { success: false, issues: [{ message: 'Invalid Zod v3 schema' }] },
})
