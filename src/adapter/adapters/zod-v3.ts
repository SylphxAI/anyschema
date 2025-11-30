/**
 * Zod v3 Adapter
 *
 * Duck-typed adapter for Zod v3 schemas.
 * Detects via `_def.typeName` property.
 */

import { defineAdapter, type SchemaConstraints } from '../types.js'

// Zod v3 internal def type
interface ZodV3Def {
	typeName?: string
	innerType?: unknown
	type?: unknown
	schema?: unknown
	getter?: () => unknown
	shape?: Record<string, unknown> | (() => Record<string, unknown>)
	options?: unknown[]
	value?: unknown
	values?: unknown[] | Record<string, unknown>
	items?: unknown[]
	keyType?: unknown
	valueType?: unknown
	left?: unknown
	right?: unknown
	cls?: unknown
	checks?: Array<ZodV3Check>
	minLength?: { value: number }
	maxLength?: { value: number }
	defaultValue?: () => unknown
	description?: string
	effect?: { type: string }
}

interface ZodV3Check {
	kind: string
	value?: unknown
	inclusive?: boolean
	regex?: RegExp
}

// Helper to get _def
const getDef = (s: unknown): ZodV3Def | null => {
	if (s && typeof s === 'object' && '_def' in s) {
		return (s as { _def: ZodV3Def })._def
	}
	return null
}

// Helper to get typeName
const getTypeName = (s: unknown): string | null => {
	const def = getDef(s)
	return def?.typeName ?? null
}

// Check if this is Zod v3 (has _def.typeName but not _zod)
const isZodV3 = (s: unknown): boolean => {
	if (!s || typeof s !== 'object') return false
	// Zod v4 has _zod property, v3 doesn't
	if ('_zod' in s) return false
	const def = getDef(s)
	return typeof def?.typeName === 'string'
}

