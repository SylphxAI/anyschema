/**
 * Zod v4 Adapter
 *
 * Duck-typed adapter for Zod v4 schemas.
 * Detects via `_zod` property.
 */

import { withSafeParse, withSafeParseAsync } from '../helpers.js'
import { defineAdapter, type SchemaConstraints } from '../types.js'

// ============================================================================
// Schema Type (exported for type inference)
// ============================================================================

/** Zod v4 schema shape for type inference */
export interface ZodV4Schema {
	_zod: { def: ZodV4Def }
}

// Zod v4 internal def type
interface ZodV4Def {
	type?: string
	innerType?: unknown
	in?: unknown
	getter?: () => unknown
	shape?: Record<string, unknown>
	element?: unknown
	options?: unknown[]
	values?: unknown[]
	entries?: Record<string, unknown>
	items?: unknown[]
	keyType?: unknown
	valueType?: unknown
	left?: unknown
	right?: unknown
	cls?: unknown
	checks?: Array<{ _zod?: { def?: ZodV4CheckDef } }>
	defaultValue?: unknown
}

interface ZodV4CheckDef {
	check?: string
	minimum?: number
	maximum?: number
	pattern?: unknown
	format?: string
}

// Type guard
const isZodV4 = (s: unknown): s is ZodV4Schema => {
	return s != null && typeof s === 'object' && '_zod' in s
}

// Helper to get def
const getDef = (s: ZodV4Schema): ZodV4Def => s._zod.def

// Helper to get type
const getType = (s: ZodV4Schema): string | null => getDef(s)?.type ?? null

