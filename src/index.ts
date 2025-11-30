/**
 * AnySchema - Universal schema utilities
 *
 * Zero dependencies. Pure duck typing. Works with any version of any schema library.
 *
 * @example
 * ```typescript
 * import { toJsonSchema, validate, type InferOutput } from 'anyschema';
 * import { z } from 'zod';
 *
 * const schema = z.object({ name: z.string() });
 *
 * // Type inference (compile-time)
 * type Output = InferOutput<typeof schema>; // { name: string }
 *
 * // Validation (runtime)
 * const result = validate(schema, { name: 'John' });
 * if (result.success) {
 *   console.log(result.data); // typed as { name: string }
 * }
 *
 * // JSON Schema conversion
 * const jsonSchema = await toJsonSchema(schema);
 * ```
 */

// Re-export all types
export type {
  // Schema structure types
  ZodLike,
  ValibotLike,
  ArkTypeLike,
  AnySchema,
  // Type inference
  InferOutput,
  InferInput,
  IsValidSchema,
  AssertValidSchema,
  // Vendor
  SchemaVendor,
  // Validation
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationIssue,
  // JSON Schema
  JSONSchema,
} from './types.js';

// Re-export detection utilities
export { detectVendor, isZodSchema, isValibotSchema, isArkTypeSchema } from './detection.js';

// Import for internal use
import type {
  JSONSchema,
  ValidationResult,
  InferOutput,
  AssertValidSchema,
  SchemaVendor,
} from './types.js';
import { detectVendor } from './detection.js';

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate data against any supported schema
 *
 * Uses duck typing to detect schema type and call appropriate validation method.
 * Returns a unified result object with success/failure status.
 *
 * @param schema - Any supported schema (Zod, Valibot, ArkType)
 * @param data - Data to validate
 * @returns Typed validation result
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
export function validate<T>(
  schema: AssertValidSchema<T>,
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

  return validateByVendor(vendor, schema, data);
}

/**
 * Async validation for any supported schema
 */
export async function validateAsync<T>(
  schema: AssertValidSchema<T>,
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

  // For Valibot async schemas, use safeParseAsync
  if (vendor === 'valibot' && isAsyncSchema(schema)) {
    return validateValibotAsync(schema, data);
  }

  return validateByVendor(vendor, schema, data);
}

// ============================================================================
// JSON Schema Conversion
// ============================================================================

/**
 * Convert any supported schema to JSON Schema
 *
 * Automatically detects schema type and uses appropriate converter.
 * Converters are dynamically imported for tree-shaking.
 *
 * @param schema - Any supported schema
 * @returns Promise resolving to JSON Schema
 *
 * @example
 * ```typescript
 * const jsonSchema = await toJsonSchema(z.object({ name: z.string() }));
 * ```
 */
export async function toJsonSchema<T>(
  schema: AssertValidSchema<T>
): Promise<JSONSchema>;
export async function toJsonSchema(schema: unknown): Promise<JSONSchema> {
  const vendor = detectVendor(schema);

  if (!vendor) {
    throw new Error(
      'Unsupported schema type. Expected Zod, Valibot, or ArkType schema.'
    );
  }

  return toJsonSchemaByVendor(vendor, schema);
}

/**
 * Sync version of toJsonSchema
 *
 * Note: Uses require() for converters. May not work in all environments.
 */
export function toJsonSchemaSync<T>(schema: AssertValidSchema<T>): JSONSchema;
export function toJsonSchemaSync(schema: unknown): JSONSchema {
  const vendor = detectVendor(schema);

  if (!vendor) {
    throw new Error(
      'Unsupported schema type. Expected Zod, Valibot, or ArkType schema.'
    );
  }

  return toJsonSchemaSyncByVendor(vendor, schema);
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Check if schema is async (Valibot)
 */
function isAsyncSchema(schema: unknown): boolean {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'async' in schema &&
    (schema as { async: boolean }).async === true
  );
}

/**
 * Check if object/function has a method
 */
function hasMethod(obj: unknown, method: string): boolean {
  if (obj === null || obj === undefined) return false;
  // Check both objects and functions (ArkType schemas are functions)
  if (typeof obj !== 'object' && typeof obj !== 'function') return false;
  return (
    method in obj &&
    typeof (obj as Record<string, unknown>)[method] === 'function'
  );
}

/**
 * Validate by vendor - runtime duck typing
 */
function validateByVendor(
  vendor: SchemaVendor,
  schema: unknown,
  data: unknown
): ValidationResult<unknown> {
  switch (vendor) {
    case 'zod':
      return validateZod(schema, data);
    case 'valibot':
      return validateValibot(schema, data);
    case 'arktype':
      return validateArkType(schema, data);
  }
}

/**
 * Zod validation - pure duck typing
 */
function validateZod(schema: unknown, data: unknown): ValidationResult<unknown> {
  if (!hasMethod(schema, 'safeParse')) {
    return { success: false, issues: [{ message: 'Invalid Zod schema' }] };
  }

  const result = (schema as { safeParse: (d: unknown) => unknown }).safeParse(data) as {
    success: boolean;
    data?: unknown;
    error?: { issues: Array<{ message: string; path: unknown[] }> };
  };

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    issues: (result.error?.issues ?? []).map((issue) => ({
      message: issue.message,
      path: issue.path as (string | number)[],
    })),
  };
}

