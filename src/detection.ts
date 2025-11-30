import type { SchemaVendor } from './types.js';

/**
 * Detect schema vendor using duck typing
 * Zero runtime imports - only checks object shape
 */
export function detectVendor(schema: unknown): SchemaVendor | null {
  if (schema == null) return null;

  // ArkType: schema is a function with toJsonSchema method
  if (
    typeof schema === 'function' &&
    typeof (schema as unknown as Record<string, unknown>)['toJsonSchema'] ===
      'function'
  ) {
    return 'arktype';
  }

  if (typeof schema !== 'object') return null;

  // Zod: has _def property and parse/safeParse methods
  if (
    '_def' in schema &&
    'parse' in schema &&
    typeof (schema as Record<string, unknown>)['parse'] === 'function'
  ) {
    return 'zod';
  }

  // Valibot: has kind property (schema kind) and async property
  if ('kind' in schema && 'async' in schema) {
    return 'valibot';
  }

  return null;
}

/**
 * Check if schema is a Zod schema
 */
export function isZodSchema(schema: unknown): boolean {
  return detectVendor(schema) === 'zod';
}

/**
 * Check if schema is a Valibot schema
 */
export function isValibotSchema(schema: unknown): boolean {
  return detectVendor(schema) === 'valibot';
}

/**
 * Check if schema is an ArkType schema
 */
export function isArkTypeSchema(schema: unknown): boolean {
  return detectVendor(schema) === 'arktype';
}
