/**
 * Schema Adapter Types
 *
 * Thin interface for duck-typing any schema library.
 * Each adapter is ~50 lines - just property access.
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

export interface SchemaAdapter {
	/** Unique vendor identifier */
	readonly vendor: string

	/** Check if this adapter handles the schema */
	match(schema: unknown): boolean

	// ============ Type Detection ============
	isString(schema: unknown): boolean
	isNumber(schema: unknown): boolean
	isBoolean(schema: unknown): boolean
	isNull(schema: unknown): boolean
	isUndefined(schema: unknown): boolean
	isVoid(schema: unknown): boolean
	isAny(schema: unknown): boolean
	isUnknown(schema: unknown): boolean
	isNever(schema: unknown): boolean
	isObject(schema: unknown): boolean
	isArray(schema: unknown): boolean
	isUnion(schema: unknown): boolean
	isLiteral(schema: unknown): boolean
	isEnum(schema: unknown): boolean
	isOptional(schema: unknown): boolean
	isNullable(schema: unknown): boolean
	isTuple(schema: unknown): boolean
	isRecord(schema: unknown): boolean
	isMap(schema: unknown): boolean
	isSet(schema: unknown): boolean
	isIntersection(schema: unknown): boolean
	isLazy(schema: unknown): boolean
	isTransform(schema: unknown): boolean
	isRefine(schema: unknown): boolean
	isDefault(schema: unknown): boolean
	isCatch(schema: unknown): boolean
	isBranded(schema: unknown): boolean
	isDate(schema: unknown): boolean
	isBigInt(schema: unknown): boolean
	isSymbol(schema: unknown): boolean
	isFunction(schema: unknown): boolean
	isPromise(schema: unknown): boolean
	isInstanceOf(schema: unknown): boolean

	// ============ Unwrap ============
	/**
	 * Unwrap wrapper types (optional, nullable, lazy, transform, refine, etc.)
	 * Returns the inner schema, or null if not a wrapper type.
	 */
	unwrap(schema: unknown): unknown | null

	// ============ Extract ============
	getObjectEntries(schema: unknown): [string, unknown][]
	getArrayElement(schema: unknown): unknown
	getUnionOptions(schema: unknown): unknown[]
	getLiteralValue(schema: unknown): unknown
	getEnumValues(schema: unknown): unknown[]
	getTupleItems(schema: unknown): unknown[]
	getRecordKeyType(schema: unknown): unknown | null
	getRecordValueType(schema: unknown): unknown
	getMapKeyType(schema: unknown): unknown
	getMapValueType(schema: unknown): unknown
	getSetElement(schema: unknown): unknown
	getIntersectionSchemas(schema: unknown): unknown[]
	getPromiseInner(schema: unknown): unknown
	getInstanceOfClass(schema: unknown): unknown

	// ============ Constraints ============
	getConstraints(schema: unknown): SchemaConstraints | null

	// ============ Metadata ============
	getDescription(schema: unknown): string | undefined
	getTitle(schema: unknown): string | undefined
	getDefault(schema: unknown): unknown
	getExamples(schema: unknown): unknown[] | undefined
	isDeprecated(schema: unknown): boolean

	// ============ Validation ============
	validate(schema: unknown, data: unknown): ValidationResult<unknown>
	validateAsync?(schema: unknown, data: unknown): Promise<ValidationResult<unknown>>
}

// ============================================================================
// Partial Adapter (for easier implementation)
// ============================================================================

/**
 * Partial adapter with sensible defaults.
 * Only implement what your library supports.
 */
export type PartialSchemaAdapter = {
	readonly vendor: string
	match(schema: unknown): boolean
	validate(schema: unknown, data: unknown): ValidationResult<unknown>
} & Partial<Omit<SchemaAdapter, 'vendor' | 'match' | 'validate'>>

// ============================================================================
// Adapter Registry
// ============================================================================

const adapters: SchemaAdapter[] = []

/**
 * Register a custom adapter.
 * Multiple adapters can have the same vendor (e.g., zod v3 and v4).
 * The match() function determines which adapter handles a schema.
 */
export function registerAdapter(adapter: SchemaAdapter): void {
	// Add at beginning (later registered adapters take priority)
	adapters.unshift(adapter)
}

/**
 * Find adapter for a schema
 */
export function findAdapter(schema: unknown): SchemaAdapter | null {
	return adapters.find((a) => a.match(schema)) ?? null
}

/**
 * Get all registered adapters
 */
export function getAdapters(): readonly SchemaAdapter[] {
	return adapters
}

// ============================================================================
// Default Implementation Helper
// ============================================================================

const defaultFalse = () => false
const defaultNull = () => null
const defaultUndefined = () => undefined
const defaultEmptyArray = () => []

/**
 * Create an adapter with defaults for unimplemented methods
 */
export function defineAdapter(partial: PartialSchemaAdapter): SchemaAdapter {
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
	}
}
