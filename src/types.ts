/**
 * AnySchema - Universal schema types via structural typing
 *
 * Zero imports from schema libraries. Pure TypeScript structural types.
 * Works with ANY version of Zod, Valibot, ArkType, or any compatible library.
 */

// ============================================================================
// Structural Type Detection
// ============================================================================

/**
 * Zod-like schema structure
 * Matches: Zod v3+
 */
export interface ZodLike {
  _output: unknown;
  _input: unknown;
  _def: unknown;
  safeParse: (data: unknown) => unknown;
  parse: (data: unknown) => unknown;
}

/**
 * Valibot-like schema structure
 * Matches: Valibot v1+
 */
export interface ValibotLike {
  types: { input: unknown; output: unknown };
  kind: string;
  async: boolean;
}

/**
 * ArkType-like schema structure
 * Matches: ArkType v2+
 */
export interface ArkTypeLike {
  infer: unknown;
  inferIn: unknown;
  toJsonSchema: () => unknown;
  // ArkType schemas are callable
  (data: unknown): unknown;
}

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Infer output type from any supported schema
 *
 * Uses structural typing - no library imports needed.
 * Returns `never` if schema structure is not recognized.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { InferOutput } from 'anyschema';
 *
 * const schema = z.object({ name: z.string() });
 * type Output = InferOutput<typeof schema>;
 * // { name: string }
 * ```
 */
export type InferOutput<T> =
  // Zod: has _output property
  T extends { _output: infer O }
    ? O
    : // Valibot: has types.output property
      T extends { types: { output: infer O } }
      ? O
      : // ArkType: has infer property
        T extends { infer: infer O }
        ? O
        : // Not a recognized schema
          never;

/**
 * Infer input type from any supported schema
 *
 * For schemas with transforms, this is the type before transformation.
 * Returns `never` if schema structure is not recognized.
 */
export type InferInput<T> =
  // Zod: has _input property
  T extends { _input: infer I }
    ? I
    : // Valibot: has types.input property
      T extends { types: { input: infer I } }
      ? I
      : // ArkType: has inferIn property
        T extends { inferIn: infer I }
        ? I
        : // Not a recognized schema
          never;

/**
 * Check if a type is a valid schema (not never)
 *
 * Use this to create type guards that reject invalid schemas at compile time.
 */
export type IsValidSchema<T> = InferOutput<T> extends never ? false : true;

/**
 * Assert that T is a valid schema, otherwise return never
 *
 * This causes a compile-time error when passing an invalid schema.
 */
export type AssertValidSchema<T> = InferOutput<T> extends never ? never : T;

/**
 * AnySchema - Union type matching all supported schema structures
 *
 * Use this when you need a type that accepts any valid schema.
 * Note: This is a structural type, not dependent on library imports.
 */
export type AnySchema = ZodLike | ValibotLike | ArkTypeLike;

// ============================================================================
// Vendor Detection
// ============================================================================

/**
 * Supported schema vendors
 */
export type SchemaVendor = 'zod' | 'valibot' | 'arktype';

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation issue
 */
export interface ValidationIssue {
  message: string;
  path?: (string | number)[];
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

// ============================================================================
// JSON Schema Types
// ============================================================================

/**
 * JSON Schema type definition (Draft-07 compatible)
 */
export interface JSONSchema {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchema>;
  definitions?: Record<string, JSONSchema>;

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

  // Allow additional properties
  [key: string]: unknown;
}
