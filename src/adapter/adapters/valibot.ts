/**
 * Valibot Adapter
 *
 * Duck-typed adapter for Valibot schemas.
 * Detects via `kind: 'schema'` property.
 */

import { withValibotRun, withValibotRunAsync } from '../helpers.js'
import { defineAdapter, type SchemaConstraints } from '../types.js'

// ============================================================================
// Schema Type (exported for type inference)
// ============================================================================

/** Valibot schema shape for type inference */
export interface ValibotSchema {
	kind: 'schema'
	type: string
	pipe?: ValibotPipeItem[]
	// Various schema-specific properties
	wrapped?: ValibotSchema
	item?: ValibotSchema
	items?: ValibotSchema[]
	entries?: Record<string, ValibotSchema>
	options?: unknown[]
	literal?: unknown
	enum?: Record<string, unknown>
	key?: ValibotSchema
	value?: ValibotSchema
	getter?: () => ValibotSchema
	default?: unknown
}

interface ValibotPipeItem {
	kind: string
	type: string
	requirement?: unknown
	description?: string
}

// Type guard
const isValibotSchema = (s: unknown): s is ValibotSchema => {
	return (
		s != null && typeof s === 'object' && 'kind' in s && (s as { kind: unknown }).kind === 'schema'
	)
}

// Helper to get type
const getType = (s: ValibotSchema): string => s.type

// Helper to get pipe items
const getPipe = (s: ValibotSchema): ValibotPipeItem[] => s.pipe ?? []

// Helper to find pipe item by kind/type
const findPipeItem = (s: ValibotSchema, kind: string, type?: string): ValibotPipeItem | undefined => {
	return getPipe(s).find((p) => p.kind === kind && (!type || p.type === type))
}

// Helper to find all pipe items by kind
const findPipeItems = (s: ValibotSchema, kind: string): ValibotPipeItem[] => {
	return getPipe(s).filter((p) => p.kind === kind)
}

