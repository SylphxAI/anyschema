import type { JSONSchema } from '../json-schema.js';

/**
 * Check if schema has Zod 4's built-in toJSONSchema method
 */
function hasBuiltInToJsonSchema(
  schema: unknown
): schema is { toJSONSchema: () => JSONSchema } {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'toJSONSchema' in schema &&
    typeof (schema as Record<string, unknown>)['toJSONSchema'] === 'function'
  );
}

/**
 * Convert Zod schema to JSON Schema (sync)
 *
 * Attempts Zod 4 built-in first, then falls back to zod-to-json-schema
 */
export function zodToJsonSchemaSync(schema: unknown): JSONSchema {
  // Try Zod 4 built-in method first
  if (hasBuiltInToJsonSchema(schema)) {
    return schema.toJSONSchema();
  }

  // Fallback to zod-to-json-schema (requires sync require)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { zodToJsonSchema } = require('zod-to-json-schema') as {
    zodToJsonSchema: (schema: unknown) => JSONSchema;
  };
  return zodToJsonSchema(schema);
}

/**
 * Convert Zod schema to JSON Schema (async)
 *
 * Attempts Zod 4 built-in first, then falls back to zod-to-json-schema
 */
export async function zodToJsonSchemaAsync(schema: unknown): Promise<JSONSchema> {
  // Try Zod 4 built-in method first
  if (hasBuiltInToJsonSchema(schema)) {
    return schema.toJSONSchema();
  }

  // Fallback to zod-to-json-schema
  const { zodToJsonSchema } = (await import('zod-to-json-schema')) as {
    zodToJsonSchema: (schema: unknown) => JSONSchema;
  };
  return zodToJsonSchema(schema);
}
