/**
 * AnySchema - Universal schema utilities
 *
 * A thin wrapper for schema libraries with zero runtime dependencies.
 * Supports Zod, Valibot, and ArkType with automatic detection.
 *
 * @example
 * ```typescript
 * import { toJsonSchema, validate, type InferOutput } from 'anyschema';
 * import { z } from 'zod';
 * import * as v from 'valibot';
 * import { type } from 'arktype';
 *
 * // Auto-detect works with any supported schema
 * await toJsonSchema(z.string());
 * await toJsonSchema(v.string());
 * await toJsonSchema(type('string'));
 *
 * // Type inference
 * const schema = z.object({ name: z.string() });
 * type Output = InferOutput<typeof schema>; // { name: string }
 *
 * // Unified validation
 * const result = validate(schema, { name: 'John' });
 * if (result.success) {
 *   console.log(result.data); // typed!
 * }
 * ```
 */

// Type-only imports - erased at runtime
import type { ZodType } from 'zod';
import type { GenericSchema, GenericSchemaAsync } from 'valibot';
import type { Type } from 'arktype';

// Re-export types
export type {
  AnySchema,
  ValibotSchema,
  InferOutput,
  InferInput,
  JSONSchema,
  SchemaVendor,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationIssue,
} from './types.js';

// Re-export detection utilities
export {
  detectVendor,
  isZodSchema,
  isValibotSchema,
  isArkTypeSchema,
} from './detection.js';

// Import types for internal use
import type {
  JSONSchema,
  AnySchema,
  ValibotSchema,
  ValidationResult,
  InferOutput,
} from './types.js';
import { detectVendor } from './detection.js';

// ============================================================================
// toJsonSchema - Convert any schema to JSON Schema
// ============================================================================

/**
 * Convert any supported schema to JSON Schema (async)
 *
 * Automatically detects the schema library and calls the appropriate converter.
 * Uses dynamic imports for tree-shaking.
 *
 * @param schema - A schema from Zod, Valibot, or ArkType
 * @returns Promise resolving to JSON Schema
 *
 * @example
 * ```typescript
 * const jsonSchema = await toJsonSchema(z.object({ name: z.string() }));
 * ```
 */
export function toJsonSchema(schema: ZodType): Promise<JSONSchema>;
export function toJsonSchema(schema: ValibotSchema): Promise<JSONSchema>;
export function toJsonSchema(schema: Type): Promise<JSONSchema>;
export function toJsonSchema(schema: AnySchema): Promise<JSONSchema>;
export async function toJsonSchema(schema: unknown): Promise<JSONSchema> {
  const vendor = detectVendor(schema);

  if (!vendor) {
    throw new Error(
      'Unsupported schema type. Expected Zod, Valibot, or ArkType schema.'
    );
  }

  switch (vendor) {
    case 'zod': {
      const { toJsonSchemaAsync } = await import('./zod.js');
      return toJsonSchemaAsync(schema as ZodType);
    }
    case 'valibot': {
      const { toJsonSchemaAsync } = await import('./valibot.js');
      return toJsonSchemaAsync(schema as ValibotSchema);
    }
    case 'arktype': {
      const { toJsonSchemaAsync } = await import('./arktype.js');
      return toJsonSchemaAsync(schema as Type);
    }
  }
}

/**
 * Convert any supported schema to JSON Schema (sync)
 *
 * Note: Uses require() which may not work in all environments.
 * Prefer the async version for better compatibility.
 */
export function toJsonSchemaSync(schema: ZodType): JSONSchema;
export function toJsonSchemaSync(schema: ValibotSchema): JSONSchema;
export function toJsonSchemaSync(schema: Type): JSONSchema;
export function toJsonSchemaSync(schema: AnySchema): JSONSchema;
export function toJsonSchemaSync(schema: unknown): JSONSchema {
  const vendor = detectVendor(schema);

  if (!vendor) {
    throw new Error(
      'Unsupported schema type. Expected Zod, Valibot, or ArkType schema.'
    );
  }

  switch (vendor) {
    case 'zod': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { zodToJsonSchema } = require('zod-to-json-schema') as {
        zodToJsonSchema: (s: unknown) => JSONSchema;
      };
      return zodToJsonSchema(schema);
    }
    case 'valibot': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@valibot/to-json-schema') as {
        toJsonSchema: (s: unknown) => JSONSchema;
      };
      return mod.toJsonSchema(schema);
    }
    case 'arktype': {
      return (schema as Type).toJsonSchema() as JSONSchema;
    }
  }
}

