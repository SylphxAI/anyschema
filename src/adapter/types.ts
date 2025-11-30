/**
 * Schema Adapter Types
 *
 * Split into ValidatorAdapter and TransformerAdapter for tree-shaking.
 * Import only what you need.
 */

import type { ValidationResult } from '../types.js'

// ============================================================================
// Constraints
// ============================================================================

export interface SchemaConstraints {
	// Number constraints
	min?: number
	max?: number
	// String constraints
	minLength?: number
	maxLength?: number
	pattern?: string
	format?: string
}

// ============================================================================
// Validator Adapter (minimal - for validation only)
// ============================================================================

/**
 * Minimal adapter for validation only.
 * Use this when you only need to validate data, not transform to JSON Schema.
 * @template TSchema - The schema type this adapter handles
 */
export interface ValidatorAdapter<TSchema = unknown> {
	/** Unique vendor identifier */
	readonly vendor: string

	/** Type guard - check if this adapter handles the schema */
	match(schema: unknown): schema is TSchema

	/** Validate data against schema */
	validate(schema: TSchema, data: unknown): ValidationResult<unknown>

	/** Async validation (optional) */
	validateAsync?(schema: TSchema, data: unknown): Promise<ValidationResult<unknown>>
}

// ============================================================================
// Transformer Adapter (for JSON Schema conversion)
// ============================================================================

/**
 * Adapter for JSON Schema transformation.
 * Contains all introspection methods needed to convert schemas.
 * @template TSchema - The schema type this adapter handles
 */
export interface TransformerAdapter<TSchema = unknown> {
	/** Unique vendor identifier */
	readonly vendor: string

	/** Type guard - check if this adapter handles the schema */
	match(schema: unknown): schema is TSchema

	// ============ Type Detection ============
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

	// ============ Unwrap ============
	unwrap(schema: TSchema): unknown | null

	// ============ Extract ============
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

	// ============ Constraints ============
	getConstraints(schema: TSchema): SchemaConstraints | null

	// ============ Metadata ============
	getDescription(schema: TSchema): string | undefined
	getTitle(schema: TSchema): string | undefined
	getDefault(schema: TSchema): unknown
	getExamples(schema: TSchema): unknown[] | undefined
	isDeprecated(schema: TSchema): boolean
}

// ============================================================================
// Combined Adapter (backwards compatible)
// ============================================================================

/**
 * Full schema adapter with both validation and transformation.
 * @template TSchema - The schema type this adapter handles
 * @deprecated Use ValidatorAdapter or TransformerAdapter for better tree-shaking
 */
export interface SchemaAdapter<TSchema = unknown>
	extends ValidatorAdapter<TSchema>,
		TransformerAdapter<TSchema> {}

// ============================================================================
// Partial Adapters (for easier implementation)
// ============================================================================

/**
 * Partial validator adapter.
 * @template TSchema - The schema type this adapter handles
 */
export type PartialValidatorAdapter<TSchema = unknown> = ValidatorAdapter<TSchema>

/**
 * Partial transformer adapter with sensible defaults.
 * @template TSchema - The schema type this adapter handles
 */
export type PartialTransformerAdapter<TSchema = unknown> = {
	readonly vendor: string
	match(schema: unknown): schema is TSchema
} & Partial<Omit<TransformerAdapter<TSchema>, 'vendor' | 'match'>>

/**
 * Partial full adapter with sensible defaults.
 * @template TSchema - The schema type this adapter handles
 * @deprecated Use PartialValidatorAdapter or PartialTransformerAdapter
 */
export type PartialSchemaAdapter<TSchema = unknown> = {
	readonly vendor: string
	match(schema: unknown): schema is TSchema
	validate(schema: TSchema, data: unknown): ValidationResult<unknown>
} & Partial<Omit<SchemaAdapter<TSchema>, 'vendor' | 'match' | 'validate'>>

// ============================================================================
// Type Inference Utilities
// ============================================================================

/** Extract schema type from validator adapter */
export type InferValidatorSchema<T> = T extends ValidatorAdapter<infer S> ? S : never

/** Extract schema type from transformer adapter */
export type InferTransformerSchema<T> = T extends TransformerAdapter<infer S> ? S : never

/** Extract schema type from any adapter */
export type InferSchema<T> = T extends ValidatorAdapter<infer S>
	? S
	: T extends TransformerAdapter<infer S>
		? S
		: never

/** Extract schema types from array of validator adapters */
export type InferValidatorSchemas<T extends readonly ValidatorAdapter<any>[]> =
	InferValidatorSchema<T[number]>

/** Extract schema types from array of transformer adapters */
export type InferTransformerSchemas<T extends readonly TransformerAdapter<any>[]> =
	InferTransformerSchema<T[number]>

/** Extract schema type from array of adapters */
export type InferSchemas<T extends readonly SchemaAdapter<any>[]> = InferSchema<T[number]>

// ============================================================================
// Adapter Registry (Global - for backwards compatibility)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapters: SchemaAdapter<any>[] = []

/**
 * Register a custom adapter (global registry).
 * Multiple adapters can have the same vendor (e.g., zod v3 and v4).
 * The match() function determines which adapter handles a schema.
 */
export function registerAdapter<T>(adapter: SchemaAdapter<T>): void {
	// Add at beginning (later registered adapters take priority)
	adapters.unshift(adapter)
}

/**
 * Find adapter for a schema (global registry)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findAdapter(schema: unknown): SchemaAdapter<any> | null {
	return adapters.find((a) => a.match(schema)) ?? null
}

/**
 * Get all registered adapters (global registry)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdapters(): readonly SchemaAdapter<any>[] {
	return adapters
}

// ============================================================================
// Default Implementation Helpers
// ============================================================================

const defaultFalse = () => false
const defaultNull = () => null
const defaultUndefined = () => undefined
const defaultEmptyArray = (): [] => []

/**
 * Create a validator adapter (minimal, for validation only)
 */
export function defineValidatorAdapter<TSchema>(
	adapter: PartialValidatorAdapter<TSchema>
): ValidatorAdapter<TSchema> {
	return adapter
}

/**
 * Create a transformer adapter with defaults
 */
export function defineTransformerAdapter<TSchema>(
	partial: PartialTransformerAdapter<TSchema>
): TransformerAdapter<TSchema> {
	return {
		// Defaults
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

		// Override with partial
		...partial,
	} as TransformerAdapter<TSchema>
}

/**
 * Create a full adapter with defaults for unimplemented methods
 * @deprecated Use defineValidatorAdapter or defineTransformerAdapter
 */
export function defineAdapter<TSchema>(
	partial: PartialSchemaAdapter<TSchema>
): SchemaAdapter<TSchema> {
	return {
		...defineTransformerAdapter(partial),
		validate: partial.validate,
		validateAsync: partial.validateAsync,
	} as SchemaAdapter<TSchema>
}
