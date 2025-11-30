/**
 * Valibot to JSON Schema converter
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { toJsonSchema } from 'standard-schema-to-json/valibot';
 *
 * const schema = v.object({ name: v.string() });
 * const jsonSchema = toJsonSchema(schema);
 * ```
 */

// Type-only import - erased at runtime, zero cost
import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';
import type { JSONSchema } from './types.js';

export type { JSONSchema };

type ValibotSchema = GenericSchema | GenericSchemaAsync;

/**
 * Convert Valibot schema to JSON Schema
 *
 * Requires `@valibot/to-json-schema` as peer dependency
 */
export function toJsonSchema(schema: ValibotSchema): JSONSchema {
  // Blind call - assumes @valibot/to-json-schema is installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@valibot/to-json-schema') as {
    toJsonSchema: (schema: ValibotSchema) => JSONSchema;
  };
  return mod.toJsonSchema(schema);
}

/**
 * Convert Valibot schema to JSON Schema (async version)
 *
 * Uses dynamic import for better tree-shaking in some bundlers
 */
export async function toJsonSchemaAsync(
  schema: ValibotSchema
): Promise<JSONSchema> {
  const mod = (await import('@valibot/to-json-schema')) as {
    toJsonSchema: (s: unknown) => JSONSchema;
  };
  return mod.toJsonSchema(schema);
}