export const valibotAdapter = defineAdapter<ValibotSchema>({
	vendor: 'valibot',

	match: isValibotSchema,

	// ============ Type Detection ============
	isString: (s) => getType(s) === 'string',
	isNumber: (s) => getType(s) === 'number',
	isBoolean: (s) => getType(s) === 'boolean',
	isNull: (s) => getType(s) === 'null',
	isUndefined: (s) => getType(s) === 'undefined',
	isVoid: (s) => getType(s) === 'void',
	isAny: (s) => getType(s) === 'any',
	isUnknown: (s) => getType(s) === 'unknown',
	isNever: (s) => getType(s) === 'never',
	isObject: (s) => getType(s) === 'object',
	isArray: (s) => getType(s) === 'array',
	isUnion: (s) => getType(s) === 'union',
	isLiteral: (s) => getType(s) === 'literal',
	isEnum: (s) => getType(s) === 'enum' || getType(s) === 'picklist',
	isOptional: (s) => getType(s) === 'optional' || getType(s) === 'nullish',
	isNullable: (s) => getType(s) === 'nullable' || getType(s) === 'nullish',
	isTuple: (s) => getType(s) === 'tuple',
	isRecord: (s) => getType(s) === 'record',
	isMap: (s) => getType(s) === 'map',
	isSet: (s) => getType(s) === 'set',
	isIntersection: (s) => getType(s) === 'intersect',
	isLazy: (s) => getType(s) === 'lazy',
	isTransform: (s) => findPipeItem(s, 'transformation') !== undefined,
	isRefine: (s) => findPipeItem(s, 'validation', 'custom') !== undefined,
	isDefault: (s) => (getType(s) === 'optional' || getType(s) === 'nullable') && s.default !== undefined,
	isCatch: () => false, // Valibot doesn't have catch
	isBranded: (s) => getType(s) === 'brand',
	isDate: (s) => getType(s) === 'date',
	isBigInt: (s) => getType(s) === 'bigint',
	isSymbol: (s) => getType(s) === 'symbol',
	isFunction: (s) => getType(s) === 'function',
	isPromise: (s) => getType(s) === 'promise',
	isInstanceOf: (s) => getType(s) === 'instance',

	// ============ Unwrap ============
	unwrap: (s) => {
		// optional, nullable, nullish - have wrapped
		if (s.wrapped) return s.wrapped

		// brand - has wrapped
		if (getType(s) === 'brand' && 'wrapped' in s) return s.wrapped

		// lazy - call getter
		if (getType(s) === 'lazy' && typeof s.getter === 'function') {
			return s.getter()
		}

		// pipe - first element is the base schema
		if (s.pipe && s.pipe.length > 0) {
			const first = s.pipe[0]
			if (first && first.kind === 'schema') return first
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getType(s) !== 'object') return []
		return s.entries ? Object.entries(s.entries) : []
	},

	getArrayElement: (s) => s.item ?? null,

	getUnionOptions: (s) => {
		if (getType(s) !== 'union') return []
		return s.options ?? []
	},

	getLiteralValue: (s) => {
		if (getType(s) !== 'literal') return undefined
		return s.literal
	},

	getEnumValues: (s) => {
		// enum has `options` array, picklist has `options` array
		if (s.options && Array.isArray(s.options)) return s.options
		// enum also has `enum` object
		if (s.enum && typeof s.enum === 'object') return Object.values(s.enum)
		return []
	},

	getTupleItems: (s) => {
		if (getType(s) !== 'tuple') return []
		return s.items ?? []
	},

	getRecordKeyType: (s) => {
		if (getType(s) !== 'record') return null
		return s.key ?? null
	},

	getRecordValueType: (s) => {
		if (getType(s) !== 'record') return null
		return s.value ?? null
	},

	getMapKeyType: (s) => {
		if (getType(s) !== 'map') return null
		return s.key ?? null
	},

	getMapValueType: (s) => {
		if (getType(s) !== 'map') return null
		return s.value ?? null
	},

	getSetElement: (s) => {
		if (getType(s) !== 'set') return null
		return s.value ?? null
	},

	getIntersectionSchemas: (s) => {
		if (getType(s) !== 'intersect') return []
		return s.options ?? []
	},

	getPromiseInner: (s) => {
		if (getType(s) !== 'promise') return null
		return s.wrapped ?? null
	},

	getInstanceOfClass: (s) => {
		if (getType(s) !== 'instance') return null
		return (s as { class?: unknown }).class ?? null
	},

	// ============ Constraints ============
	getConstraints: (s) => {
		const result: SchemaConstraints = {}

		// Check pipe for validations
		const validations = findPipeItems(s, 'validation')
		for (const v of validations) {
			switch (v.type) {
				case 'min_length':
					result.minLength = v.requirement as number
					break
				case 'max_length':
					result.maxLength = v.requirement as number
					break
				case 'length':
					result.minLength = v.requirement as number
					result.maxLength = v.requirement as number
					break
				case 'regex':
					if (v.requirement instanceof RegExp) {
						result.pattern = v.requirement.source
					}
					break
				case 'email':
					result.format = 'email'
					break
				case 'url':
					result.format = 'uri'
					break
				case 'uuid':
					result.format = 'uuid'
					break
				case 'iso_date':
				case 'iso_date_time':
					result.format = 'date-time'
					break
				case 'min_value':
					result.min = v.requirement as number
					break
				case 'max_value':
					result.max = v.requirement as number
					break
				case 'min_size':
					result.min = v.requirement as number
					break
				case 'max_size':
					result.max = v.requirement as number
					break
			}
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => {
		// Description is in pipe as metadata item
		const descItem = findPipeItem(s, 'metadata', 'description')
		return descItem?.description
	},

	getTitle: (s) => {
		const titleItem = findPipeItem(s, 'metadata', 'title')
		return (titleItem as { title?: string } | undefined)?.title
	},

	getDefault: (s) => {
		// optional/nullable with default
		if ((getType(s) === 'optional' || getType(s) === 'nullable') && s.default !== undefined) {
			// default can be a value or a function
			return typeof s.default === 'function' ? (s.default as () => unknown)() : s.default
		}
		return undefined
	},

	getExamples: () => undefined, // Valibot doesn't have examples

	isDeprecated: () => false, // Valibot doesn't have deprecated

	// ============ Validation ============
	validate: (s, data) =>
		withValibotRun(s, data) ?? { success: false, issues: [{ message: 'Invalid Valibot schema' }] },
	validateAsync: async (s, data) =>
		(await withValibotRunAsync(s, data)) ??
		withValibotRun(s, data) ?? { success: false, issues: [{ message: 'Invalid Valibot schema' }] },
})
