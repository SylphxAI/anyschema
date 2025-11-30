/**
 * io-ts Validator Adapter
 *
 * Minimal adapter for validation only. ~40 lines.
 * Use this when you only need validation, not JSON Schema conversion.
 */

import { withDecode } from '../helpers.js'
import { defineValidatorAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** io-ts codec shape for type inference */
export interface IoTsSchema {
	_tag: string
	decode: (i: unknown) => unknown
	encode: (a: unknown) => unknown
}

// Type guard
const isIoTsSchema = (s: unknown): s is IoTsSchema => {
	if (!s || typeof s !== 'object') return false
	return '_tag' in s && 'decode' in s && 'encode' in s
}

// ============================================================================
// Validator Adapter
// ============================================================================

export const ioTsValidator = defineValidatorAdapter<IoTsSchema>({
	vendor: 'io-ts',
	match: isIoTsSchema,
	validate: (s, data) =>
		withDecode(s, data) ?? { success: false, issues: [{ message: 'Invalid io-ts codec' }] },

	validateAsync: async (s, data) => {
		// io-ts is sync only
		return withDecode(s, data) ?? { success: false, issues: [{ message: 'Invalid io-ts codec' }] }
	},
})
