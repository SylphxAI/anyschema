/**
 * Runtypes Transformer Adapter
 *
 * Full introspection for JSON Schema conversion.
 * Use this when you need to convert schemas to JSON Schema.
 */

import { defineTransformerAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Runtypes schema shape for type inference */
export interface RuntypesSchema {
	tag?: string
	check: (x: unknown) => unknown
	guard: (x: unknown) => boolean
	// Properties may be at top level or nested
	underlying?: unknown
	entity?: unknown
	fields?: Record<string, unknown>
	element?: unknown
	alternatives?: unknown[]
	value?: unknown
	components?: unknown[]
	key?: unknown
	intersectees?: unknown[]
	ctor?: unknown
	reflect?: RuntypesReflect
}

interface RuntypesReflect {
	tag?: string
	underlying?: unknown
	entity?: unknown
	fields?: Record<string, unknown>
	element?: unknown
	alternatives?: unknown[]
	value?: unknown
	components?: unknown[]
	key?: unknown // For Record type, contains field schemas
	intersectees?: unknown[]
	ctor?: unknown
	isExact?: boolean
}

// Type guard
const isRuntypesSchema = (s: unknown): s is RuntypesSchema => {
	if (!s || typeof s !== 'object') return false
	// Runtypes has check and guard methods
	return 'check' in s && 'guard' in s
}

// Helpers - try direct properties first, then reflect
const getTag = (s: RuntypesSchema): string | null => s.tag ?? s.reflect?.tag ?? null
const getProp = <K extends keyof RuntypesReflect>(
	s: RuntypesSchema,
	key: K
): RuntypesReflect[K] | null => (s as unknown as RuntypesReflect)[key] ?? s.reflect?.[key] ?? null

// ============================================================================
// Transformer Adapter
// ============================================================================

export const runtypesTransformer = defineTransformerAdapter<RuntypesSchema>({
	vendor: 'runtypes',
	match: isRuntypesSchema,

	// ============ Type Detection ============
	isString: (s) => getTag(s) === 'string',
	isNumber: (s) => getTag(s) === 'number',
	isBoolean: (s) => getTag(s) === 'boolean',
	isNull: (s) => getTag(s) === 'literal' && getProp(s, 'value') === null,
	isUndefined: (s) => getTag(s) === 'undefined',
	isVoid: (s) => getTag(s) === 'void',
	isAny: () => false, // Runtypes doesn't have any
	isUnknown: (s) => getTag(s) === 'unknown',
	isNever: (s) => getTag(s) === 'never',
	isObject: (s) => getTag(s) === 'object' || getTag(s) === 'record',
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
		const tag = getTag(s)

		// Optional has underlying
		if (tag === 'optional') return getProp(s, 'underlying')

		// Constraint has underlying
		if (tag === 'constraint') return getProp(s, 'underlying')

		// Brand has entity
		if (tag === 'brand') return getProp(s, 'entity')

		// Lazy has underlying (resolved)
		if (tag === 'lazy') return getProp(s, 'underlying')

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		const tag = getTag(s)
		if (tag === 'object') {
			const fields = getProp(s, 'fields')
			return fields ? Object.entries(fields) : []
		}
		if (tag === 'record') {
			// Runtypes Record uses 'key' for field schemas
			const fields = getProp(s, 'key')
			return fields ? Object.entries(fields) : []
		}
		return []
	},

	getArrayElement: (s) => {
		if (getTag(s) !== 'array') return null
		return getProp(s, 'element')
	},

	getUnionOptions: (s) => {
		if (getTag(s) !== 'union') return []
		return getProp(s, 'alternatives') ?? []
	},

	getLiteralValue: (s) => {
		if (getTag(s) !== 'literal') return undefined
		return getProp(s, 'value')
	},

	getEnumValues: () => [],

	getTupleItems: (s) => {
		if (getTag(s) !== 'tuple') return []
		return getProp(s, 'components') ?? []
	},

	getRecordKeyType: (s) => {
		if (getTag(s) !== 'dictionary') return null
		return getProp(s, 'key')
	},

	getRecordValueType: (s) => {
		if (getTag(s) !== 'dictionary') return null
		return getProp(s, 'value')
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,

	getIntersectionSchemas: (s) => {
		if (getTag(s) !== 'intersect') return []
		return getProp(s, 'intersectees') ?? []
	},

	getPromiseInner: () => null,

	getInstanceOfClass: (s) => {
		if (getTag(s) !== 'instanceof') return null
		return getProp(s, 'ctor')
	},

	// ============ Constraints ============
	getConstraints: () => null, // Runtypes constraints are in functions, not extractable

	// ============ Metadata ============
	getDescription: () => undefined,
	getTitle: () => undefined,
	getDefault: () => undefined,
	getExamples: () => undefined,
	isDeprecated: () => false,
})
