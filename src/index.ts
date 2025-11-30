/**
 * Universal schema to JSON Schema converter
 *
 * Supports Zod, Valibot, and ArkType with automatic detection.
 *
 * @example
 * ```typescript
 * import { toJsonSchema } from 'standard-schema-to-json';
 * import { z } from 'zod';
 * import * as v from 'valibot';
 * import { type } from 'arktype';
 *
 * // Auto-detect works with any supported schema
 * await toJsonSchema(z.string());
 * await toJsonSchema(v.string());
 * await toJsonSchema(type('string'));
 * ```
 */

// Type-only imports - erased at runtime
import type { ZodType } from 'zod';
import type { GenericSchema, GenericSchemaAsync } from 'valibot';
import type { Type } from 'arktype';
import type { JSONSchema, SchemaVendor } from './types.js';
import { detectVendor } from './detection.js';

// Re-export types
export type { JSONSchema, SchemaVendor };
export {
  detectVendor,
  isZodSchema,
  isValibotSchema,
  isArkTypeSchema,
} from './detection.js';

type ValibotSchema = GenericSchema | GenericSchemaAsync;
type AnySchema = ZodType | ValibotSchema | Type;

/**
 * Convert any supported schema to JSON Schema
 *
 * Automatically detects the schema library and calls the appropriate converter.
 * Uses dynamic imports for tree-shaking - only loads the converter you need.
 *
 * @param schema - A schema from Zod, Valibot, or ArkType
 * @returns Promise resolving to JSON Schema
 * @throws Error if schema type is not supported or peer dependency is missing
 *
 * @example
 * ```typescript
 * // Works with any supported schema library
 * const jsonSchema = await toJsonSchema(z.object({ name: z.string() }));
 * ```
 */
// Function overloads for type safety
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

  try {
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
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Cannot find module') ||
        error.message.includes('MODULE_NOT_FOUND'))
    ) {
      const peerDep =
        vendor === 'zod'
          ? 'zod-to-json-schema'
          : vendor === 'valibot'
            ? '@valibot/to-json-schema'
            : 'arktype';

      throw new Error(
        `Missing peer dependency: ${peerDep}. ` +
          `Please install it: npm install ${peerDep}`,
        { cause: error }
      );
    }
    throw error;
  }
}

/**
 * Synchronous version - converts any supported schema to JSON Schema
 *
 * Note: Uses require() which may not work in all environments.
 * Prefer the async version (toJsonSchema) for better compatibility.
 *
 * @param schema - A schema from Zod, Valibot, or ArkType
 * @returns JSON Schema
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

  try {
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
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Cannot find module') ||
        error.message.includes('MODULE_NOT_FOUND'))
    ) {
      const peerDep =
        vendor === 'zod'
          ? 'zod-to-json-schema'
          : vendor === 'valibot'
            ? '@valibot/to-json-schema'
            : 'arktype';

      throw new Error(
        `Missing peer dependency: ${peerDep}. ` +
          `Please install it: npm install ${peerDep}`,
        { cause: error }
      );
    }
    throw error;
  }
}