export const zodV4Adapter = defineAdapter<ZodV4Schema>({
	vendor: 'zod',

	match: isZodV4,

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
	isEnum: (s) => getType(s) === 'enum',
	isOptional: (s) => getType(s) === 'optional',
	isNullable: (s) => getType(s) === 'nullable',
	isTuple: (s) => getType(s) === 'tuple',
	isRecord: (s) => getType(s) === 'record',
	isMap: (s) => getType(s) === 'map',
	isSet: (s) => getType(s) === 'set',
	isIntersection: (s) => getType(s) === 'intersection',
	isLazy: (s) => getType(s) === 'lazy',
	isTransform: (s) => getType(s) === 'pipe' || getType(s) === 'transform',
	isRefine: (s) => {
		// Refine adds checks array
		const def = getDef(s)
		return !!(def?.checks && Array.isArray(def.checks) && def.checks.length > 0)
	},
	isDefault: (s) => getType(s) === 'default',
	isCatch: (s) => getType(s) === 'catch',
	isBranded: (s) => getType(s) === 'branded',
	isDate: (s) => getType(s) === 'date',
	isBigInt: (s) => getType(s) === 'bigint',
	isSymbol: (s) => getType(s) === 'symbol',
	isFunction: (s) => getType(s) === 'function',
	isPromise: (s) => getType(s) === 'promise',
	isInstanceOf: (s) => getType(s) === 'instanceof',

	// ============ Unwrap ============
	unwrap: (s) => {
		const def = getDef(s)
		if (!def) return null

		// optional, nullable, default, catch, branded - have innerType
		if (def.innerType) return def.innerType

		// pipe (transform) - has in/out
		if (def.type === 'pipe' && def.in) return def.in

		// lazy - call getter
		if (def.type === 'lazy' && typeof def.getter === 'function') {
			return (def.getter as () => unknown)()
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		const def = getDef(s)
		if (def?.type !== 'object') return []
		const shape = def.shape as Record<string, unknown> | undefined
		return shape ? Object.entries(shape) : []
	},

	getArrayElement: (s) => {
		const def = getDef(s)
		return def?.element ?? null
	},

	getUnionOptions: (s) => {
		const def = getDef(s)
		return (def?.options as unknown[]) ?? []
	},

	getLiteralValue: (s) => {
		const def = getDef(s)
		// Zod v4 literal uses `values` array
		const values = def?.values as unknown[] | undefined
		return values?.[0]
	},

	getEnumValues: (s) => {
		// Zod v4 enum has `options` on schema, or `entries` in def
		const schema = s as { options?: unknown[] }
		if (Array.isArray(schema.options)) {
			return schema.options
		}
		const def = getDef(s)
		const entries = def?.entries as Record<string, unknown> | undefined
		return entries ? Object.values(entries) : []
	},

	getTupleItems: (s) => {
		const def = getDef(s)
		return (def?.items as unknown[]) ?? []
	},

	getRecordKeyType: (s) => {
		const def = getDef(s)
		return def?.keyType ?? null
	},

	getRecordValueType: (s) => {
		const def = getDef(s)
		return def?.valueType ?? null
	},

	getMapKeyType: (s) => {
		const def = getDef(s)
		return def?.keyType ?? null
	},

	getMapValueType: (s) => {
		const def = getDef(s)
		return def?.valueType ?? null
	},

	getSetElement: (s) => {
		const def = getDef(s)
		return def?.element ?? null
	},

	getIntersectionSchemas: (s) => {
		const def = getDef(s)
		if (def?.type !== 'intersection') return []
		const result: unknown[] = []
		if (def.left) result.push(def.left)
		if (def.right) result.push(def.right)
		return result
	},

	getPromiseInner: (s) => {
		const def = getDef(s)
		return def?.innerType ?? null
	},

	getInstanceOfClass: (s) => {
		const def = getDef(s)
		return def?.cls ?? null
	},

	// ============ Constraints ============
	getConstraints: (s) => {
		const def = getDef(s)
		if (!def) return null

		const result: SchemaConstraints = {}

		// Check checks array
		const checks = def.checks
		if (checks && Array.isArray(checks)) {
			for (const check of checks) {
				const checkDef = check?._zod?.def
				if (!checkDef) continue

				const checkType = checkDef.check
				switch (checkType) {
					case 'min_length':
						if (checkDef.minimum !== undefined) result.minLength = checkDef.minimum
						break
					case 'max_length':
						if (checkDef.maximum !== undefined) result.maxLength = checkDef.maximum
						break
					case 'regex':
						if (checkDef.pattern !== undefined) result.pattern = String(checkDef.pattern)
						break
					case 'string_format':
						if (checkDef.format) result.format = checkDef.format
						break
					case 'min':
					case 'gte':
						if (checkDef.minimum !== undefined) result.min = checkDef.minimum
						break
					case 'max':
					case 'lte':
						if (checkDef.maximum !== undefined) result.max = checkDef.maximum
						break
				}
			}
		}

		// Also check direct properties on number schemas
		const schema = s as {
			minValue?: number
			maxValue?: number
			minLength?: number
			maxLength?: number
			format?: string
		}
		if (typeof schema.minValue === 'number' && schema.minValue !== Number.NEGATIVE_INFINITY) {
			result.min = schema.minValue
		}
		if (typeof schema.maxValue === 'number' && schema.maxValue !== Number.POSITIVE_INFINITY) {
			result.max = schema.maxValue
		}
		if (typeof schema.minLength === 'number') {
			result.minLength = schema.minLength
		}
		if (typeof schema.maxLength === 'number') {
			result.maxLength = schema.maxLength
		}
		if (schema.format) {
			result.format = schema.format
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => {
		// Zod v4 uses a getter
		if (s && typeof s === 'object' && 'description' in s) {
			const desc = (s as { description?: string }).description
			return typeof desc === 'string' ? desc : undefined
		}
		return undefined
	},

	getTitle: () => undefined, // Zod doesn't have title

	getDefault: (s) => {
		const def = getDef(s)
		if (def?.type !== 'default') return undefined
		// Zod v4 defaultValue is a getter that returns the value directly
		return def.defaultValue
	},

	getExamples: () => undefined, // Zod doesn't have examples

	isDeprecated: () => false, // Zod doesn't have deprecated

	// ============ Validation ============
	validate: (s, data) =>
		withSafeParse(s, data) ?? { success: false, issues: [{ message: 'Invalid Zod v4 schema' }] },
	validateAsync: async (s, data) =>
		(await withSafeParseAsync(s, data)) ??
		withSafeParse(s, data) ?? { success: false, issues: [{ message: 'Invalid Zod v4 schema' }] },
})
