/**
 * Valibot Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withValibotRun, withValibotRunAsync } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Valibot schema shape for type inference */
export interface ValibotSchema {
	kind: 'schema'
	type: string
}

// Type guard
const isValibotSchema = (s: unknown): s is ValibotSchema => {
	return (
		s != null && typeof s === 'object' && 'kind' in s && (s as { kind: unknown }).kind === 'schema'
	)
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const valibotValidator = defineValidatorAdapter<ValibotSchema>({
	vendor: 'valibot',
	match: isValibotSchema,
	validate: (s, data) =>
		withValibotRun(s, data) ?? { success: false, issues: [{ message: 'Invalid Valibot schema' }] },
	validateAsync: async (s, data) =>
		(await withValibotRunAsync(s, data)) ??
		withValibotRun(s, data) ?? { success: false, issues: [{ message: 'Invalid Valibot schema' }] },
})
