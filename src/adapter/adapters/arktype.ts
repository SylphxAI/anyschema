/**
 * ArkType Adapter
 *
 * Duck-typed adapter for ArkType schemas.
 * Detects via `internal` property with `kind` and `json`.
 */

import { withCallable } from '../helpers.js'
import { defineAdapter, type SchemaConstraints } from '../types.js'

// Type helpers for ArkType's internal JSON representation
type ArkJson =
	| string // reference like "string", "number"
	| ArkJsonObject
	| ArkJsonObject[] // union

interface ArkJsonObject {
	domain?: string
	unit?: unknown
	required?: Array<{ key: string; value: ArkJson }>
	optional?: Array<{ key: string; value: ArkJson }>
	sequence?: ArkJson | { prefix?: ArkJson[]; variadic?: ArkJson }
	proto?: string
	exactLength?: number
	minLength?: number
	maxLength?: number
	min?: number
	max?: number
	pattern?: Array<{ rule: string; flags: string; meta?: string }>
	meta?: { format?: string; description?: string }
}

interface ArkTypeSchema {
	internal: {
		kind: string
		json: ArkJson
		domain?: string
	}
	json: ArkJson
	expression: string
	description?: string
}

// Helper to check if it's an ArkType schema
// ArkType schemas are functions with internal and json properties
const isArkType = (s: unknown): s is ArkTypeSchema => {
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

// Helper to get JSON representation
const getJson = (s: unknown): ArkJson | null => {
	if (!isArkType(s)) return null
	return s.json
}

// Helper to normalize JSON to object form
const normalizeJson = (json: ArkJson): ArkJsonObject | null => {
	if (typeof json === 'string') {
		// Simple domain reference
		return { domain: json }
	}
	if (Array.isArray(json)) {
		// Union - return null, handle separately
		return null
	}
	return json
}

// Helper to check domain
const hasDomain = (s: unknown, domain: string): boolean => {
	const json = getJson(s)
	if (!json) return false
	const obj = normalizeJson(json)
	return obj?.domain === domain
}

// Helper to check if it's a unit (literal)
const isUnit = (s: unknown): boolean => {
	const json = getJson(s)
	if (!json || Array.isArray(json) || typeof json === 'string') return false
	return 'unit' in json
}

// Helper to check if it's a union (array of options)
const isUnionJson = (s: unknown): boolean => {
	const json = getJson(s)
	return Array.isArray(json)
}

export const arktypeAdapter = defineAdapter({
	vendor: 'arktype',

	match: isArkType,

	// ============ Type Detection ============
	isString: (s) => hasDomain(s, 'string'),
	isNumber: (s) => hasDomain(s, 'number'),
	isBoolean: (s) => {
		// ArkType represents boolean as union of true/false units
		const json = getJson(s)
		if (!Array.isArray(json) || json.length !== 2) return false
		const hasTrue = json.some((j) => typeof j === 'object' && j.unit === true)
		const hasFalse = json.some((j) => typeof j === 'object' && j.unit === false)
		return hasTrue && hasFalse
	},
	isNull: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		return json.unit === null
	},
	isUndefined: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		return json.unit === 'undefined'
	},
	isVoid: () => false, // ArkType doesn't have void
	isAny: () => false, // ArkType doesn't have any
	isUnknown: (s) => {
		// ArkType unknown is empty intersection {}
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		return Object.keys(json).length === 0
	},
	isNever: (s) => {
		// ArkType never is empty union []
		const json = getJson(s)
		return Array.isArray(json) && json.length === 0
	},
	isObject: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		return json.domain === 'object' || 'required' in json || 'optional' in json
	},
	isArray: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		// Array has sequence and proto=Array, but not a tuple (no exactLength or prefix-only)
		if (json.proto !== 'Array') return false
		if (!json.sequence) return false
		if (json.exactLength !== undefined) return false // tuple
		const seq = json.sequence
		if (typeof seq === 'object' && 'prefix' in seq && !('variadic' in seq)) return false // tuple
		return true
	},
	isUnion: (s) => {
		// Union is array, but not boolean (which is true|false)
		if (!isUnionJson(s)) return false
		const json = getJson(s) as ArkJsonObject[]
		// Exclude boolean representation
		if (json.length === 2) {
			const hasTrue = json.some((j) => typeof j === 'object' && j.unit === true)
			const hasFalse = json.some((j) => typeof j === 'object' && j.unit === false)
			if (hasTrue && hasFalse) return false
		}
		return json.length > 0
	},
	isLiteral: (s) => isUnit(s),
	isEnum: () => false, // ArkType doesn't have enum
	isOptional: () => false, // Handled at object property level
	isNullable: () => false, // ArkType uses union for nullable
	isTuple: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		if (json.proto !== 'Array') return false
		// Tuple has exactLength or prefix-only sequence
		if (json.exactLength !== undefined) return true
		const seq = json.sequence
		if (typeof seq === 'object' && 'prefix' in seq && !('variadic' in seq)) return true
		return false
	},
	isRecord: () => false, // ArkType handles this differently
	isMap: () => false,
	isSet: () => false,
	isIntersection: (_s) => {
		// ArkType represents intersection differently - mostly via merged objects
		// For now, don't expose as intersection
		return false
	},
	isLazy: () => false, // ArkType handles laziness internally
	isTransform: () => false, // Would need to check for morph
	isRefine: () => false,
	isDefault: () => false,
	isCatch: () => false,
	isBranded: () => false,
	isDate: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		return json.proto === 'Date'
	},
	isBigInt: (s) => hasDomain(s, 'bigint'),
	isSymbol: (s) => hasDomain(s, 'symbol'),
	isFunction: () => false,
	isPromise: () => false,
	isInstanceOf: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return false
		return 'proto' in json && json.proto !== 'Array'
	},

	// ============ Unwrap ============
	unwrap: () => null, // ArkType doesn't have wrapper types like optional

	// ============ Extract ============
	getObjectEntries: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return []
		const entries: [string, unknown][] = []
		// Required properties
		if (json.required) {
			for (const prop of json.required) {
				entries.push([prop.key, { _arkJson: prop.value }])
			}
		}
		// Optional properties - wrap with marker
		if (json.optional) {
			for (const prop of json.optional) {
				entries.push([prop.key, { _arkJson: prop.value, _optional: true }])
			}
		}
		return entries
	},

	getArrayElement: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return null
		const seq = json.sequence
		if (!seq) return null
		if (typeof seq === 'string' || (typeof seq === 'object' && !('prefix' in seq))) {
			return { _arkJson: typeof seq === 'string' ? seq : seq }
		}
		if (typeof seq === 'object' && 'variadic' in seq) {
			return { _arkJson: seq.variadic }
		}
		return null
	},

	getUnionOptions: (s) => {
		const json = getJson(s)
		if (!Array.isArray(json)) return []
		return json.map((j) => ({ _arkJson: j }))
	},

	getLiteralValue: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return undefined
		if ('unit' in json) {
			// Handle special cases
			if (json.unit === 'undefined') return undefined
			return json.unit
		}
		return undefined
	},

	getEnumValues: () => [],

	getTupleItems: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return []
		const seq = json.sequence
		if (!seq || typeof seq !== 'object' || !('prefix' in seq)) return []
		return (seq.prefix ?? []).map((j) => ({ _arkJson: j }))
	},

	getRecordKeyType: () => null,
	getRecordValueType: () => null,
	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,
	getIntersectionSchemas: () => [],

	getPromiseInner: () => null,

	getInstanceOfClass: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return null
		return json.proto ?? null
	},

	// ============ Constraints ============
	getConstraints: (s) => {
		const json = getJson(s)
		if (!json || Array.isArray(json) || typeof json === 'string') return null

		const result: SchemaConstraints = {}

		if (json.minLength !== undefined) result.minLength = json.minLength
		if (json.maxLength !== undefined) result.maxLength = json.maxLength
		if (json.min !== undefined) result.min = json.min
		if (json.max !== undefined) result.max = json.max

		// Pattern - take first one
		if (json.pattern && json.pattern.length > 0 && json.pattern[0]) {
			result.pattern = json.pattern[0].rule
		}

		// Format from meta
		if (json.meta?.format) {
			result.format = json.meta.format
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => {
		if (!isArkType(s)) return undefined
		return s.description
	},

	getTitle: () => undefined,

	getDefault: () => undefined,

	getExamples: () => undefined,

	isDeprecated: () => false,

	// ============ Validation ============
	validate: (s, data) =>
		withCallable(s, data) ?? { success: false, issues: [{ message: 'Invalid ArkType schema' }] },
	validateAsync: async (s, data) =>
		withCallable(s, data) ?? { success: false, issues: [{ message: 'Invalid ArkType schema' }] },
})

