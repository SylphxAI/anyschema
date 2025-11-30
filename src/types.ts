import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Supported vendor names that implement Standard Schema AND have toJsonSchema capability
 *
 * Note: TypeBox and Effect Schema have their own toJsonSchema methods but do NOT
 * implement the Standard Schema interface, so they cannot be auto-detected.
 */
export type SupportedVendor = 'zod' | 'valibot' | 'arktype';

/**
 * Array of supported vendors for runtime checks
 */
export const SUPPORTED_VENDORS: readonly SupportedVendor[] = [
  'zod',
  'valibot',
  'arktype',
] as const;

/**
 * Type-level check: extracts the vendor from a StandardSchema
 * Returns the vendor string literal type if available, otherwise string
 */
export type ExtractVendor<T extends StandardSchemaV1> =
  T['~standard']['vendor'];

/**
 * Type guard type: ensures the schema's vendor is a supported vendor
 *
 * If the vendor is supported, returns T unchanged.
 * If the vendor is NOT supported, returns never (causing a type error).
 *
 * @example
 * ```typescript
 * // Works - zod is supported
 * const zodSchema = z.string();
 * toJsonSchema(zodSchema); // OK
 *
 * // Type error - unknown vendor
 * const customSchema: StandardSchemaV1 & { '~standard': { vendor: 'custom' } } = ...;
 * toJsonSchema(customSchema); // Error: Argument of type '...' is not assignable to parameter of type 'never'
 * ```
 */
export type WithToJsonSchema<T extends StandardSchemaV1> =
  ExtractVendor<T> extends SupportedVendor ? T : never;

/**
 * Helper type to create a StandardSchema with a specific vendor
 */
export type StandardSchemaWithVendor<
  V extends string,
  Input = unknown,
  Output = Input,
> = StandardSchemaV1<Input, Output> & {
  readonly '~standard': StandardSchemaV1.Props<Input, Output> & {
    readonly vendor: V;
  };
};

/**
 * Union of all supported schema types
 */
export type SupportedStandardSchema =
  | StandardSchemaWithVendor<'zod'>
  | StandardSchemaWithVendor<'valibot'>
  | StandardSchemaWithVendor<'arktype'>;

/**
 * Infer input type from a StandardSchema
 */
export type InferInput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<T>;

/**
 * Infer output type from a StandardSchema
 */
export type InferOutput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<T>;