export const zodV3Adapter = defineAdapter({
	vendor: 'zod',

	match: isZodV3,

	// ============ Type Detection ============
	isString: (s) => getTypeName(s) === 'ZodString',
	isNumber: (s) => getTypeName(s) === 'ZodNumber',
	isBoolean: (s) => getTypeName(s) === 'ZodBoolean',
	isNull: (s) => getTypeName(s) === 'ZodNull',
	isUndefined: (s) => getTypeName(s) === 'ZodUndefined',
	isVoid: (s) => getTypeName(s) === 'ZodVoid',
	isAny: (s) => getTypeName(s) === 'ZodAny',
	isUnknown: (s) => getTypeName(s) === 'ZodUnknown',
	isNever: (s) => getTypeName(s) === 'ZodNever',
	isObject: (s) => getTypeName(s) === 'ZodObject',
	isArray: (s) => getTypeName(s) === 'ZodArray',
	isUnion: (s) => getTypeName(s) === 'ZodUnion',
	isLiteral: (s) => getTypeName(s) === 'ZodLiteral',
	isEnum: (s) => getTypeName(s) === 'ZodEnum' || getTypeName(s) === 'ZodNativeEnum',
	isOptional: (s) => getTypeName(s) === 'ZodOptional',
	isNullable: (s) => getTypeName(s) === 'ZodNullable',
	isTuple: (s) => getTypeName(s) === 'ZodTuple',
	isRecord: (s) => getTypeName(s) === 'ZodRecord',
	isMap: (s) => getTypeName(s) === 'ZodMap',
	isSet: (s) => getTypeName(s) === 'ZodSet',
	isIntersection: (s) => getTypeName(s) === 'ZodIntersection',
	isLazy: (s) => getTypeName(s) === 'ZodLazy',
	isTransform: (s) => {
		const def = getDef(s)
		return getTypeName(s) === 'ZodEffects' && def?.effect?.type === 'transform'
	},
	isRefine: (s) => {
		const def = getDef(s)
		return getTypeName(s) === 'ZodEffects' && def?.effect?.type === 'refinement'
	},
	isDefault: (s) => getTypeName(s) === 'ZodDefault',
	isCatch: (s) => getTypeName(s) === 'ZodCatch',
	isBranded: (s) => getTypeName(s) === 'ZodBranded',
	isDate: (s) => getTypeName(s) === 'ZodDate',
	isBigInt: (s) => getTypeName(s) === 'ZodBigInt',
	isSymbol: (s) => getTypeName(s) === 'ZodSymbol',
	isFunction: (s) => getTypeName(s) === 'ZodFunction',
	isPromise: (s) => getTypeName(s) === 'ZodPromise',
	isInstanceOf: (s) => getTypeName(s) === 'ZodInstanceOf',

	// ============ Unwrap ============
	unwrap: (s) => {
		const def = getDef(s)
		if (!def) return null

		// optional, nullable, default, catch - have innerType
		if (def.innerType) return def.innerType

		// branded - has type
		if (def.type && getTypeName(s) === 'ZodBranded') return def.type

		// effects (transform/refine) - has schema
		if (def.schema && getTypeName(s) === 'ZodEffects') return def.schema

		// lazy - call getter
		if (getTypeName(s) === 'ZodLazy' && typeof def.getter === 'function') {
			return (def.getter as () => unknown)()
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		const def = getDef(s)
		if (getTypeName(s) !== 'ZodObject') return []
		const shape = def?.shape
		// shape can be a function in some cases
		const resolvedShape = typeof shape === 'function' ? shape() : shape
		return resolvedShape ? Object.entries(resolvedShape) : []
	},

	getArrayElement: (s) => {
		const def = getDef(s)
		// Zod v3 array uses `type` for element type
		return def?.type ?? null
	},

	getUnionOptions: (s) => {
		const def = getDef(s)
		return (def?.options as unknown[]) ?? []
	},

	getLiteralValue: (s) => {
		const def = getDef(s)
		return def?.value
	},

	getEnumValues: (s) => {
		const def = getDef(s)
		// ZodEnum uses `values`, ZodNativeEnum uses `values` (object)
		const values = def?.values
		if (Array.isArray(values)) return values
		if (values && typeof values === 'object') return Object.values(values)
		return []
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
		return def?.valueType ?? null
	},

	getIntersectionSchemas: (s) => {
		const def = getDef(s)
		if (getTypeName(s) !== 'ZodIntersection') return []
		const result: unknown[] = []
		if (def?.left) result.push(def.left)
		if (def?.right) result.push(def.right)
		return result
	},

	getPromiseInner: (s) => {
		const def = getDef(s)
		return def?.type ?? null
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

		// Check checks array (Zod v3 style: { kind: 'min', value: 3 })
		const checks = def.checks
		if (checks && Array.isArray(checks)) {
			for (const check of checks) {
				switch (check.kind) {
					// String checks
					case 'min':
						if (getTypeName(s) === 'ZodString') {
							result.minLength = check.value as number
						} else if (getTypeName(s) === 'ZodNumber') {
							result.min = check.value as number
						}
						break
					case 'max':
						if (getTypeName(s) === 'ZodString') {
							result.maxLength = check.value as number
						} else if (getTypeName(s) === 'ZodNumber') {
							result.max = check.value as number
						}
						break
					case 'length':
						result.minLength = check.value as number
						result.maxLength = check.value as number
						break
					case 'regex':
						if (check.regex) {
							result.pattern = check.regex.source
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
					case 'datetime':
						result.format = 'date-time'
						break
				}
			}
		}

		// Array constraints
		if (getTypeName(s) === 'ZodArray') {
			if (typeof def.minLength?.value === 'number') {
				result.min = def.minLength.value
			}
			if (typeof def.maxLength?.value === 'number') {
				result.max = def.maxLength.value
			}
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => {
		// Zod v3 stores description in _def.description or on the schema.description
		const def = getDef(s)
		if (typeof def?.description === 'string') return def.description
		if (s && typeof s === 'object' && 'description' in s) {
			const desc = (s as { description?: string }).description
			return typeof desc === 'string' ? desc : undefined
		}
		return undefined
	},

	getTitle: () => undefined, // Zod doesn't have title

	getDefault: (s) => {
		const def = getDef(s)
		if (getTypeName(s) !== 'ZodDefault') return undefined
		const getter = def?.defaultValue as (() => unknown) | undefined
		return typeof getter === 'function' ? getter() : undefined
	},

	getExamples: () => undefined, // Zod doesn't have examples

	isDeprecated: () => false, // Zod doesn't have deprecated

	// ============ Validation ============
	validate: (s, data) => {
		const schema = s as {
			safeParse?: (d: unknown) => {
				success: boolean
				data?: unknown
				error?: { issues: Array<{ message: string; path: (string | number)[] }> }
			}
		}
		if (typeof schema.safeParse !== 'function') {
			return { success: false, issues: [{ message: 'Schema does not have safeParse method' }] }
		}

		const result = schema.safeParse(data)
		if (result.success) {
			return { success: true, data: result.data }
		}

		return {
			success: false,
			issues: result.error?.issues.map((i) => ({
				message: i.message,
				path: i.path,
			})) ?? [{ message: 'Validation failed' }],
		}
	},

	validateAsync: async (s, data) => {
		const schema = s as {
			safeParseAsync?: (d: unknown) => Promise<{
				success: boolean
				data?: unknown
				error?: { issues: Array<{ message: string; path: (string | number)[] }> }
			}>
		}
		if (typeof schema.safeParseAsync !== 'function') {
			return { success: false, issues: [{ message: 'Schema does not have safeParseAsync method' }] }
		}

		const result = await schema.safeParseAsync(data)
		if (result.success) {
			return { success: true, data: result.data }
		}

		return {
			success: false,
			issues: result.error?.issues.map((i) => ({
				message: i.message,
				path: i.path,
			})) ?? [{ message: 'Validation failed' }],
		}
	},
})
