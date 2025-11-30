/**
 * Schema Adapter Types
 *
 * Split into ValidatorAdapter and TransformerAdapter for tree-shaking.
 */

import type { ValidationResult } from '../types.js'

// ============================================================================
// Constraints
// ============================================================================

export interface SchemaConstraints {
	min?: number
	max?: number
	minLength?: number
	maxLength?: number
	pattern?: string
	format?: string
}

// ============================================================================
// Validator Adapter
// ============================================================================

export interface ValidatorAdapter<TSchema = unknown> {
	readonly vendor: string
	match(schema: unknown): schema is TSchema
	validate(schema: TSchema, data: unknown): ValidationResult<unknown>
	validateAsync?(schema: TSchema, data: unknown): Promise<ValidationResult<unknown>>
}

// ============================================================================
// Transformer Adapter
// ============================================================================

export interface TransformerAdapter<TSchema = unknown> {
	readonly vendor: string
	match(schema: unknown): schema is TSchema

	// Type Detection
	isString(schema: TSchema): boolean
	isNumber(schema: TSchema): boolean
	isBoolean(schema: TSchema): boolean
	isNull(schema: TSchema): boolean
	isUndefined(schema: TSchema): boolean
	isVoid(schema: TSchema): boolean
	isAny(schema: TSchema): boolean
	isUnknown(schema: TSchema): boolean
	isNever(schema: TSchema): boolean
	isObject(schema: TSchema): boolean
	isArray(schema: TSchema): boolean
	isUnion(schema: TSchema): boolean
	isLiteral(schema: TSchema): boolean
	isEnum(schema: TSchema): boolean
	isOptional(schema: TSchema): boolean
	isNullable(schema: TSchema): boolean
	isTuple(schema: TSchema): boolean
	isRecord(schema: TSchema): boolean
	isMap(schema: TSchema): boolean
	isSet(schema: TSchema): boolean
	isIntersection(schema: TSchema): boolean
	isLazy(schema: TSchema): boolean
	isTransform(schema: TSchema): boolean
	isRefine(schema: TSchema): boolean
	isDefault(schema: TSchema): boolean
	isCatch(schema: TSchema): boolean
	isBranded(schema: TSchema): boolean
	isDate(schema: TSchema): boolean
	isBigInt(schema: TSchema): boolean
	isSymbol(schema: TSchema): boolean
	isFunction(schema: TSchema): boolean
	isPromise(schema: TSchema): boolean
	isInstanceOf(schema: TSchema): boolean

	// Unwrap
	unwrap(schema: TSchema): unknown | null

	// Extract
	getObjectEntries(schema: TSchema): [string, unknown][]
	getArrayElement(schema: TSchema): unknown
	getUnionOptions(schema: TSchema): unknown[]
	getLiteralValue(schema: TSchema): unknown
	getEnumValues(schema: TSchema): unknown[]
	getTupleItems(schema: TSchema): unknown[]
	getRecordKeyType(schema: TSchema): unknown | null
	getRecordValueType(schema: TSchema): unknown
	getMapKeyType(schema: TSchema): unknown
	getMapValueType(schema: TSchema): unknown
	getSetElement(schema: TSchema): unknown
	getIntersectionSchemas(schema: TSchema): unknown[]
	getPromiseInner(schema: TSchema): unknown
	getInstanceOfClass(schema: TSchema): unknown

	// Constraints
	getConstraints(schema: TSchema): SchemaConstraints | null

	// Metadata
	getDescription(schema: TSchema): string | undefined
	getTitle(schema: TSchema): string | undefined
	getDefault(schema: TSchema): unknown
	getExamples(schema: TSchema): unknown[] | undefined
	isDeprecated(schema: TSchema): boolean
}

// ============================================================================
// Partial Adapters (for easier implementation)
// ============================================================================

export type PartialValidatorAdapter<TSchema = unknown> = ValidatorAdapter<TSchema>

export type PartialTransformerAdapter<TSchema = unknown> = {
	readonly vendor: string
	match(schema: unknown): schema is TSchema
} & Partial<Omit<TransformerAdapter<TSchema>, 'vendor' | 'match'>>

// ============================================================================
// Type Inference
// ============================================================================

export type InferValidatorSchema<T> = T extends ValidatorAdapter<infer S> ? S : never
export type InferTransformerSchema<T> = T extends TransformerAdapter<infer S> ? S : never

export type InferValidatorSchemas<T extends readonly ValidatorAdapter<any>[]> =
	InferValidatorSchema<T[number]>

export type InferTransformerSchemas<T extends readonly TransformerAdapter<any>[]> =
	InferTransformerSchema<T[number]>

// ============================================================================
// Factory Functions
// ============================================================================

export function defineValidatorAdapter<TSchema>(
	adapter: PartialValidatorAdapter<TSchema>
): ValidatorAdapter<TSchema> {
	return adapter
}

const defaultFalse = () => false
const defaultNull = () => null
const defaultUndefined = () => undefined
const defaultEmptyArray = (): [] => []

export function defineTransformerAdapter<TSchema>(
	partial: PartialTransformerAdapter<TSchema>
): TransformerAdapter<TSchema> {
	return {
		isString: defaultFalse,
		isNumber: defaultFalse,
		isBoolean: defaultFalse,
		isNull: defaultFalse,
		isUndefined: defaultFalse,
		isVoid: defaultFalse,
		isAny: defaultFalse,
		isUnknown: defaultFalse,
		isNever: defaultFalse,
		isObject: defaultFalse,
		isArray: defaultFalse,
		isUnion: defaultFalse,
		isLiteral: defaultFalse,
		isEnum: defaultFalse,
		isOptional: defaultFalse,
		isNullable: defaultFalse,
		isTuple: defaultFalse,
		isRecord: defaultFalse,
		isMap: defaultFalse,
		isSet: defaultFalse,
		isIntersection: defaultFalse,
		isLazy: defaultFalse,
		isTransform: defaultFalse,
		isRefine: defaultFalse,
		isDefault: defaultFalse,
		isCatch: defaultFalse,
		isBranded: defaultFalse,
		isDate: defaultFalse,
		isBigInt: defaultFalse,
		isSymbol: defaultFalse,
		isFunction: defaultFalse,
		isPromise: defaultFalse,
		isInstanceOf: defaultFalse,
		unwrap: defaultNull,
		getObjectEntries: defaultEmptyArray,
		getArrayElement: defaultNull,
		getUnionOptions: defaultEmptyArray,
		getLiteralValue: defaultUndefined,
		getEnumValues: defaultEmptyArray,
		getTupleItems: defaultEmptyArray,
		getRecordKeyType: defaultNull,
		getRecordValueType: defaultNull,
		getMapKeyType: defaultNull,
		getMapValueType: defaultNull,
		getSetElement: defaultNull,
		getIntersectionSchemas: defaultEmptyArray,
		getPromiseInner: defaultNull,
		getInstanceOfClass: defaultNull,
		getConstraints: defaultNull,
		getDescription: defaultUndefined,
		getTitle: defaultUndefined,
		getDefault: defaultUndefined,
		getExamples: defaultUndefined,
		isDeprecated: defaultFalse,
		...partial,
	} as TransformerAdapter<TSchema>
}
