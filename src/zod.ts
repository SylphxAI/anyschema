/**
 * Zod utilities for AnySchema
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { toJsonSchema, validate } from 'anyschema/zod';
 *
 * const schema = z.object({ name: z.string() });
 * const jsonSchema = toJsonSchema(schema);
 * const result = validate(schema, { name: 'John' });
 * ```
 */

// Type-only import - erased at runtime, zero cost
import type { ZodType } from 'zod';
import type { JSONSchema, ValidationResult, ValidationIssue } from './types.js';

export type { JSONSchema };

/**
 * Convert Zod schema to JSON Schema
 *
 * Requires `zod-to-json-schema` as peer dependency
 */
export function toJsonSchema(schema: ZodType): JSONSchema {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { zodToJsonSchema } = require('zod-to-json-schema') as {
    zodToJsonSchema: (schema: ZodType) => JSONSchema;
  };
  return zodToJsonSchema(schema);
}

/**
 * Convert Zod schema to JSON Schema (async version)
 *
 * Uses dynamic import for better tree-shaking
 */
export async function toJsonSchemaAsync(schema: ZodType): Promise<JSONSchema> {
  const { zodToJsonSchema } = await import('zod-to-json-schema');
  return zodToJsonSchema(schema) as JSONSchema;
}

/**
 * Validate data against a Zod schema
 */
export function validate<T>(
  schema: ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path as (string | number)[],
  }));

  return { success: false, issues };
}
