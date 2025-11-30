/**
 * Schema Adapter Types
 *
 * Generic, type-safe adapter interface.
 * Each adapter declares the schema type it handles.
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
// Adapter Interface
// ============================================================================

/**
 * Schema adapter interface.
 * @template TSchema - The schema type this adapter handles
 */
export interface SchemaAdapter<TSchema = unknown> {
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
	/**
	 * Unwrap wrapper types (optional, nullable, lazy, transform, refine, etc.)
	 * Returns the inner schema, or null if not a wrapper type.
	 */
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

	// ============ Validation ============
	validate(schema: TSchema, data: unknown): ValidationResult<unknown>
	validateAsync?(schema: TSchema, data: unknown): Promise<ValidationResult<unknown>>
}

// ============================================================================
// Partial Adapter (for easier implementation)
// ============================================================================

/**
 * Partial adapter with sensible defaults.
 * Only implement what your library supports.
 * @template TSchema - The schema type this adapter handles
 */
export type PartialSchemaAdapter<TSchema = unknown> = {
	readonly vendor: string
	match(schema: unknown): schema is TSchema
	validate(schema: TSchema, data: unknown): ValidationResult<unknown>
} & Partial<Omit<SchemaAdapter<TSchema>, 'vendor' | 'match' | 'validate'>>

// ============================================================================
// Type Inference Utilities
// ============================================================================

/** Extract schema type from adapter */
export type InferSchema<T> = T extends SchemaAdapter<infer S> ? S : never

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
// Default Implementation Helper
// ============================================================================

const defaultFalse = () => false
const defaultNull = () => null
const defaultUndefined = () => undefined
const defaultEmptyArray = (): [] => []

/**
 * Create an adapter with defaults for unimplemented methods
 */
export function defineAdapter<TSchema>(
	partial: PartialSchemaAdapter<TSchema>
): SchemaAdapter<TSchema> {
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
	} as SchemaAdapter<TSchema>
}
