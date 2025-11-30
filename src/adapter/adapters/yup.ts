/**
 * Yup Adapter
 *
 * Duck-typed adapter for Yup schemas.
 * Detects via `__isYupSchema__` property.
 */

import { withValidateSync } from '../helpers.js'
import { defineAdapter, type SchemaConstraints } from '../types.js'

// ============================================================================
// Schema Type (exported for type inference)
// ============================================================================

/** Yup schema shape for type inference */
export interface YupSchema {
	__isYupSchema__: true
	spec?: YupSpec
	fields?: Record<string, unknown>
	types?: unknown[]
	validate?: (data: unknown) => Promise<unknown>
	validateSync?: (data: unknown) => unknown
}

interface YupSpec {
	type?: string
	innerType?: unknown
	fields?: Record<string, unknown>
	subType?: unknown
	oneOf?: unknown[]
	notOneOf?: unknown[]
	tests?: Array<{ OPTIONS?: { name?: string; params?: Record<string, unknown> } }>
	nullable?: boolean
	optional?: boolean
	default?: unknown
	meta?: { title?: string; description?: string; examples?: unknown[]; deprecated?: boolean }
}

// Type guard
const isYupSchema = (s: unknown): s is YupSchema => {
	return s != null && typeof s === 'object' && '__isYupSchema__' in s && s.__isYupSchema__ === true
}

// Helper to get spec
const getSpec = (s: YupSchema): YupSpec | null => s.spec ?? null

// Helper to get type
const getType = (s: YupSchema): string | null => getSpec(s)?.type ?? null

export const yupAdapter = defineAdapter<YupSchema>({
	vendor: 'yup',

	match: isYupSchema,

	// ============ Type Detection ============
	isString: (s) => getType(s) === 'string',
	isNumber: (s) => getType(s) === 'number',
	isBoolean: (s) => getType(s) === 'boolean',
	isNull: () => false, // Yup doesn't have null type
	isUndefined: () => false,
	isVoid: () => false,
	isAny: () => false,
	isUnknown: () => false,
	isNever: () => false,
	isObject: (s) => getType(s) === 'object',
	isArray: (s) => getType(s) === 'array',
	isUnion: () => false, // Yup uses mixed().oneOf() instead
	isLiteral: () => false,
	isEnum: (s) => {
		const spec = getSpec(s)
		return Array.isArray(spec?.oneOf) && spec.oneOf.length > 0
	},
	isOptional: (s) => getSpec(s)?.optional === true,
	isNullable: (s) => getSpec(s)?.nullable === true,
	isTuple: (s) => getType(s) === 'tuple',
	isRecord: () => false, // Yup doesn't have record type
	isMap: () => false,
	isSet: () => false,
	isIntersection: () => false,
	isLazy: (s) => getType(s) === 'lazy',
	isTransform: () => false,
	isRefine: (s) => {
		const spec = getSpec(s)
		return Array.isArray(spec?.tests) && spec.tests.length > 0
	},
	isDefault: (s) => getSpec(s)?.default !== undefined,
	isCatch: () => false,
	isBranded: () => false,
	isDate: (s) => getType(s) === 'date',
	isBigInt: () => false,
	isSymbol: () => false,
	isFunction: () => false,
	isPromise: () => false,
	isInstanceOf: () => false,

	// ============ Unwrap ============
	unwrap: (s) => {
		const spec = getSpec(s)
		if (!spec) return null
		// innerType for array, nullable wrapper
		if (spec.innerType) return spec.innerType
		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getType(s) !== 'object') return []
		const spec = getSpec(s)
		const fields = spec?.fields ?? s.fields
		return fields ? Object.entries(fields) : []
	},

	getArrayElement: (s) => {
		const spec = getSpec(s)
		return spec?.innerType ?? spec?.subType ?? null
	},

	getUnionOptions: () => [],

	getLiteralValue: () => undefined,

	getEnumValues: (s) => {
		const spec = getSpec(s)
		return spec?.oneOf ?? []
	},

	getTupleItems: (s) => s.types ?? [],

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
		const spec = getSpec(s)
		if (!spec) return null

		const result: SchemaConstraints = {}
		const tests = spec.tests ?? []

		for (const test of tests) {
			const name = test.OPTIONS?.name
			const params = test.OPTIONS?.params ?? {}

			switch (name) {
				case 'min':
					if (getType(s) === 'string') result.minLength = params['min'] as number
					else if (getType(s) === 'number') result.min = params['min'] as number
					else if (getType(s) === 'array') result.min = params['min'] as number
					break
				case 'max':
					if (getType(s) === 'string') result.maxLength = params['max'] as number
					else if (getType(s) === 'number') result.max = params['max'] as number
					else if (getType(s) === 'array') result.max = params['max'] as number
					break
				case 'length':
					if (getType(s) === 'string') {
						result.minLength = params['length'] as number
						result.maxLength = params['length'] as number
					}
					break
				case 'matches':
					if (params['regex'] instanceof RegExp) {
						result.pattern = (params['regex'] as RegExp).source
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
			}
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => getSpec(s)?.meta?.description,
	getTitle: (s) => getSpec(s)?.meta?.title,
	getDefault: (s) => getSpec(s)?.default,
	getExamples: (s) => getSpec(s)?.meta?.examples,
	isDeprecated: (s) => getSpec(s)?.meta?.deprecated === true,

	// ============ Validation ============
	validate: (s, data) =>
		withValidateSync(s, data) ?? { success: false, issues: [{ message: 'Invalid Yup schema' }] },

	validateAsync: async (s, data) => {
		// Yup has validate() for async
		if (typeof s.validate !== 'function') {
			return { success: false, issues: [{ message: 'Invalid Yup schema' }] }
		}

		try {
			const result = await s.validate(data)
			return { success: true, data: result }
		} catch (error) {
			const yupError = error as { errors?: string[]; path?: string }
			return {
				success: false,
				issues: (yupError.errors ?? ['Validation failed']).map((msg) => ({
					message: msg,
					...(yupError.path ? { path: [yupError.path] } : {}),
				})),
			}
		}
	},
})
