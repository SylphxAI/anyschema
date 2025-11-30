import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { JSONSchema } from './json-schema.js';
import type { WithToJsonSchema } from './types.js';
import { getVendor, supportsToJsonSchema } from './vendor.js';
import { getSyncAdapter, getAsyncAdapter } from './adapters/index.js';

/**
 * Convert a Standard Schema to JSON Schema (sync)
 *
 * This function automatically detects the schema vendor and calls
 * the appropriate toJsonSchema converter.
 *
 * @param schema - A Standard Schema from a supported vendor (zod, valibot, arktype, typebox, effect)
 * @returns JSON Schema representation of the input schema
 * @throws Error if the vendor is not supported or if the peer dependency is missing
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { toJsonSchema } from 'standard-schema-to-json';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * const jsonSchema = toJsonSchema(schema);
 * // { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } }, ... }
 * ```
 */
export function toJsonSchema<T extends StandardSchemaV1>(
  schema: WithToJsonSchema<T>
): JSONSchema {
  const vendor = getVendor(schema);
  const adapter = getSyncAdapter(vendor);

  if (!adapter) {
    throw new Error(
      `Unsupported vendor: "${vendor}". ` +
        `Supported vendors are: zod, valibot, arktype, typebox, effect`
    );
  }

  try {
    return adapter(schema);
  } catch (error) {
    // Check if it's a module not found error (missing peer dependency)
    if (
      error instanceof Error &&
      (error.message.includes('Cannot find module') ||
        error.message.includes('MODULE_NOT_FOUND'))
    ) {
      throw new Error(
        `Missing peer dependency for vendor "${vendor}". ` +
          `Please install the required packages. ` +
          `See documentation for the list of peer dependencies.`,
        { cause: error }
      );
    }
    throw error;
  }
}

/**
 * Convert a Standard Schema to JSON Schema (async)
 *
 * This function automatically detects the schema vendor and calls
 * the appropriate toJsonSchema converter using dynamic imports.
 *
 * @param schema - A Standard Schema from a supported vendor (zod, valibot, arktype, typebox, effect)
 * @returns Promise resolving to JSON Schema representation of the input schema
 * @throws Error if the vendor is not supported or if the peer dependency is missing
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { toJsonSchemaAsync } from 'standard-schema-to-json';
 *
 * const schema = v.object({
 *   name: v.string(),
 *   age: v.number(),
 * });
 *
 * const jsonSchema = await toJsonSchemaAsync(schema);
 * // { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } }, ... }
 * ```
 */
export async function toJsonSchemaAsync<T extends StandardSchemaV1>(
  schema: WithToJsonSchema<T>
): Promise<JSONSchema> {
  const vendor = getVendor(schema);
  const adapter = getAsyncAdapter(vendor);

  if (!adapter) {
    throw new Error(
      `Unsupported vendor: "${vendor}". ` +
        `Supported vendors are: zod, valibot, arktype, typebox, effect`
    );
  }

  try {
    return await adapter(schema);
  } catch (error) {
    // Check if it's a module not found error (missing peer dependency)
    if (
      error instanceof Error &&
      (error.message.includes('Cannot find module') ||
        error.message.includes('Failed to resolve module'))
    ) {
      throw new Error(
        `Missing peer dependency for vendor "${vendor}". ` +
          `Please install the required packages. ` +
          `See documentation for the list of peer dependencies.`,
        { cause: error }
      );
    }
    throw error;
  }
}

// Re-export types
export type {
  JSONSchema,
  JSONSchemaType,
} from './json-schema.js';

export type {
  SupportedVendor,
  WithToJsonSchema,
  StandardSchemaWithVendor,
  SupportedStandardSchema,
  InferInput,
  InferOutput,
  ExtractVendor,
} from './types.js';

export { SUPPORTED_VENDORS } from './types.js';

// Re-export vendor utilities
export {
  getVendor,
  isSupportedVendor,
  supportsToJsonSchema,
  normalizeVendor,
} from './vendor.js';

// Re-export individual adapters for direct use
export {
  zodToJsonSchemaSync,
  zodToJsonSchemaAsync,
  valibotToJsonSchemaSync,
  valibotToJsonSchemaAsync,
  arktypeToJsonSchemaSync,
  arktypeToJsonSchemaAsync,
} from './adapters/index.js';
