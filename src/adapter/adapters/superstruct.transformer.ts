/**
 * Superstruct Transformer Adapter
 *
 * Full introspection for JSON Schema conversion.
 * Use this when you need to convert schemas to JSON Schema.
 */

import { defineTransformerAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Superstruct schema shape for type inference */
export interface SuperstructSchema {
	refiner: unknown
	validator: unknown
	coercer: unknown
	type?: string
	schema?: unknown
	default?: unknown
}

// Type guard
const isSuperstructSchema = (s: unknown): s is SuperstructSchema => {
	if (!s || typeof s !== 'object') return false
	return 'refiner' in s && 'validator' in s && 'coercer' in s
}

// Helpers
const getType = (s: SuperstructSchema): string | null => s.type ?? null
const getSchema = (s: SuperstructSchema): unknown => s.schema ?? null

// ============================================================================
// Transformer Adapter
// ============================================================================

export const superstructTransformer = defineTransformerAdapter<SuperstructSchema>({
	vendor: 'superstruct',
	match: isSuperstructSchema,

	// ============ Type Detection ============
	isString: (s) => getType(s) === 'string',
	isNumber: (s) => getType(s) === 'number' || getType(s) === 'integer' || getType(s) === 'float',
	isBoolean: (s) => getType(s) === 'boolean',
	isNull: () => false, // Superstruct doesn't have null type directly
	isUndefined: () => false,
	isVoid: () => false,
	isAny: (s) => getType(s) === 'any',
	isUnknown: (s) => getType(s) === 'unknown',
	isNever: (s) => getType(s) === 'never',
	isObject: (s) => getType(s) === 'object' || getType(s) === 'type',
	isArray: (s) => getType(s) === 'array',
	isUnion: (s) => getType(s) === 'union',
	isLiteral: (s) => getType(s) === 'literal',
	isEnum: (s) => getType(s) === 'enums',
	isOptional: (s) => getType(s) === 'optional',
	isNullable: (s) => getType(s) === 'nullable',
	isTuple: (s) => getType(s) === 'tuple',
	isRecord: (s) => getType(s) === 'record',
	isMap: (s) => getType(s) === 'map',
	isSet: (s) => getType(s) === 'set',
	isIntersection: (s) => getType(s) === 'intersection',
	isLazy: (s) => getType(s) === 'lazy',
	isTransform: (s) => getType(s) === 'coerce',
	isRefine: (s) => getType(s) === 'refine',
	isDefault: (s) => getType(s) === 'defaulted',
	isCatch: () => false,
	isBranded: () => false,
	isDate: (s) => getType(s) === 'date',
	isBigInt: (s) => getType(s) === 'bigint',
	isSymbol: () => false,
	isFunction: (s) => getType(s) === 'func',
	isPromise: () => false,
	isInstanceOf: (s) => getType(s) === 'instance',

	// ============ Unwrap ============
	unwrap: (s) => {
		const type = getType(s)

		// Wrapper types have schema property
		if (
			type === 'optional' ||
			type === 'nullable' ||
			type === 'coerce' ||
			type === 'refine' ||
			type === 'defaulted'
		) {
			return getSchema(s)
		}

		// Lazy has getter
		if (type === 'lazy') {
			const schema = getSchema(s)
			return typeof schema === 'function' ? (schema as () => unknown)() : null
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		const type = getType(s)
		if (type !== 'object' && type !== 'type') return []

		const schema = getSchema(s)
		if (schema && typeof schema === 'object') {
			return Object.entries(schema as Record<string, unknown>)
		}
		return []
	},

	getArrayElement: (s) => {
		if (getType(s) !== 'array') return null
		return getSchema(s) ?? null
	},

	getUnionOptions: (s) => {
		if (getType(s) !== 'union') return []
		const schema = getSchema(s)
		return Array.isArray(schema) ? schema : []
	},

	getLiteralValue: (s) => {
		if (getType(s) !== 'literal') return undefined
		return getSchema(s)
	},

	getEnumValues: (s) => {
		if (getType(s) !== 'enums') return []
		const schema = getSchema(s)
		return Array.isArray(schema) ? schema : []
	},

	getTupleItems: (s) => {
		if (getType(s) !== 'tuple') return []
		const schema = getSchema(s)
		return Array.isArray(schema) ? schema : []
	},

	getRecordKeyType: (s) => {
		if (getType(s) !== 'record') return null
		const schema = getSchema(s)
		if (Array.isArray(schema) && schema.length >= 1) {
			return schema[0]
		}
		return null
	},

	getRecordValueType: (s) => {
		if (getType(s) !== 'record') return null
		const schema = getSchema(s)
		if (Array.isArray(schema) && schema.length >= 2) {
			return schema[1]
		}
		return null
	},

	getMapKeyType: (s) => {
		if (getType(s) !== 'map') return null
		const schema = getSchema(s)
		if (Array.isArray(schema) && schema.length >= 1) {
			return schema[0]
		}
		return null
	},

	getMapValueType: (s) => {
		if (getType(s) !== 'map') return null
		const schema = getSchema(s)
		if (Array.isArray(schema) && schema.length >= 2) {
			return schema[1]
		}
		return null
	},

	getSetElement: (s) => {
		if (getType(s) !== 'set') return null
		return getSchema(s) ?? null
	},

	getIntersectionSchemas: (s) => {
		if (getType(s) !== 'intersection') return []
		const schema = getSchema(s)
		return Array.isArray(schema) ? schema : []
	},

	getPromiseInner: () => null,

	getInstanceOfClass: (s) => {
		if (getType(s) !== 'instance') return null
		return getSchema(s) ?? null
	},

	// ============ Constraints ============
	getConstraints: (s) => {
		// Superstruct constraints are in refiner function, not extractable
		// But size() creates a struct with min/max
		const type = getType(s)
		if (type === 'size') {
			const schema = getSchema(s)
			if (Array.isArray(schema) && schema.length >= 2) {
				return { min: schema[0], max: schema[1] }
			}
		}
		return null
	},

	// ============ Metadata ============
	getDescription: () => undefined,
	getTitle: () => undefined,
	getDefault: (s) => {
		if (getType(s) !== 'defaulted') return undefined
		return typeof s.default === 'function' ? undefined : s.default
	},
	getExamples: () => undefined,
	isDeprecated: () => false,
})