/**
 * Valibot validation - pure duck typing
 */
function validateValibot(schema: unknown, data: unknown): ValidationResult<unknown> {
  // Try to dynamically require valibot
  let safeParse: (s: unknown, d: unknown) => unknown;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const v = require('valibot') as { safeParse: typeof safeParse };
    safeParse = v.safeParse;
  } catch {
    return { success: false, issues: [{ message: 'valibot not installed' }] };
  }

  const result = safeParse(schema, data) as {
    success: boolean;
    output?: unknown;
    issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>;
  };

  if (result.success) {
    return { success: true, data: result.output };
  }

  return {
    success: false,
    issues: (result.issues ?? []).map((issue) => {
      const base: { message: string; path?: (string | number)[] } = {
        message: issue.message,
      };
      if (issue.path) {
        base.path = issue.path.map((p) => p.key);
      }
      return base;
    }),
  };
}

/**
 * Valibot async validation
 */
async function validateValibotAsync(
  schema: unknown,
  data: unknown
): Promise<ValidationResult<unknown>> {
  let safeParseAsync: (s: unknown, d: unknown) => Promise<unknown>;
  try {
    const v = (await import('valibot')) as { safeParseAsync: typeof safeParseAsync };
    safeParseAsync = v.safeParseAsync;
  } catch {
    return { success: false, issues: [{ message: 'valibot not installed' }] };
  }

  const result = (await safeParseAsync(schema, data)) as {
    success: boolean;
    output?: unknown;
    issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>;
  };

  if (result.success) {
    return { success: true, data: result.output };
  }

  return {
    success: false,
    issues: (result.issues ?? []).map((issue) => {
      const base: { message: string; path?: (string | number)[] } = {
        message: issue.message,
      };
      if (issue.path) {
        base.path = issue.path.map((p) => p.key);
      }
      return base;
    }),
  };
}

/**
 * ArkType validation - pure duck typing
 */
function validateArkType(schema: unknown, data: unknown): ValidationResult<unknown> {
  if (typeof schema !== 'function') {
    return { success: false, issues: [{ message: 'Invalid ArkType schema' }] };
  }

  const result = (schema as (d: unknown) => unknown)(data);

  // ArkType returns ArkErrors on failure (iterable with summary)
  if (
    result !== null &&
    typeof result === 'object' &&
    Symbol.iterator in result &&
    'summary' in result
  ) {
    return {
      success: false,
      issues: [...(result as Iterable<{ message: string; path: unknown }>)].map(
        (error) => ({
          message: error.message,
          path: error.path as unknown as (string | number)[],
        })
      ),
    };
  }

  return { success: true, data: result };
}

/**
 * Convert to JSON Schema by vendor (async)
 */
async function toJsonSchemaByVendor(
  vendor: SchemaVendor,
  schema: unknown
): Promise<JSONSchema> {
  switch (vendor) {
    case 'zod': {
      try {
        const { zodToJsonSchema } = await import('zod-to-json-schema');
        return zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0]) as JSONSchema;
      } catch {
        throw new Error(
          'zod-to-json-schema not installed. Run: npm install zod-to-json-schema'
        );
      }
    }
    case 'valibot': {
      try {
        const { toJsonSchema } = await import('@valibot/to-json-schema');
        return toJsonSchema(schema as Parameters<typeof toJsonSchema>[0]) as JSONSchema;
      } catch {
        throw new Error(
          '@valibot/to-json-schema not installed. Run: npm install @valibot/to-json-schema'
        );
      }
    }
    case 'arktype': {
      if (hasMethod(schema, 'toJsonSchema')) {
        return (schema as { toJsonSchema: () => unknown }).toJsonSchema() as JSONSchema;
      }
      throw new Error('ArkType schema does not have toJsonSchema method');
    }
  }
}

/**
 * Convert to JSON Schema by vendor (sync)
 */
function toJsonSchemaSyncByVendor(vendor: SchemaVendor, schema: unknown): JSONSchema {
  switch (vendor) {
    case 'zod': {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { zodToJsonSchema } = require('zod-to-json-schema') as {
          zodToJsonSchema: (s: unknown) => JSONSchema;
        };
        return zodToJsonSchema(schema);
      } catch {
        throw new Error(
          'zod-to-json-schema not installed. Run: npm install zod-to-json-schema'
        );
      }
    }
    case 'valibot': {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { toJsonSchema } = require('@valibot/to-json-schema') as {
          toJsonSchema: (s: unknown) => JSONSchema;
        };
        return toJsonSchema(schema);
      } catch {
        throw new Error(
          '@valibot/to-json-schema not installed. Run: npm install @valibot/to-json-schema'
        );
      }
    }
    case 'arktype': {
      if (hasMethod(schema, 'toJsonSchema')) {
        return (schema as { toJsonSchema: () => unknown }).toJsonSchema() as JSONSchema;
      }
      throw new Error('ArkType schema does not have toJsonSchema method');
    }
  }
}
