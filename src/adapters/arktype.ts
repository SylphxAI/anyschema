import type { JSONSchema } from '../json-schema.js';

/**
 * Check if schema has ArkType's built-in toJsonSchema method
 * Note: ArkType schemas are functions (typeof returns 'function'), not objects
 */
function hasToJsonSchema(
  schema: unknown
): schema is { toJsonSchema: () => JSONSchema } {
  // ArkType schemas are functions with a toJsonSchema method
  return (
    (typeof schema === 'object' || typeof schema === 'function') &&
    schema !== null &&
    typeof (schema as { toJsonSchema?: unknown }).toJsonSchema === 'function'
  );
}

/**
 * Convert ArkType schema to JSON Schema (sync)
 *
 * ArkType has built-in toJsonSchema() method on every Type
 */
export function arktypeToJsonSchemaSync(schema: unknown): JSONSchema {
  if (!hasToJsonSchema(schema)) {
    throw new Error(
      'ArkType schema does not have toJsonSchema method. Make sure you are using arktype >= 2.0.0'
    );
  }
  return schema.toJsonSchema();
}

/**
 * Convert ArkType schema to JSON Schema (async)
 *
 * ArkType has built-in toJsonSchema() method on every Type
 */
export async function arktypeToJsonSchemaAsync(
  schema: unknown
): Promise<JSONSchema> {
  return arktypeToJsonSchemaSync(schema);
}
