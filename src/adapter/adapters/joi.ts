/**
 * Joi Adapter
 *
 * Duck-typed adapter for Joi schemas.
 * Detects via `$_root` + `type` + `validate` properties.
 */

import { withJoiValidate } from '../helpers.js'
import { defineAdapter, type SchemaConstraints } from '../types.js'

// ============================================================================
// Schema Type (exported for type inference)
// ============================================================================

/** Joi schema shape for type inference */
export interface JoiSchema {
	$_root: unknown
	type: string
	validate: (data: unknown) => unknown
	validateAsync?: (data: unknown) => Promise<unknown>
	_flags?: Record<string, unknown>
	_rules?: Array<{ name: string; args?: Record<string, unknown> }>
	_valids?: { _values?: Set<unknown> }
	$_terms?: {
		keys?: Array<{ key: string; schema: unknown }>
		items?: unknown[]
		ordered?: unknown[]
		matches?: Array<{ schema: unknown }>
		examples?: unknown[]
	}
}

// Type guard
const isJoiSchema = (s: unknown): s is JoiSchema => {
	if (!s || typeof s !== 'object') return false
	return '$_root' in s && 'type' in s && 'validate' in s
}

// Helpers
const getType = (s: JoiSchema): string => s.type
const getFlags = (s: JoiSchema): Record<string, unknown> | null => s._flags ?? null
const getRules = (s: JoiSchema): Array<{ name: string; args?: Record<string, unknown> }> =>
	s._rules ?? []

export const joiAdapter = defineAdapter<JoiSchema>({
	vendor: 'joi',

	match: isJoiSchema,

	// ============ Type Detection ============
	isString: (s) => getType(s) === 'string',
	isNumber: (s) => getType(s) === 'number',
	isBoolean: (s) => getType(s) === 'boolean',
	isNull: () => false, // Joi uses allow(null)
	isUndefined: () => false,
	isVoid: () => false,
	isAny: (s) => getType(s) === 'any',
	isUnknown: () => false,
	isNever: () => false,
	isObject: (s) => getType(s) === 'object',
	isArray: (s) => getType(s) === 'array',
	isUnion: (s) => getType(s) === 'alternatives',
	isLiteral: () => false, // Joi uses valid()
	isEnum: (s) => {
		const flags = getFlags(s)
		return (
			Array.isArray(flags?.['only']) ||
			(flags?.['only'] === true && s._valids?._values instanceof Set)
		)
	},
	isOptional: (s) => getFlags(s)?.['presence'] === 'optional',
	isNullable: (s) => {
		const valids = s._valids?._values
		return valids instanceof Set && valids.has(null)
	},
	isTuple: (s) => getType(s) === 'array' && Array.isArray(s.$_terms?.ordered),
	isRecord: () => false,
	isMap: () => false,
	isSet: () => false,
	isIntersection: () => false,
	isLazy: (s) => getType(s) === 'link',
	isTransform: () => false,
	isRefine: (s) => getRules(s).some((r) => r.name === 'custom'),
	isDefault: (s) => getFlags(s)?.['default'] !== undefined,
	isCatch: () => false,
	isBranded: () => false,
	isDate: (s) => getType(s) === 'date',
	isBigInt: () => false,
	isSymbol: (s) => getType(s) === 'symbol',
	isFunction: (s) => getType(s) === 'function',
	isPromise: () => false,
	isInstanceOf: () => false,

	// ============ Unwrap ============
	unwrap: () => null, // Joi doesn't have wrapper types like optional()

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getType(s) !== 'object') return []
		return s.$_terms?.keys?.map((k) => [k.key, k.schema] as [string, unknown]) ?? []
	},

	getArrayElement: (s) => {
		if (getType(s) !== 'array') return null
		return s.$_terms?.items?.[0] ?? null
	},

	getUnionOptions: (s) => {
		if (getType(s) !== 'alternatives') return []
		return s.$_terms?.matches?.map((m) => m.schema) ?? []
	},

	getLiteralValue: () => undefined,

	getEnumValues: (s) => {
		const valids = s._valids?._values
		if (valids instanceof Set) {
			return [...valids].filter((v) => v !== null && v !== undefined)
		}
		return []
	},

	getTupleItems: (s) => s.$_terms?.ordered ?? [],

	getRecordKeyType: () => null,
	getRecordValueType: () => null,
	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,
	getIntersectionSchemas: () => [],
	getPromiseInner: () => null,
	getInstanceOfClass: () => null,

	// ============ Constraints ============
	getConstraints: (s) => {
		const rules = getRules(s)
		const result: SchemaConstraints = {}

		for (const rule of rules) {
			switch (rule.name) {
				case 'min':
					if (getType(s) === 'string') result.minLength = rule.args?.['limit'] as number
					else if (getType(s) === 'number') result.min = rule.args?.['limit'] as number
					else if (getType(s) === 'array') result.min = rule.args?.['limit'] as number
					break
				case 'max':
					if (getType(s) === 'string') result.maxLength = rule.args?.['limit'] as number
					else if (getType(s) === 'number') result.max = rule.args?.['limit'] as number
					else if (getType(s) === 'array') result.max = rule.args?.['limit'] as number
					break
				case 'length':
					if (getType(s) === 'string') {
						result.minLength = rule.args?.['limit'] as number
						result.maxLength = rule.args?.['limit'] as number
					}
					break
				case 'pattern':
					if (rule.args?.['regex'] instanceof RegExp) {
						result.pattern = (rule.args['regex'] as RegExp).source
					}
					break
				case 'email':
					result.format = 'email'
					break
				case 'uri':
					result.format = 'uri'
					break
				case 'guid':
				case 'uuid':
					result.format = 'uuid'
					break
				case 'isoDate':
					result.format = 'date-time'
					break
			}
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => getFlags(s)?.['description'] as string | undefined,
	getTitle: (s) => getFlags(s)?.['label'] as string | undefined,
	getDefault: (s) => getFlags(s)?.['default'],
	getExamples: (s) => {
		const examples = s.$_terms?.examples
		return examples?.length ? examples : undefined
	},
	isDeprecated: () => false,

	// ============ Validation ============
	validate: (s, data) =>
		withJoiValidate(s, data) ?? { success: false, issues: [{ message: 'Invalid Joi schema' }] },

	validateAsync: async (s, data) => {
		if (typeof s.validateAsync !== 'function') {
			// Fall back to sync
			return (
				withJoiValidate(s, data) ?? { success: false, issues: [{ message: 'Invalid Joi schema' }] }
			)
		}

		try {
			const result = await s.validateAsync(data)
			return { success: true, data: result }
		} catch (error) {
			const joiError = error as { details?: Array<{ message: string; path: (string | number)[] }> }
			return {
				success: false,
				issues: joiError.details?.map((d) => ({
					message: d.message,
					path: d.path,
				})) ?? [{ message: 'Validation failed' }],
			}
		}
	},
})
