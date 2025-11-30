/**
 * ArkType utilities for AnySchema
 *
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * import { toJsonSchema, validate } from 'anyschema/arktype';
 *
 * const schema = type({ name: 'string' });
 * const jsonSchema = toJsonSchema(schema);
 * const result = validate(schema, { name: 'John' });
 * ```
 */

// Type-only import - erased at runtime, zero cost
import type { Type, ArkErrors } from 'arktype';
import type { JSONSchema, ValidationResult, ValidationIssue } from './types.js';

export type { JSONSchema };

/**
 * Convert ArkType schema to JSON Schema
 *
 * ArkType has built-in toJsonSchema() method
 */
export function toJsonSchema(schema: Type): JSONSchema {
  if (
    typeof schema !== 'function' ||
    typeof schema.toJsonSchema !== 'function'
  ) {
    throw new Error(
      'Invalid ArkType schema. Expected a Type with toJsonSchema method.'
    );
  }
  return schema.toJsonSchema() as JSONSchema;
}

/**
 * Convert ArkType schema to JSON Schema (async version)
 *
 * Same as sync version since ArkType's toJsonSchema is synchronous
 */
export async function toJsonSchemaAsync(schema: Type): Promise<JSONSchema> {
  return toJsonSchema(schema);
}

/**
 * Validate data against an ArkType schema
 */
export function validate<T>(
  schema: Type<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema(data);

  // ArkType returns the data directly on success, or ArkErrors on failure
  if (isArkErrors(result)) {
    const issues: ValidationIssue[] = [...result].map((error) => ({
      message: error.message,
      path: error.path as unknown as (string | number)[],
    }));

    return { success: false, issues };
  }

  return { success: true, data: result as T };
}

/**
 * Check if result is ArkErrors
 */
function isArkErrors(value: unknown): value is ArkErrors {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.iterator in value &&
    'summary' in value
  );
}
