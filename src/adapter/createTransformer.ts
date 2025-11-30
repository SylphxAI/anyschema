/**
 * Transformer Factory
 *
 * Create type-safe transformer with only the adapters you need.
 * Separate from validator for optimal tree-shaking.
 */

import type { JSONSchema } from '../types.js'
import type { InferTransformerSchemas, SchemaConstraints, TransformerAdapter } from './types.js'

// ============================================================================
// Type Utilities
// ============================================================================

/** Extract schema type from array of transformer adapters */
type SupportedSchemas<T extends readonly TransformerAdapter<any>[]> = InferTransformerSchemas<T>

// ============================================================================
// Transformer Factory
// ============================================================================

export interface TransformerOptions<TAdapters extends readonly TransformerAdapter<any>[]> {
	adapters: TAdapters
}

export interface Transformer<TAdapters extends readonly TransformerAdapter<any>[]> {
	/** Convert schema to JSON Schema */
	toJsonSchema<TSchema extends SupportedSchemas<TAdapters>>(schema: TSchema): JSONSchema

	/** Find the adapter that handles this schema */
	findAdapter<TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema
	): TransformerAdapter<TSchema> | null
}

// ============================================================================
// Transformer Context
// ============================================================================

interface TransformContext<TAdapters extends readonly TransformerAdapter<any>[]> {
	adapters: TAdapters
	seen: Map<unknown, string>
	defs: Map<string, JSONSchema>
	counter: number
}

function createContext<TAdapters extends readonly TransformerAdapter<any>[]>(
	adapters: TAdapters
): TransformContext<TAdapters> {
	return {
		adapters,
		seen: new Map(),
		defs: new Map(),
		counter: 0,
	}
}

/**
 * Create a type-safe transformer with specific adapters.
 *
 * @example
 * ```typescript
 * import { createTransformer, zodV4Transformer, valibotTransformer } from 'anyschema';
 *
 * const { toJsonSchema } = createTransformer({
 *   adapters: [zodV4Transformer, valibotTransformer]
 * });
 *
 * // Works with Zod and Valibot schemas
 * toJsonSchema(zodSchema);      // OK
 * toJsonSchema(valibotSchema);  // OK
 *
 * // TypeScript error - Yup not in adapters!
 * toJsonSchema(yupSchema);      // Type error
 * ```
 */
export function createTransformer<const TAdapters extends readonly TransformerAdapter<any>[]>(
	options: TransformerOptions<TAdapters>
): Transformer<TAdapters> {
	const { adapters } = options

	const findAdapter = <TSchema>(schema: TSchema): TransformerAdapter<TSchema> | null => {
		return (adapters.find((a) => a.match(schema)) as TransformerAdapter<TSchema>) ?? null
	}

	const toJsonSchema = <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema
	): JSONSchema => {
		// Try native toJsonSchema method first (ArkType)
		if (typeof (schema as { toJsonSchema?: unknown }).toJsonSchema === 'function') {
			return (schema as { toJsonSchema: () => JSONSchema }).toJsonSchema()
		}

		// TypeBox schemas ARE JSON Schema - pass through directly
		const TypeBoxKind = Symbol.for('TypeBox.Kind')
		if (schema && typeof schema === 'object' && TypeBoxKind in schema) {
			// Clone and remove TypeBox internal properties
			const result = { ...schema } as Record<string | symbol, unknown>
			delete result[TypeBoxKind]
			delete result['static']
			delete result['params']
			return result as JSONSchema
		}

		const ctx = createContext(adapters)
		const result = transform(schema, ctx)

		// Add $defs if any
		if (ctx.defs.size > 0) {
			return {
				...result,
				$defs: Object.fromEntries(ctx.defs),
			}
		}

		return result
	}

	return {
		toJsonSchema,
		findAdapter,
	}
}

// ============================================================================
// Internal Transform Function
// ============================================================================

