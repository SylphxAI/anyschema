/**
 * Valibot utilities for AnySchema
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { toJsonSchema, validate } from 'anyschema/valibot';
 *
 * const schema = v.object({ name: v.string() });
 * const jsonSchema = toJsonSchema(schema);
 * const result = validate(schema, { name: 'John' });
 * ```
 */

// Type-only import - erased at runtime, zero cost
import type { GenericSchema, GenericSchemaAsync } from 'valibot';
import type { JSONSchema, ValidationResult, ValidationIssue } from './types.js';

export type { JSONSchema };

type ValibotSchema = GenericSchema | GenericSchemaAsync;

/**
 * Convert Valibot schema to JSON Schema
 *
 * Requires `@valibot/to-json-schema` as peer dependency
 */
export function toJsonSchema(schema: ValibotSchema): JSONSchema {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@valibot/to-json-schema') as {
    toJsonSchema: (schema: unknown) => JSONSchema;
  };
  return mod.toJsonSchema(schema);
}

/**
 * Convert Valibot schema to JSON Schema (async version)
 *
 * Uses dynamic import for better tree-shaking
 */
export async function toJsonSchemaAsync(
  schema: ValibotSchema
): Promise<JSONSchema> {
  const mod = (await import('@valibot/to-json-schema')) as {
    toJsonSchema: (s: unknown) => JSONSchema;
  };
  return mod.toJsonSchema(schema);
}

/**
 * Validate data against a Valibot schema (sync)
 */
export function validate<I, O>(
  schema: GenericSchema<I, O>,
  data: unknown
): ValidationResult<O> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v = require('valibot') as {
    safeParse: (
      schema: unknown,
      data: unknown
    ) => ValibotResult<O>;
  };

  const result = v.safeParse(schema, data);
  return normalizeResult(result);
}

/**
 * Validate data against a Valibot schema (async)
 */
export async function validateAsync<I, O>(
  schema: GenericSchema<I, O> | GenericSchemaAsync<I, O>,
  data: unknown
): Promise<ValidationResult<O>> {
  const v = (await import('valibot')) as {
    safeParseAsync: (
      schema: unknown,
      data: unknown
    ) => Promise<ValibotResult<O>>;
  };

  const result = await v.safeParseAsync(schema, data);
  return normalizeResult(result);
}

// Internal types
type ValibotResult<O> =
  | { success: true; output: O }
  | { success: false; issues: Array<{ message: string; path?: Array<{ key: string | number }> }> };

function normalizeResult<O>(result: ValibotResult<O>): ValidationResult<O> {
  if (result.success) {
    return { success: true, data: result.output };
  }

  const issues: ValidationIssue[] = result.issues.map((issue) => {
    const base: ValidationIssue = { message: issue.message };
    if (issue.path) {
      base.path = issue.path.map((p) => p.key);
    }
    return base;
  });

  return { success: false, issues };
}
