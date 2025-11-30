/**
 * Runtypes Adapter
 *
 * Duck-typed adapter for Runtypes.
 * Detects via `reflect` + `check` + `guard` properties.
 */

import { withCheck } from '../helpers.js'
import { defineAdapter } from '../types.js'

const isRuntypes = (s: unknown): boolean => {
	if (!s || typeof s !== 'object') return false
	return 'reflect' in s && 'check' in s && 'guard' in s
}

const getReflect = (s: unknown): Record<string, unknown> | null => {
	if (!isRuntypes(s)) return null
	return (s as { reflect?: Record<string, unknown> }).reflect ?? null
}

const getTag = (s: unknown): string | null => {
	const reflect = getReflect(s)
	return reflect?.['tag'] as string | null
}

export const runtypesAdapter = defineAdapter({
	vendor: 'runtypes',

	match: isRuntypes,

	// ============ Type Detection ============
	isString: (s) => getTag(s) === 'string',
	isNumber: (s) => getTag(s) === 'number',
	isBoolean: (s) => getTag(s) === 'boolean',
	isNull: (s) => getTag(s) === 'null',
	isUndefined: (s) => getTag(s) === 'undefined',
	isVoid: (s) => getTag(s) === 'void',
	isAny: () => false, // Runtypes doesn't have any
	isUnknown: (s) => getTag(s) === 'unknown',
	isNever: (s) => getTag(s) === 'never',
	isObject: (s) => getTag(s) === 'record',
	isArray: (s) => getTag(s) === 'array',
	isUnion: (s) => getTag(s) === 'union',
	isLiteral: (s) => getTag(s) === 'literal',
	isEnum: () => false, // Runtypes uses union of literals
	isOptional: (s) => getTag(s) === 'optional',
	isNullable: () => false, // Runtypes uses union with null
	isTuple: (s) => getTag(s) === 'tuple',
	isRecord: (s) => getTag(s) === 'dictionary',
	isMap: () => false,
	isSet: () => false,
	isIntersection: (s) => getTag(s) === 'intersect',
	isLazy: (s) => getTag(s) === 'lazy',
	isTransform: () => false,
	isRefine: (s) => getTag(s) === 'constraint',
	isDefault: () => false,
	isCatch: () => false,
	isBranded: (s) => getTag(s) === 'brand',
	isDate: () => false, // Runtypes doesn't have date
	isBigInt: (s) => getTag(s) === 'bigint',
	isSymbol: (s) => getTag(s) === 'symbol',
	isFunction: (s) => getTag(s) === 'function',
	isPromise: () => false,
	isInstanceOf: (s) => getTag(s) === 'instanceof',

	// ============ Unwrap ============
	unwrap: (s) => {
		const reflect = getReflect(s)
		if (!reflect) return null

		const tag = getTag(s)

		// Optional has underlying
		if (tag === 'optional') {
			return reflect['underlying'] ?? null
		}

		// Constraint has underlying
		if (tag === 'constraint') {
			return reflect['underlying'] ?? null
		}

		// Brand has entity
		if (tag === 'brand') {
			return reflect['entity'] ?? null
		}

		// Lazy has underlying (resolved)
		if (tag === 'lazy') {
			return reflect['underlying'] ?? null
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getTag(s) !== 'record') return []
		const reflect = getReflect(s)
		const fields = reflect?.['fields'] as Record<string, unknown> | undefined
		return fields ? Object.entries(fields) : []
	},

	getArrayElement: (s) => {
		if (getTag(s) !== 'array') return null
		const reflect = getReflect(s)
		return reflect?.['element'] ?? null
	},

	getUnionOptions: (s) => {
		if (getTag(s) !== 'union') return []
		const reflect = getReflect(s)
		return (reflect?.['alternatives'] as unknown[]) ?? []
	},

	getLiteralValue: (s) => {
		if (getTag(s) !== 'literal') return undefined
		const reflect = getReflect(s)
		return reflect?.['value']
	},

	getEnumValues: () => [],

	getTupleItems: (s) => {
		if (getTag(s) !== 'tuple') return []
		const reflect = getReflect(s)
		return (reflect?.['components'] as unknown[]) ?? []
	},

	getRecordKeyType: (s) => {
		if (getTag(s) !== 'dictionary') return null
		const reflect = getReflect(s)
		return reflect?.['key'] ?? null
	},

	getRecordValueType: (s) => {
		if (getTag(s) !== 'dictionary') return null
		const reflect = getReflect(s)
		return reflect?.['value'] ?? null
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,

	getIntersectionSchemas: (s) => {
		if (getTag(s) !== 'intersect') return []
		const reflect = getReflect(s)
		return (reflect?.['intersectees'] as unknown[]) ?? []
	},

	getPromiseInner: () => null,

	getInstanceOfClass: (s) => {
		if (getTag(s) !== 'instanceof') return null
		const reflect = getReflect(s)
		return reflect?.['ctor'] ?? null
	},

	// ============ Constraints ============
	getConstraints: () => null, // Runtypes constraints are in functions, not extractable

	// ============ Metadata ============
	getDescription: () => undefined,
	getTitle: () => undefined,
	getDefault: () => undefined,
	getExamples: () => undefined,
	isDeprecated: () => false,

	// ============ Validation ============
	validate: (s, data) =>
		withCheck(s, data) ?? { success: false, issues: [{ message: 'Invalid Runtypes schema' }] },

	validateAsync: async (s, data) => {
		// Runtypes is sync only
		return (
			withCheck(s, data) ?? { success: false, issues: [{ message: 'Invalid Runtypes schema' }] }
		)
	},
})