// ============================================================================
// validate - Unified validation API
// ============================================================================

/**
 * Validate data against any supported schema
 *
 * Returns a unified result object with success/failure status
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
export function validate<T extends ZodType>(
  schema: T,
  data: unknown
): ValidationResult<InferOutput<T>>;
export function validate<T extends ValibotSchema>(
  schema: T,
  data: unknown
): ValidationResult<InferOutput<T>>;
export function validate<T extends Type>(
  schema: T,
  data: unknown
): ValidationResult<InferOutput<T>>;
export function validate<T extends AnySchema>(
  schema: T,
  data: unknown
): ValidationResult<InferOutput<T>>;
export function validate(
  schema: unknown,
  data: unknown
): ValidationResult<unknown> {
  const vendor = detectVendor(schema);

  if (!vendor) {
    return {
      success: false,
      issues: [{ message: 'Unsupported schema type' }],
    };
  }

  switch (vendor) {
    case 'zod': {
      // Inline Zod validation
      const zodSchema = schema as ZodType;
      const result = zodSchema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        issues: result.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path as (string | number)[],
        })),
      };
    }
    case 'valibot': {
      // Inline Valibot validation
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const v = require('valibot') as {
        safeParse: (
          schema: unknown,
          data: unknown
        ) => { success: true; output: unknown } | { success: false; issues: Array<{ message: string; path?: Array<{ key: string | number }> }> };
      };
      const result = v.safeParse(schema, data);
      if (result.success) {
        return { success: true, data: result.output };
      }
      return {
        success: false,
        issues: result.issues.map((issue) => {
          const base: { message: string; path?: (string | number)[] } = { message: issue.message };
          if (issue.path) {
            base.path = issue.path.map((p) => p.key);
          }
          return base;
        }),
      };
    }
    case 'arktype': {
      // Inline ArkType validation
      const arktypeSchema = schema as Type;
      const result = arktypeSchema(data);
      // Check if result is ArkErrors (has summary and is iterable)
      if (
        result !== null &&
        typeof result === 'object' &&
        Symbol.iterator in result &&
        'summary' in result
      ) {
        return {
          success: false,
          issues: [...(result as Iterable<{ message: string; path: unknown }>)].map((error) => ({
            message: error.message,
            path: error.path as unknown as (string | number)[],
          })),
        };
      }
      return { success: true, data: result };
    }
  }
}

/**
 * Validate data against any supported schema (async)
 *
 * Required for Valibot async schemas
 */
export function validateAsync<T extends ZodType>(
  schema: T,
  data: unknown
): Promise<ValidationResult<InferOutput<T>>>;
export function validateAsync<T extends ValibotSchema>(
  schema: T,
  data: unknown
): Promise<ValidationResult<InferOutput<T>>>;
export function validateAsync<T extends Type>(
  schema: T,
  data: unknown
): Promise<ValidationResult<InferOutput<T>>>;
export function validateAsync<T extends AnySchema>(
  schema: T,
  data: unknown
): Promise<ValidationResult<InferOutput<T>>>;
export async function validateAsync(
  schema: unknown,
  data: unknown
): Promise<ValidationResult<unknown>> {
  const vendor = detectVendor(schema);

  if (!vendor) {
    return {
      success: false,
      issues: [{ message: 'Unsupported schema type' }],
    };
  }

  switch (vendor) {
    case 'zod': {
      const { validate: zodValidate } = await import('./zod.js');
      return zodValidate(schema as ZodType, data);
    }
    case 'valibot': {
      const { validateAsync: valibotValidateAsync } = await import(
        './valibot.js'
      );
      return valibotValidateAsync(
        schema as GenericSchema | GenericSchemaAsync,
        data
      );
    }
    case 'arktype': {
      const { validate: arktypeValidate } = await import('./arktype.js');
      return arktypeValidate(schema as Type, data);
    }
  }
}