// Custom transformer for ArkType since it uses json property directly
export function arkTypeToJsonSchema(schema: unknown): unknown {
	if (!isArkType(schema)) {
		throw new Error('Not an ArkType schema')
	}

	return transformArkJson(schema.json)
}

// JSON Schema result type for better typing
interface JsonSchemaResult {
	type?: string
	const?: unknown
	not?: object
	anyOf?: unknown[]
	allOf?: unknown[]
	items?: unknown
	prefixItems?: unknown[]
	properties?: Record<string, unknown>
	required?: string[]
	minLength?: number
	maxLength?: number
	minimum?: number
	maximum?: number
	pattern?: string
	format?: string
	description?: string
	minItems?: number
	maxItems?: number
}

function transformArkJson(json: ArkJson): JsonSchemaResult {
	// Handle string references
	if (typeof json === 'string') {
		switch (json) {
			case 'string':
				return { type: 'string' }
			case 'number':
				return { type: 'number' }
			case 'boolean':
				return { type: 'boolean' }
			case 'bigint':
				return { type: 'integer' }
			default:
				return {}
		}
	}

	// Handle union (array)
	if (Array.isArray(json)) {
		if (json.length === 0) {
			return { not: {} } // never
		}
		// Check for boolean
		if (json.length === 2) {
			const hasTrue = json.some((j) => typeof j === 'object' && j.unit === true)
			const hasFalse = json.some((j) => typeof j === 'object' && j.unit === false)
			if (hasTrue && hasFalse) {
				return { type: 'boolean' }
			}
		}
		return {
			anyOf: json.map((j) => transformArkJson(j)),
		}
	}

	// Handle object
	const result: JsonSchemaResult = {}

	// Domain
	if (json.domain) {
		switch (json.domain) {
			case 'string':
				result.type = 'string'
				break
			case 'number':
				result.type = 'number'
				break
			case 'bigint':
				result.type = 'integer'
				break
			case 'object':
				result.type = 'object'
				break
			case 'symbol':
				// Can't represent in JSON Schema
				break
		}
	}

	// Unit (literal)
	if ('unit' in json) {
		if (json.unit === null) {
			return { type: 'null' }
		}
		if (json.unit === 'undefined') {
			return { not: {} }
		}
		return { const: json.unit }
	}

	// Proto (class instance)
	if (json.proto) {
		if (json.proto === 'Date') {
			return { type: 'string', format: 'date-time' }
		}
		if (json.proto === 'Array') {
			// Handle array/tuple
			if (json.sequence) {
				const seq = json.sequence
				if (typeof seq === 'string') {
					// String reference
					const items = transformArkJson(seq)
					return { type: 'array', items }
				}
				if (!('prefix' in seq)) {
					// Regular array with object sequence
					const items = transformArkJson(seq as ArkJson)
					return { type: 'array', items }
				}
				// Tuple with prefix
				return {
					type: 'array',
					prefixItems: (seq.prefix ?? []).map((j) => transformArkJson(j)),
					minItems: seq.prefix?.length ?? 0,
					maxItems: json.exactLength ?? seq.prefix?.length,
				}
			}
		}
		// Other proto - can't fully represent
		return {}
	}

	// Object properties
	if (json.required || json.optional) {
		result.type = 'object'
		const properties: Record<string, unknown> = {}
		const required: string[] = []

		for (const prop of json.required ?? []) {
			properties[prop.key] = transformArkJson(prop.value)
			required.push(prop.key)
		}

		for (const prop of json.optional ?? []) {
			properties[prop.key] = transformArkJson(prop.value)
		}

		if (Object.keys(properties).length > 0) {
			result.properties = properties
		}
		if (required.length > 0) {
			result.required = required
		}
	}

	// Constraints
	if (json.minLength !== undefined) result.minLength = json.minLength
	if (json.maxLength !== undefined) result.maxLength = json.maxLength
	if (json.min !== undefined) result.minimum = json.min
	if (json.max !== undefined) result.maximum = json.max

	// Pattern
	if (json.pattern && json.pattern.length > 0 && json.pattern[0]) {
		result.pattern = json.pattern[0].rule
	}

	// Format
	if (json.meta?.format) {
		result.format = json.meta.format
	}

	// Description
	if (json.meta?.description) {
		result.description = json.meta.description
	}

	return result
}
