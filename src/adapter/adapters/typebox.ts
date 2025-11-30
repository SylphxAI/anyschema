/**
 * TypeBox Adapter
 *
 * Duck-typed adapter for TypeBox schemas.
 * TypeBox schemas ARE JSON Schema, so most operations are pass-through.
 * Detects via `Symbol.for('TypeBox.Kind')` or `static` + `params` properties.
 */

import { defineAdapter, type SchemaConstraints } from '../types.js'

// ============================================================================
// Schema Type (exported for type inference)
// ============================================================================

const TypeBoxKind = Symbol.for('TypeBox.Kind')

/** TypeBox schema shape for type inference */
export interface TypeBoxSchema {
	[TypeBoxKind]?: string
	kind?: string
	type?: string
	static?: unknown
	params?: unknown
	const?: unknown
	enum?: unknown[]
	anyOf?: unknown[]
	allOf?: unknown[]
	items?: unknown | unknown[]
	properties?: Record<string, unknown>
	additionalProperties?: unknown
	required?: string[]
	default?: unknown
	minLength?: number
	maxLength?: number
	pattern?: string
	format?: string
	minimum?: number
	maximum?: number
	minItems?: number
	maxItems?: number
	description?: string
	title?: string
	examples?: unknown[]
	deprecated?: boolean
	$schema?: unknown
}

// Type guard
const isTypeBoxSchema = (s: unknown): s is TypeBoxSchema => {
	if (!s || typeof s !== 'object') return false
	// TypeBox schemas have the TypeBox.Kind symbol
	if (TypeBoxKind in s) return true
	// Or have static + params (older versions)
	return 'static' in s && 'params' in s
}

// Helpers
const getKind = (s: TypeBoxSchema): string | null =>
	(s as Record<symbol | string, string>)[TypeBoxKind] ?? s.kind ?? null

const getType = (s: TypeBoxSchema): string | null => s.type ?? null

export const typeboxAdapter = defineAdapter<TypeBoxSchema>({
	vendor: 'typebox',

	match: isTypeBoxSchema,

	// ============ Type Detection ============
	isString: (s) => getType(s) === 'string',
	isNumber: (s) => getType(s) === 'number',
	isBoolean: (s) => getType(s) === 'boolean',
	isNull: (s) => getType(s) === 'null',
	isUndefined: (s) => getKind(s) === 'Undefined',
	isVoid: (s) => getKind(s) === 'Void',
	isAny: (s) => getKind(s) === 'Any',
	isUnknown: (s) => getKind(s) === 'Unknown',
	isNever: (s) => getKind(s) === 'Never',
	isObject: (s) => getType(s) === 'object',
	isArray: (s) => getType(s) === 'array',
	isUnion: (s) => s.anyOf !== undefined,
	isLiteral: (s) => s.const !== undefined,
	isEnum: (s) => s.enum !== undefined,
	isOptional: (s) => getKind(s) === 'Optional',
	isNullable: (s) => {
		if (!Array.isArray(s.anyOf)) return false
		return s.anyOf.some(
			(o) => typeof o === 'object' && o !== null && (o as { type?: string }).type === 'null'
		)
	},
	isTuple: (s) => getType(s) === 'array' && Array.isArray(s.items),
	isRecord: (s) => getType(s) === 'object' && s.additionalProperties !== undefined && !s.properties,
	isMap: () => false, // TypeBox uses Record for maps
	isSet: () => false,
	isIntersection: (s) => s.allOf !== undefined,
	isLazy: (s) => getKind(s) === 'Ref',
	isTransform: (s) => getKind(s) === 'Transform',
	isRefine: () => false,
	isDefault: (s) => s.default !== undefined,
	isCatch: () => false,
	isBranded: () => false,
	isDate: (s) => getType(s) === 'string' && s.format === 'date-time',
	isBigInt: (s) => getKind(s) === 'BigInt',
	isSymbol: (s) => getKind(s) === 'Symbol',
	isFunction: (s) => getKind(s) === 'Function',
	isPromise: (s) => getKind(s) === 'Promise',
	isInstanceOf: () => false,

	// ============ Unwrap ============
	unwrap: (s) => {
		const kind = getKind(s)

		// Optional wraps inner schema
		if (kind === 'Optional') {
			// TypeBox Optional has the inner schema properties directly
			return null // TypeBox doesn't have a clean unwrap
		}

		// Transform has inner schema
		if (kind === 'Transform') {
			return s.$schema ?? null
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getType(s) !== 'object') return []
		return s.properties ? Object.entries(s.properties) : []
	},

	getArrayElement: (s) => {
		if (getType(s) !== 'array') return null
		// If items is array, it's a tuple
		if (Array.isArray(s.items)) return null
		return s.items ?? null
	},

	getUnionOptions: (s) => (Array.isArray(s.anyOf) ? s.anyOf : []),

	getLiteralValue: (s) => s.const,

	getEnumValues: (s) => (Array.isArray(s.enum) ? s.enum : []),

	getTupleItems: (s) => {
		if (getType(s) !== 'array') return []
		return Array.isArray(s.items) ? s.items : []
	},

	getRecordKeyType: () => null, // TypeBox records use JSON Schema additionalProperties

	getRecordValueType: (s) => {
		if (getType(s) !== 'object') return null
		return s.additionalProperties ?? null
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,

	getIntersectionSchemas: (s) => (Array.isArray(s.allOf) ? s.allOf : []),

	getPromiseInner: () => null,
	getInstanceOfClass: () => null,

	// ============ Constraints ============
	getConstraints: (s) => {
		const result: SchemaConstraints = {}

		if (s.minLength !== undefined) result.minLength = s.minLength
		if (s.maxLength !== undefined) result.maxLength = s.maxLength
		if (s.pattern !== undefined) result.pattern = s.pattern
		if (s.format !== undefined) result.format = s.format
		if (s.minimum !== undefined) result.min = s.minimum
		if (s.maximum !== undefined) result.max = s.maximum
		if (s.minItems !== undefined) result.min = s.minItems
		if (s.maxItems !== undefined) result.max = s.maxItems

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => s.description,
	getTitle: (s) => s.title,
	getDefault: (s) => s.default,
	getExamples: (s) => s.examples,
	isDeprecated: (s) => s.deprecated === true,

	// ============ Validation ============
	// TypeBox schemas don't have validation methods - need @sinclair/typebox/value
	// Users should use Standard Schema protocol or import Value directly
	validate: (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'TypeBox requires Value.Check() for validation. Use Standard Schema protocol or @sinclair/typebox/value directly.',
			},
		],
	}),

	validateAsync: async (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'TypeBox requires Value.Check() for validation. Use Standard Schema protocol or @sinclair/typebox/value directly.',
			},
		],
	}),
})
