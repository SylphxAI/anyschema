/**
 * Zod v4 Validator Adapter
 *
 * Minimal adapter for validation only. ~30 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withSafeParse, withSafeParseAsync } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Zod v4 schema shape for type inference */
export interface ZodV4Schema {
	_zod: { def: { type?: string } }
}

// Type guard
const isZodV4 = (s: unknown): s is ZodV4Schema => {
	return s != null && typeof s === 'object' && '_zod' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const zodV4Validator = defineValidatorAdapter<ZodV4Schema>({
	vendor: 'zod',
	match: isZodV4,
	validate: (s, data) =>
		withSafeParse(s, data) ?? { success: false, issues: [{ message: 'Invalid Zod v4 schema' }] },
	validateAsync: async (s, data) =>
		(await withSafeParseAsync(s, data)) ??
		withSafeParse(s, data) ?? { success: false, issues: [{ message: 'Invalid Zod v4 schema' }] },
})
