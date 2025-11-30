/**
 * Validator Factory
 *
 * Create type-safe validator with only the adapters you need.
 * Separate from transformer for optimal tree-shaking.
 */

import type { ValidationResult } from '../types.js'
import { ValidationError } from '../types.js'
import type { InferSchemas, SchemaAdapter } from './types.js'

// ============================================================================
// Type Utilities
// ============================================================================

/** Extract schema type from array of adapters */
type SupportedSchemas<T extends readonly SchemaAdapter<any>[]> = InferSchemas<T>

// ============================================================================
// Validator Factory
// ============================================================================

export interface ValidatorOptions<TAdapters extends readonly SchemaAdapter<any>[]> {
	adapters: TAdapters
}

export interface Validator<TAdapters extends readonly SchemaAdapter<any>[]> {
	/** Validate data against a schema */
	validate<TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): ValidationResult<unknown>

	/** Async validation */
	validateAsync<TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): Promise<ValidationResult<unknown>>

	/** Type guard that narrows the type of data */
	is<TSchema extends SupportedSchemas<TAdapters>>(schema: TSchema, data: unknown): boolean

	/** Assert that data matches schema, throws if not */
	assert<TSchema extends SupportedSchemas<TAdapters>>(schema: TSchema, data: unknown): void

	/** Parse data, throwing on validation errors */
	parse<TSchema extends SupportedSchemas<TAdapters>>(schema: TSchema, data: unknown): unknown

	/** Async version of parse */
	parseAsync<TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): Promise<unknown>

	/** Find the adapter that handles this schema */
	findAdapter<TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema
	): SchemaAdapter<TSchema> | null
}

/**
 * Create a type-safe validator with specific adapters.
 *
 * @example
 * ```typescript
 * import { createValidator, zodV4Adapter, valibotAdapter } from 'anyschema';
 *
 * const { validate, parse, is } = createValidator({
 *   adapters: [zodV4Adapter, valibotAdapter]
 * });
 *
 * // Works with Zod and Valibot schemas
 * validate(zodSchema, data);    // OK
 * validate(valibotSchema, data); // OK
 *
 * // TypeScript error - Yup not in adapters!
 * validate(yupSchema, data);    // Type error
 * ```
 */
export function createValidator<const TAdapters extends readonly SchemaAdapter<any>[]>(
	options: ValidatorOptions<TAdapters>
): Validator<TAdapters> {
	const { adapters } = options

	const findAdapter = <TSchema>(schema: TSchema): SchemaAdapter<TSchema> | null => {
		return (adapters.find((a) => a.match(schema)) as SchemaAdapter<TSchema>) ?? null
	}

	const validate = <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): ValidationResult<unknown> => {
		const adapter = findAdapter(schema)
		if (!adapter) {
			return {
				success: false,
				issues: [{ message: 'No adapter found for schema' }],
			}
		}
		return adapter.validate(schema, data)
	}

	const validateAsync = async <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): Promise<ValidationResult<unknown>> => {
		const adapter = findAdapter(schema)
		if (!adapter) {
			return {
				success: false,
				issues: [{ message: 'No adapter found for schema' }],
			}
		}
		if (adapter.validateAsync) {
			return adapter.validateAsync(schema, data)
		}
		return adapter.validate(schema, data)
	}

	const is = <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): boolean => {
		const result = validate(schema, data)
		return result.success
	}

	const assert = <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): void => {
		const result = validate(schema, data)
		if (!result.success) {
			throw new ValidationError(result.issues)
		}
	}

	const parse = <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): unknown => {
		const result = validate(schema, data)
		if (!result.success) {
			throw new ValidationError(result.issues)
		}
		return result.data
	}

	const parseAsync = async <TSchema extends SupportedSchemas<TAdapters>>(
		schema: TSchema,
		data: unknown
	): Promise<unknown> => {
		const result = await validateAsync(schema, data)
		if (!result.success) {
			throw new ValidationError(result.issues)
		}
		return result.data
	}

	return {
		validate,
		validateAsync,
		is,
		assert,
		parse,
		parseAsync,
		findAdapter,
	}
}
