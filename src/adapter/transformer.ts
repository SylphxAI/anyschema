/**
 * Core JSON Schema Transformer
 *
 * Uses adapters to convert any schema to JSON Schema.
 * Zero dependencies - pure duck typing.
 */

import type { JSONSchema } from '../types.js'
import type { SchemaConstraints } from './types.js'
import { findAdapter } from './types.js'

// ============================================================================
// Context for recursive conversion
// ============================================================================

interface TransformContext {
	/** Track seen schemas for $ref generation */
	seen: Map<unknown, string>
	/** JSON Schema $defs */
	defs: Map<string, JSONSchema>
	/** Counter for generating unique names */
	counter: number
}

function createContext(): TransformContext {
	return {
		seen: new Map(),
		defs: new Map(),
		counter: 0,
	}
}

// ============================================================================
// Main Transformer
// ============================================================================

/**
 * Convert any supported schema to JSON Schema
 */
export function toJsonSchema(schema: unknown): JSONSchema {
	const ctx = createContext()
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

/**
 * Internal transform function
 */
function transform(schema: unknown, ctx: TransformContext): JSONSchema {
	const adapter = findAdapter(schema)
	if (!adapter) {
		throw new Error(`No adapter found for schema: ${typeof schema}`)
	}

	// Check for circular reference
	if (ctx.seen.has(schema)) {
		const refName = ctx.seen.get(schema)
		return { $ref: `#/$defs/${refName}` }
	}

	// Unwrap wrapper types (optional, nullable, transform, etc.)
	const unwrapped = adapter.unwrap(schema)
	if (unwrapped !== null) {
		// Handle default first (may also be optional/nullable in some libraries like Valibot)
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
		return {
			type: 'string',
			...meta,
			...constraintsToJsonSchema(adapter.getConstraints(schema), 'string'),
		}
	}

	if (adapter.isNumber(schema)) {
		return {
			type: 'number',
			...meta,
			...constraintsToJsonSchema(adapter.getConstraints(schema), 'number'),
		}
	}

	if (adapter.isBoolean(schema)) {
		return { type: 'boolean', ...meta }
	}

	if (adapter.isNull(schema)) {
		return { type: 'null', ...meta }
	}

	if (adapter.isUndefined(schema) || adapter.isVoid(schema)) {
		// JSON Schema doesn't have undefined, use null or {}
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
		return { type: 'string', format: 'date-time', ...meta }
	}

	// BigInt
	if (adapter.isBigInt(schema)) {
		return { type: 'integer', ...meta }
	}

	// Literal
	if (adapter.isLiteral(schema)) {
		const value = adapter.getLiteralValue(schema)
		return { const: value, ...meta }
	}

	// Enum
	if (adapter.isEnum(schema)) {
		const values = adapter.getEnumValues(schema)
		return { enum: values, ...meta }
	}

	// Object
	if (adapter.isObject(schema)) {
		const entries = adapter.getObjectEntries(schema)
		const properties: Record<string, JSONSchema> = {}
		const required: string[] = []

		for (const [key, value] of entries) {
			properties[key] = transform(value, ctx)
			// Check if the property value is optional
			const valueAdapter = findAdapter(value)
			if (!valueAdapter?.isOptional(value)) {
				required.push(key)
			}
		}

		return {
			type: 'object',
			properties,
			...(required.length > 0 ? { required } : {}),
			...meta,
		}
	}

	// Array
	if (adapter.isArray(schema)) {
		const element = adapter.getArrayElement(schema)
		return {
			type: 'array',
			items: element ? transform(element, ctx) : {},
			...meta,
			...constraintsToJsonSchema(adapter.getConstraints(schema), 'array'),
		}
	}

	// Tuple
	if (adapter.isTuple(schema)) {
		const items = adapter.getTupleItems(schema)
		return {
			type: 'array',
			prefixItems: items.map((item) => transform(item, ctx)),
			minItems: items.length,
			maxItems: items.length,
			...meta,
		}
	}

	// Union
	if (adapter.isUnion(schema)) {
		const options = adapter.getUnionOptions(schema)
		return {
			anyOf: options.map((opt) => transform(opt, ctx)),
			...meta,
		}
	}

	// Intersection
	if (adapter.isIntersection(schema)) {
		const schemas = adapter.getIntersectionSchemas(schema)
		return {
			allOf: schemas.map((s) => transform(s, ctx)),
			...meta,
		}
	}

	// Record
	if (adapter.isRecord(schema)) {
		const valueType = adapter.getRecordValueType(schema)
		return {
			type: 'object',
			additionalProperties: valueType ? transform(valueType, ctx) : {},
			...meta,
		}
	}

	// Map
	if (adapter.isMap(schema)) {
		const valueType = adapter.getMapValueType(schema)
		return {
			type: 'object',
			additionalProperties: valueType ? transform(valueType, ctx) : {},
			...meta,
		}
	}

	// Set
	if (adapter.isSet(schema)) {
		const element = adapter.getSetElement(schema)
		return {
			type: 'array',
			uniqueItems: true,
			items: element ? transform(element, ctx) : {},
			...meta,
		}
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
		// Can't represent in JSON Schema, return empty schema
		return { ...meta }
	}

	// Unknown type - return empty schema (matches anything)
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
