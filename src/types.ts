/**
 * AnySchema - Universal schema type definitions
 *
 * Zero runtime cost - all types are erased at compile time
 */

// Type-only imports - erased at runtime
import type { ZodType, infer as ZodInfer } from 'zod';
import type {
  GenericSchema,
  GenericSchemaAsync,
  InferOutput as ValibotInferOutput,
} from 'valibot';
import type { Type } from 'arktype';

/**
 * Supported schema vendors
 */
export type SchemaVendor = 'zod' | 'valibot' | 'arktype';

/**
 * Valibot schema (sync or async)
 */
export type ValibotSchema = GenericSchema | GenericSchemaAsync;

/**
 * AnySchema - Union of all supported schema types
 *
 * Use this type when you want to accept any supported schema library
 *
 * @example
 * ```typescript
 * function processSchema(schema: AnySchema) {
 *   const jsonSchema = toJsonSchema(schema);
 *   // ...
 * }
 * ```
 */
export type AnySchema = ZodType | ValibotSchema | Type;

/**
 * Infer output type from any supported schema
 *
 * Works with Zod, Valibot, and ArkType schemas
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import * as v from 'valibot';
 * import { type } from 'arktype';
 *
 * const zodSchema = z.object({ name: z.string() });
 * type ZodOutput = InferOutput<typeof zodSchema>;
 * // { name: string }
 *
 * const valibotSchema = v.object({ name: v.string() });
 * type ValibotOutput = InferOutput<typeof valibotSchema>;
 * // { name: string }
 *
 * const arktypeSchema = type({ name: 'string' });
 * type ArkTypeOutput = InferOutput<typeof arktypeSchema>;
 * // { name: string }
 * ```
 */
export type InferOutput<T extends AnySchema> = T extends ZodType<infer O>
  ? O
  : T extends GenericSchema<unknown, infer O>
    ? O
    : T extends GenericSchemaAsync<unknown, infer O>
      ? O
      : T extends Type<infer O>
        ? O
        : never;

/**
 * Infer input type from any supported schema
 *
 * For schemas with transforms, this is the type before transformation
 */
export type InferInput<T extends AnySchema> = T extends ZodType<
  unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  infer I
>
  ? I
  : T extends GenericSchema<infer I>
    ? I
    : T extends GenericSchemaAsync<infer I>
      ? I
      : T extends Type<unknown, infer I>
        ? I
        : never;

/**
 * JSON Schema type definition
 *
 * Represents a JSON Schema object (Draft-07 compatible)
 */
export interface JSONSchema {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchema>;
  definitions?: Record<string, JSONSchema>;

  // Type
  type?:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'object'
    | 'array'
    | 'null'
    | Array<
        'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
      >;

  // String
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Number
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;

  // Object
  properties?: Record<string, JSONSchema>;
  additionalProperties?: boolean | JSONSchema;
  required?: string[];
  propertyNames?: JSONSchema;
  minProperties?: number;
  maxProperties?: number;
  patternProperties?: Record<string, JSONSchema>;

  // Array
  items?: JSONSchema | JSONSchema[];
  additionalItems?: boolean | JSONSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  contains?: JSONSchema;

  // Composition
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;

  // Conditionals
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;

  // Metadata
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;

  // Enum
  enum?: unknown[];
  const?: unknown;

  // Allow additional properties for extensions
  [key: string]: unknown;
}

/**
 * Validation result - success case
 */
export interface ValidationSuccess<T> {
  success: true;
  data: T;
  issues?: never;
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  message: string;
  path?: (string | number)[];
}

/**
 * Validation result - failure case
 */
export interface ValidationFailure {
  success: false;
  data?: never;
  issues: ValidationIssue[];
}

/**
 * Unified validation result
 *
 * @example
 * ```typescript
 * const result = validate(schema, data);
 * if (result.success) {
 *   console.log(result.data); // typed!
 * } else {
 *   console.log(result.issues);
 * }
 * ```
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
