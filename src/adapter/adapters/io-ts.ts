/**
 * io-ts Adapter
 *
 * Duck-typed adapter for io-ts codecs.
 * Detects via `_tag` + `decode` + `encode` properties.
 */

import { withDecode } from '../helpers.js'
import { defineAdapter } from '../types.js'

const isIoTs = (s: unknown): boolean => {
	if (!s || typeof s !== 'object') return false
	return '_tag' in s && 'decode' in s && 'encode' in s
}

const getTag = (s: unknown): string | null => {
	if (!isIoTs(s)) return null
	return (s as { _tag?: string })._tag ?? null
}

const getName = (s: unknown): string | null => {
	if (!isIoTs(s)) return null
	return (s as { name?: string }).name ?? null
}

export const ioTsAdapter = defineAdapter({
	vendor: 'io-ts',

	match: isIoTs,

	// ============ Type Detection ============
	isString: (s) => getTag(s) === 'StringType' || getName(s) === 'string',
	isNumber: (s) => getTag(s) === 'NumberType' || getName(s) === 'number',
	isBoolean: (s) => getTag(s) === 'BooleanType' || getName(s) === 'boolean',
	isNull: (s) => getTag(s) === 'NullType' || getName(s) === 'null',
	isUndefined: (s) => getTag(s) === 'UndefinedType' || getName(s) === 'undefined',
	isVoid: (s) => getTag(s) === 'VoidType' || getName(s) === 'void',
	isAny: (s) => getTag(s) === 'AnyType',
	isUnknown: (s) => getTag(s) === 'UnknownType',
	isNever: (s) => getTag(s) === 'NeverType',
	isObject: (s) =>
		getTag(s) === 'InterfaceType' ||
		getTag(s) === 'PartialType' ||
		getTag(s) === 'ExactType' ||
		getTag(s) === 'StrictType',
	isArray: (s) => getTag(s) === 'ArrayType' || getTag(s) === 'ReadonlyArrayType',
	isUnion: (s) => getTag(s) === 'UnionType',
	isLiteral: (s) => getTag(s) === 'LiteralType' || getTag(s) === 'KeyofType',
	isEnum: () => false, // io-ts uses union of literals
	isOptional: () => false, // io-ts uses union with undefined
	isNullable: () => false, // io-ts uses union with null
	isTuple: (s) => getTag(s) === 'TupleType',
	isRecord: (s) => getTag(s) === 'DictionaryType',
	isMap: () => false,
	isSet: () => false,
	isIntersection: (s) => getTag(s) === 'IntersectionType',
	isLazy: (s) => getTag(s) === 'RecursiveType',
	isTransform: () => false, // io-ts doesn't have transforms
	isRefine: (s) => getTag(s) === 'RefinementType',
	isDefault: () => false,
	isCatch: () => false,
	isBranded: (s) => getTag(s) === 'BrandType',
	isDate: () => false, // io-ts-types has DateFromISOString
	isBigInt: (s) => getTag(s) === 'BigIntType',
	isSymbol: () => false,
	isFunction: (s) => getTag(s) === 'FunctionType',
	isPromise: () => false,
	isInstanceOf: () => false,

	// ============ Unwrap ============
	unwrap: (s) => {
		if (!isIoTs(s)) return null
		const tag = getTag(s)

		// RefinementType, BrandType have type property
		if (tag === 'RefinementType' || tag === 'BrandType') {
			return (s as { type?: unknown }).type ?? null
		}

		// RecursiveType has runDefinition
		if (tag === 'RecursiveType') {
			const runDef = (s as { runDefinition?: () => unknown }).runDefinition
			return typeof runDef === 'function' ? runDef() : null
		}

		// ExactType, StrictType have props wrapped
		if (tag === 'ExactType' || tag === 'StrictType') {
			return (s as { type?: unknown }).type ?? null
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		const tag = getTag(s)
		if (tag !== 'InterfaceType' && tag !== 'PartialType') return []

		const props = (s as { props?: Record<string, unknown> }).props
		return props ? Object.entries(props) : []
	},

	getArrayElement: (s) => {
		const tag = getTag(s)
		if (tag !== 'ArrayType' && tag !== 'ReadonlyArrayType') return null
		return (s as { type?: unknown }).type ?? null
	},

	getUnionOptions: (s) => {
		if (getTag(s) !== 'UnionType') return []
		return (s as { types?: unknown[] }).types ?? []
	},

	getLiteralValue: (s) => {
		if (getTag(s) !== 'LiteralType') return undefined
		return (s as { value?: unknown }).value
	},

	getEnumValues: () => [],

	getTupleItems: (s) => {
		if (getTag(s) !== 'TupleType') return []
		return (s as { types?: unknown[] }).types ?? []
	},

	getRecordKeyType: (s) => {
		if (getTag(s) !== 'DictionaryType') return null
		return (s as { domain?: unknown }).domain ?? null
	},

	getRecordValueType: (s) => {
		if (getTag(s) !== 'DictionaryType') return null
		return (s as { codomain?: unknown }).codomain ?? null
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,

	getIntersectionSchemas: (s) => {
		if (getTag(s) !== 'IntersectionType') return []
		return (s as { types?: unknown[] }).types ?? []
	},

	getPromiseInner: () => null,
	getInstanceOfClass: () => null,

	// ============ Constraints ============
	getConstraints: () => null, // io-ts doesn't have built-in constraints

	// ============ Metadata ============
	getDescription: () => undefined,
	getTitle: (s) => getName(s) ?? undefined,
	getDefault: () => undefined,
	getExamples: () => undefined,
	isDeprecated: () => false,

	// ============ Validation ============
	validate: (s, data) =>
		withDecode(s, data) ?? { success: false, issues: [{ message: 'Invalid io-ts codec' }] },

	validateAsync: async (s, data) => {
		// io-ts is sync only
		return withDecode(s, data) ?? { success: false, issues: [{ message: 'Invalid io-ts codec' }] }
	},
})
