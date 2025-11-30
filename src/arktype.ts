/**
 * ArkType to JSON Schema converter
 *
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * import { toJsonSchema } from 'standard-schema-to-json/arktype';
 *
 * const schema = type({ name: 'string' });
 * const jsonSchema = toJsonSchema(schema);
 * ```
 */

// Type-only import - erased at runtime, zero cost
import type { Type } from 'arktype';
import type { JSONSchema } from './types.js';

export type { JSONSchema };

/**
 * Convert ArkType schema to JSON Schema
 *
 * ArkType has built-in toJsonSchema() method, no extra peer dependency needed
 */
export function toJsonSchema(schema: Type): JSONSchema {
  // ArkType has built-in toJsonSchema method
  if (typeof schema !== 'function' || typeof schema.toJsonSchema !== 'function') {
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
