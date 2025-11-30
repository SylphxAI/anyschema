import type { JSONSchema } from '../json-schema.js';

/**
 * Convert Valibot schema to JSON Schema (sync)
 */
export function valibotToJsonSchemaSync(schema: unknown): JSONSchema {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { toJsonSchema } = require('@valibot/to-json-schema') as {
    toJsonSchema: (schema: unknown) => JSONSchema;
  };
  return toJsonSchema(schema);
}

/**
 * Convert Valibot schema to JSON Schema (async)
 */
export async function valibotToJsonSchemaAsync(
  schema: unknown
): Promise<JSONSchema> {
  const { toJsonSchema } = (await import('@valibot/to-json-schema')) as {
    toJsonSchema: (schema: unknown) => JSONSchema;
  };
  return toJsonSchema(schema);
}