function transform<TAdapters extends readonly TransformerAdapter<any>[]>(
	schema: unknown,
	ctx: TransformContext<TAdapters>
): JSONSchema {
	const adapter = ctx.adapters.find((a) => a.match(schema)) as
		| TransformerAdapter<unknown>
		| undefined
	if (!adapter) {
		throw new Error(`No adapter found for schema: ${typeof schema}`)
	}

	// Check for circular reference
	if (ctx.seen.has(schema)) {
		const refName = ctx.seen.get(schema)
		return { $ref: `#/$defs/${refName}` }
	}

	// Track if nullable was handled via unwrap
	let nullableHandledViaUnwrap = false

	// Unwrap wrapper types (optional, nullable, transform, etc.)
	const unwrapped = adapter.unwrap(schema)
	if (unwrapped !== null) {
		// Handle default first
		if (adapter.isDefault(schema)) {
			const inner = transform(unwrapped, ctx)
			const defaultValue = adapter.getDefault(schema)
			if (defaultValue !== undefined) {
				return { ...inner, default: defaultValue }
			}
			return inner
		}

		// Handle optional
		if (adapter.isOptional(schema)) {
			return transform(unwrapped, ctx)
		}

		// Handle nullable
		if (adapter.isNullable(schema)) {
			nullableHandledViaUnwrap = true
			const inner = transform(unwrapped, ctx)
			return {
				anyOf: [inner, { type: 'null' }],
			}
		}

		// Handle transform/refine - just use inner type
		if (adapter.isTransform(schema) || adapter.isRefine(schema)) {
			return transform(unwrapped, ctx)
		}

		// Handle lazy - mark as seen for circular refs
		if (adapter.isLazy(schema)) {
			const refName = `lazy_${ctx.counter++}`
			ctx.seen.set(schema, refName)
			const inner = transform(unwrapped, ctx)
			ctx.defs.set(refName, inner)
			return { $ref: `#/$defs/${refName}` }
		}

		// Handle branded - just use inner type
		if (adapter.isBranded(schema)) {
			return transform(unwrapped, ctx)
		}

		// Handle catch - just use inner type
		if (adapter.isCatch(schema)) {
			return transform(unwrapped, ctx)
		}
	}

	// Check if nullable but wasn't handled via unwrap (flag-based nullable like Yup)
	const needsNullableWrap = !nullableHandledViaUnwrap && adapter.isNullable(schema)

	// Helper to wrap with nullable if needed
	const wrapNullable = (result: JSONSchema): JSONSchema => {
		if (!needsNullableWrap) return result
		return { anyOf: [result, { type: 'null' }] }
	}

	// Get metadata
	const description = adapter.getDescription(schema)
	const title = adapter.getTitle(schema)
	const examples = adapter.getExamples(schema)
	const deprecated = adapter.isDeprecated(schema) ? true : undefined

	const meta: Partial<JSONSchema> = {}
	if (description) meta.description = description
	if (title) meta.title = title
	if (examples) meta.examples = examples
	if (deprecated) meta.deprecated = deprecated

	// Primitives
	if (adapter.isString(schema)) {
		return wrapNullable({
			type: 'string',
			...meta,
			...constraintsToJsonSchema(adapter.getConstraints(schema), 'string'),
		})
	}

	if (adapter.isNumber(schema)) {
		return wrapNullable({
			type: 'number',
			...meta,
			...constraintsToJsonSchema(adapter.getConstraints(schema), 'number'),
		})
	}

	if (adapter.isBoolean(schema)) {
		return wrapNullable({ type: 'boolean', ...meta })
	}

	if (adapter.isNull(schema)) {
		return { type: 'null', ...meta }
	}

	if (adapter.isUndefined(schema) || adapter.isVoid(schema)) {
		return { not: {}, ...meta }
	}

	if (adapter.isAny(schema) || adapter.isUnknown(schema)) {
		return { ...meta }
	}

	if (adapter.isNever(schema)) {
		return { not: {}, ...meta }
	}

	// Date
	if (adapter.isDate(schema)) {
		return wrapNullable({ type: 'string', format: 'date-time', ...meta })
	}

	// BigInt
	if (adapter.isBigInt(schema)) {
		return wrapNullable({ type: 'integer', ...meta })
	}

	// Literal
	if (adapter.isLiteral(schema)) {
		const value = adapter.getLiteralValue(schema)
		return wrapNullable({ const: value, ...meta })
	}

	// Enum
	if (adapter.isEnum(schema)) {
		const values = adapter.getEnumValues(schema)
		return wrapNullable({ enum: values, ...meta })
	}

	// Object
	if (adapter.isObject(schema)) {
		const entries = adapter.getObjectEntries(schema)
		const properties: Record<string, JSONSchema> = {}
		const required: string[] = []

		for (const [key, value] of entries) {
			properties[key] = transform(value, ctx)
			// Check if the property value is optional
			const valueAdapter = ctx.adapters.find((a) => a.match(value)) as
				| TransformerAdapter<unknown>
				| undefined
			if (!valueAdapter?.isOptional(value)) {
				required.push(key)
			}
		}

		return wrapNullable({
			type: 'object',
			properties,
			...(required.length > 0 ? { required } : {}),
			...meta,
		})
	}

	// Array
	if (adapter.isArray(schema)) {
		const element = adapter.getArrayElement(schema)
		return wrapNullable({
			type: 'array',
			items: element ? transform(element, ctx) : {},
			...meta,
			...constraintsToJsonSchema(adapter.getConstraints(schema), 'array'),
		})
	}

	// Tuple
	if (adapter.isTuple(schema)) {
		const items = adapter.getTupleItems(schema)
		return wrapNullable({
			type: 'array',
			prefixItems: items.map((item) => transform(item, ctx)),
			minItems: items.length,
			maxItems: items.length,
			...meta,
		})
	}

	// Union
	if (adapter.isUnion(schema)) {
		const options = adapter.getUnionOptions(schema)
		return wrapNullable({
			anyOf: options.map((opt) => transform(opt, ctx)),
			...meta,
		})
	}

	// Intersection
	if (adapter.isIntersection(schema)) {
		const schemas = adapter.getIntersectionSchemas(schema)
		return wrapNullable({
			allOf: schemas.map((s) => transform(s, ctx)),
			...meta,
		})
	}

	// Record
	if (adapter.isRecord(schema)) {
		const valueType = adapter.getRecordValueType(schema)
		return wrapNullable({
			type: 'object',
			additionalProperties: valueType ? transform(valueType, ctx) : {},
			...meta,
		})
	}

	// Map
	if (adapter.isMap(schema)) {
		const valueType = adapter.getMapValueType(schema)
		return wrapNullable({
			type: 'object',
			additionalProperties: valueType ? transform(valueType, ctx) : {},
			...meta,
		})
	}

	// Set
	if (adapter.isSet(schema)) {
		const element = adapter.getSetElement(schema)
		return wrapNullable({
			type: 'array',
			uniqueItems: true,
			items: element ? transform(element, ctx) : {},
			...meta,
		})
	}

	// Promise - unwrap to inner type
	if (adapter.isPromise(schema)) {
		const inner = adapter.getPromiseInner(schema)
		return inner ? transform(inner, ctx) : { ...meta }
	}

	// Function / Symbol - can't represent in JSON Schema
	if (adapter.isFunction(schema) || adapter.isSymbol(schema)) {
		return { not: {}, ...meta }
	}

	// InstanceOf
	if (adapter.isInstanceOf(schema)) {
		return { ...meta }
	}

	// Unknown type - return empty schema
	return { ...meta }
}

// ============================================================================
// Helpers
// ============================================================================

function constraintsToJsonSchema(
	constraints: SchemaConstraints | null,
	type: 'string' | 'number' | 'array'
): Partial<JSONSchema> {
	if (!constraints) return {}

	const result: Partial<JSONSchema> = {}

	if (type === 'string') {
		if (constraints.minLength !== undefined) result.minLength = constraints.minLength
		if (constraints.maxLength !== undefined) result.maxLength = constraints.maxLength
		if (constraints.pattern !== undefined) result.pattern = constraints.pattern
		if (constraints.format !== undefined) result.format = constraints.format
	}

	if (type === 'number') {
		if (constraints.min !== undefined) result.minimum = constraints.min
		if (constraints.max !== undefined) result.maximum = constraints.max
	}

	if (type === 'array') {
		if (constraints.min !== undefined) result.minItems = constraints.min
		if (constraints.max !== undefined) result.maxItems = constraints.max
	}

	return result
}
