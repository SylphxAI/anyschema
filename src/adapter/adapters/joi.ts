/**
 * Joi Adapter
 *
 * Duck-typed adapter for Joi schemas.
 * Detects via `$_root` + `type` + `validate` properties.
 */

import { withJoiValidate } from '../helpers.js'
import { defineAdapter, type SchemaConstraints } from '../types.js'

const isJoi = (s: unknown): boolean => {
	if (!s || typeof s !== 'object') return false
	return '$_root' in s && 'type' in s && 'validate' in s
}

const getType = (s: unknown): string | null => {
	if (!isJoi(s)) return null
	return (s as { type?: string }).type ?? null
}

const getFlags = (s: unknown): Record<string, unknown> | null => {
	if (!isJoi(s)) return null
	return (s as { _flags?: Record<string, unknown> })._flags ?? null
}

const getRules = (s: unknown): Array<{ name: string; args?: Record<string, unknown> }> => {
	if (!isJoi(s)) return []
	return (s as { _rules?: Array<{ name: string; args?: Record<string, unknown> }> })._rules ?? []
}

export const joiAdapter = defineAdapter({
	vendor: 'joi',

	match: isJoi,

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
			(flags?.['only'] === true &&
				Array.isArray((s as { _valids?: { _values?: Set<unknown> } })._valids?._values))
		)
	},
	isOptional: (s) => {
		const flags = getFlags(s)
		return flags?.['presence'] === 'optional'
	},
	isNullable: (s) => {
		const valids = (s as { _valids?: { _values?: Set<unknown> } })._valids?._values
		return valids instanceof Set && valids.has(null)
	},
	isTuple: (s) =>
		getType(s) === 'array' &&
		Array.isArray((s as { $_terms?: { ordered?: unknown[] } }).$_terms?.ordered),
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
		const keys = (s as { $_terms?: { keys?: Array<{ key: string; schema: unknown }> } }).$_terms
			?.keys
		return keys?.map((k) => [k.key, k.schema]) ?? []
	},

	getArrayElement: (s) => {
		if (getType(s) !== 'array') return null
		const items = (s as { $_terms?: { items?: unknown[] } }).$_terms?.items
		return items?.[0] ?? null
	},

	getUnionOptions: (s) => {
		if (getType(s) !== 'alternatives') return []
		const matches = (s as { $_terms?: { matches?: Array<{ schema: unknown }> } }).$_terms?.matches
		return matches?.map((m) => m.schema) ?? []
	},

	getLiteralValue: () => undefined,

	getEnumValues: (s) => {
		const valids = (s as { _valids?: { _values?: Set<unknown> } })._valids?._values
		if (valids instanceof Set) {
			return [...valids].filter((v) => v !== null && v !== undefined)
		}
		return []
	},

	getTupleItems: (s) => {
		const ordered = (s as { $_terms?: { ordered?: unknown[] } }).$_terms?.ordered
		return ordered ?? []
	},

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
		const examples = (s as { $_terms?: { examples?: unknown[] } }).$_terms?.examples
		return examples?.length ? examples : undefined
	},
	isDeprecated: () => false,

	// ============ Validation ============
	validate: (s, data) =>
		withJoiValidate(s, data) ?? { success: false, issues: [{ message: 'Invalid Joi schema' }] },

	validateAsync: async (s, data) => {
		if (typeof (s as { validateAsync?: unknown }).validateAsync !== 'function') {
			// Fall back to sync
			return (
				withJoiValidate(s, data) ?? { success: false, issues: [{ message: 'Invalid Joi schema' }] }
			)
		}

		try {
			const result = await (s as { validateAsync: (d: unknown) => Promise<unknown> }).validateAsync(
				data
			)
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
