import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  SUPPORTED_VENDORS,
  type SupportedVendor,
  type WithToJsonSchema,
} from './types.js';

/**
 * Extract the vendor name from a StandardSchema
 */
export function getVendor(schema: StandardSchemaV1): string {
  return schema['~standard'].vendor;
}

/**
 * Type guard: check if a vendor string is a supported vendor
 */
export function isSupportedVendor(vendor: string): vendor is SupportedVendor {
  return (SUPPORTED_VENDORS as readonly string[]).includes(vendor);
}

/**
 * Type guard: check if a schema supports toJsonSchema conversion
 *
 * This narrows the type to ensure the vendor is supported.
 *
 * @example
 * ```typescript
 * const schema = getSchemaFromSomewhere();
 *
 * if (supportsToJsonSchema(schema)) {
 *   // TypeScript knows schema is a supported type
 *   const jsonSchema = toJsonSchema(schema);
 * }
 * ```
 */
export function supportsToJsonSchema<T extends StandardSchemaV1>(
  schema: T
): schema is WithToJsonSchema<T> {
  return isSupportedVendor(getVendor(schema));
}

/**
 * Normalize vendor name to canonical form
 */
export function normalizeVendor(vendor: string): SupportedVendor | null {
  switch (vendor) {
    case 'zod':
      return 'zod';
    case 'valibot':
      return 'valibot';
    case 'arktype':
      return 'arktype';
    default:
      return null;
  }
}
