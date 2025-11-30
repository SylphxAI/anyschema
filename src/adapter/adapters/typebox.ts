/**
 * TypeBox Adapter
 *
 * Duck-typed adapter for TypeBox schemas.
 * TypeBox schemas ARE JSON Schema, so most operations are pass-through.
 * Detects via `Symbol.for('TypeBox.Kind')` or `static` + `params` properties.
 */

import { defineAdapter, type SchemaConstraints } from '../types.js'

const TypeBoxKind = Symbol.for('TypeBox.Kind')

const isTypeBox = (s: unknown): boolean => {
	if (!s || typeof s !== 'object') return false
	// TypeBox schemas have the TypeBox.Kind symbol
	if (TypeBoxKind in s) return true
	// Or have static + params (older versions)
	return 'static' in s && 'params' in s
}

const getKind = (s: unknown): string | null => {
	if (!isTypeBox(s)) return null
	return (
		(s as Record<symbol | string, string>)[TypeBoxKind] ?? (s as { kind?: string }).kind ?? null
	)
}

const getType = (s: unknown): string | null => {
	if (!isTypeBox(s)) return null
	return (s as { type?: string }).type ?? null
}

export const typeboxAdapter = defineAdapter({
	vendor: 'typebox',

	match: isTypeBox,

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
	isUnion: (s) => (s as { anyOf?: unknown }).anyOf !== undefined,
	isLiteral: (s) => (s as { const?: unknown }).const !== undefined,
	isEnum: (s) => (s as { enum?: unknown }).enum !== undefined,
	isOptional: (s) => getKind(s) === 'Optional',
	isNullable: (s) => {
		const anyOf = (s as { anyOf?: unknown[] }).anyOf
		if (!Array.isArray(anyOf)) return false
		return anyOf.some(
			(o) => typeof o === 'object' && o !== null && (o as { type?: string }).type === 'null'
		)
	},
	isTuple: (s) => getType(s) === 'array' && Array.isArray((s as { items?: unknown }).items),
	isRecord: (s) =>
		getType(s) === 'object' &&
		(s as { additionalProperties?: unknown }).additionalProperties !== undefined &&
		!(s as { properties?: unknown }).properties,
	isMap: () => false, // TypeBox uses Record for maps
	isSet: () => false,
	isIntersection: (s) => (s as { allOf?: unknown }).allOf !== undefined,
	isLazy: (s) => getKind(s) === 'Ref',
	isTransform: (s) => getKind(s) === 'Transform',
	isRefine: () => false,
	isDefault: (s) => (s as { default?: unknown }).default !== undefined,
	isCatch: () => false,
	isBranded: () => false,
	isDate: (s) => getType(s) === 'string' && (s as { format?: string }).format === 'date-time',
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
			// Need to clone without the Optional kind
			return null // TypeBox doesn't have a clean unwrap
		}

		// Transform has inner schema
		if (kind === 'Transform') {
			return (s as { $schema?: unknown }).$schema ?? null
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getType(s) !== 'object') return []
		const properties = (s as { properties?: Record<string, unknown> }).properties
		return properties ? Object.entries(properties) : []
	},

	getArrayElement: (s) => {
		if (getType(s) !== 'array') return null
		const items = (s as { items?: unknown }).items
		// If items is array, it's a tuple
		if (Array.isArray(items)) return null
		return items ?? null
	},

	getUnionOptions: (s) => {
		const anyOf = (s as { anyOf?: unknown[] }).anyOf
		return Array.isArray(anyOf) ? anyOf : []
	},

	getLiteralValue: (s) => (s as { const?: unknown }).const,

	getEnumValues: (s) => {
		const enumValues = (s as { enum?: unknown[] }).enum
		return Array.isArray(enumValues) ? enumValues : []
	},

	getTupleItems: (s) => {
		if (getType(s) !== 'array') return []
		const items = (s as { items?: unknown[] }).items
		return Array.isArray(items) ? items : []
	},

	getRecordKeyType: () => null, // TypeBox records use JSON Schema additionalProperties

	getRecordValueType: (s) => {
		if (getType(s) !== 'object') return null
		return (s as { additionalProperties?: unknown }).additionalProperties ?? null
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,

	getIntersectionSchemas: (s) => {
		const allOf = (s as { allOf?: unknown[] }).allOf
		return Array.isArray(allOf) ? allOf : []
	},

	getPromiseInner: () => null,
	getInstanceOfClass: () => null,

	// ============ Constraints ============
	getConstraints: (s) => {
		const result: SchemaConstraints = {}
		const schema = s as {
			minLength?: number
			maxLength?: number
			pattern?: string
			format?: string
			minimum?: number
			maximum?: number
			minItems?: number
			maxItems?: number
		}

		if (schema.minLength !== undefined) result.minLength = schema.minLength
		if (schema.maxLength !== undefined) result.maxLength = schema.maxLength
		if (schema.pattern !== undefined) result.pattern = schema.pattern
		if (schema.format !== undefined) result.format = schema.format
		if (schema.minimum !== undefined) result.min = schema.minimum
		if (schema.maximum !== undefined) result.max = schema.maximum
		if (schema.minItems !== undefined) result.min = schema.minItems
		if (schema.maxItems !== undefined) result.max = schema.maxItems

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => (s as { description?: string }).description,
	getTitle: (s) => (s as { title?: string }).title,
	getDefault: (s) => (s as { default?: unknown }).default,
	getExamples: (s) => (s as { examples?: unknown[] }).examples,
	isDeprecated: (s) => (s as { deprecated?: boolean }).deprecated === true,

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
