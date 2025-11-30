/**
 * ArkType Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withCallable } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** ArkType schema shape for type inference */
export interface ArkTypeSchema {
	internal: {
		kind: string
		json: unknown
	}
	json: unknown
}

// Type guard - ArkType schemas are functions with internal and json properties
const isArkTypeSchema = (s: unknown): s is ArkTypeSchema => {
	if (!s) return false
	// ArkType schemas are functions
	if (typeof s !== 'function' && typeof s !== 'object') return false
	// internal can be a function or object (ArkType nodes extend Function)
	if (!('internal' in s) || !('json' in s)) return false
	const internal = (s as { internal: unknown }).internal
	return (
		internal != null &&
		(typeof internal === 'object' || typeof internal === 'function') &&
		'kind' in (internal as object)
	)
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const arktypeValidator = defineValidatorAdapter<ArkTypeSchema>({
	vendor: 'arktype',
	match: isArkTypeSchema,
	validate: (s, data) =>
		withCallable(s, data) ?? { success: false, issues: [{ message: 'Invalid ArkType schema' }] },
	validateAsync: async (s, data) =>
		withCallable(s, data) ?? { success: false, issues: [{ message: 'Invalid ArkType schema' }] },
})
