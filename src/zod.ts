/**
 * Zod to JSON Schema converter
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { toJsonSchema } from 'standard-schema-to-json/zod';
 *
 * const schema = z.object({ name: z.string() });
 * const jsonSchema = toJsonSchema(schema);
 * ```
 */

// Type-only import - erased at runtime, zero cost
import type { ZodType } from 'zod';
import type { JSONSchema } from './types.js';

export type { JSONSchema };

/**
 * Convert Zod schema to JSON Schema
 *
 * Requires `zod-to-json-schema` as peer dependency
 */
export function toJsonSchema(schema: ZodType): JSONSchema {
  // Blind call - assumes zod-to-json-schema is installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { zodToJsonSchema } = require('zod-to-json-schema') as {
    zodToJsonSchema: (schema: ZodType) => JSONSchema;
  };
  return zodToJsonSchema(schema);
}

/**
 * Convert Zod schema to JSON Schema (async version)
 *
 * Uses dynamic import for better tree-shaking in some bundlers
 */
export async function toJsonSchemaAsync(schema: ZodType): Promise<JSONSchema> {
  const { zodToJsonSchema } = await import('zod-to-json-schema');
  return zodToJsonSchema(schema) as JSONSchema;
}
