/**
 * io-ts Transformer Adapter
 *
 * Full introspection for JSON Schema conversion.
 * Use this when you need to convert schemas to JSON Schema.
 */

import { defineTransformerAdapter } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** io-ts codec shape for type inference */
export interface IoTsSchema {
	_tag: string
	decode: (i: unknown) => unknown
	encode: (a: unknown) => unknown
	name?: string
	props?: Record<string, unknown>
	type?: unknown
	types?: unknown[]
	value?: unknown
	domain?: unknown
	codomain?: unknown
	runDefinition?: () => unknown
}

// Type guard
const isIoTsSchema = (s: unknown): s is IoTsSchema => {
	if (!s || typeof s !== 'object') return false
	return '_tag' in s && 'decode' in s && 'encode' in s
}

// Helpers
const getTag = (s: IoTsSchema): string => s._tag
const getName = (s: IoTsSchema): string | null => s.name ?? null

// ============================================================================
// Transformer Adapter
// ============================================================================

export const ioTsTransformer = defineTransformerAdapter<IoTsSchema>({
	vendor: 'io-ts',
	match: isIoTsSchema,

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
		const tag = getTag(s)

		// RefinementType, BrandType have type property
		if (tag === 'RefinementType' || tag === 'BrandType') {
			return s.type ?? null
		}

		// RecursiveType has runDefinition
		if (tag === 'RecursiveType') {
			return typeof s.runDefinition === 'function' ? s.runDefinition() : null
		}

		// ExactType, StrictType have props wrapped
		if (tag === 'ExactType' || tag === 'StrictType') {
			return s.type ?? null
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		const tag = getTag(s)
		if (tag !== 'InterfaceType' && tag !== 'PartialType') return []
		return s.props ? Object.entries(s.props) : []
	},

	getArrayElement: (s) => {
		const tag = getTag(s)
		if (tag !== 'ArrayType' && tag !== 'ReadonlyArrayType') return null
		return s.type ?? null
	},

	getUnionOptions: (s) => {
		if (getTag(s) !== 'UnionType') return []
		return s.types ?? []
	},

	getLiteralValue: (s) => {
		if (getTag(s) !== 'LiteralType') return undefined
		return s.value
	},

	getEnumValues: () => [],

	getTupleItems: (s) => {
		if (getTag(s) !== 'TupleType') return []
		return s.types ?? []
	},

	getRecordKeyType: (s) => {
		if (getTag(s) !== 'DictionaryType') return null
		return s.domain ?? null
	},

	getRecordValueType: (s) => {
		if (getTag(s) !== 'DictionaryType') return null
		return s.codomain ?? null
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,

	getIntersectionSchemas: (s) => {
		if (getTag(s) !== 'IntersectionType') return []
		return s.types ?? []
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
})
