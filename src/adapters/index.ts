import type { JSONSchema } from '../json-schema.js';
import { normalizeVendor } from '../vendor.js';

import { zodToJsonSchemaSync, zodToJsonSchemaAsync } from './zod.js';
import {
  valibotToJsonSchemaSync,
  valibotToJsonSchemaAsync,
} from './valibot.js';
import {
  arktypeToJsonSchemaSync,
  arktypeToJsonSchemaAsync,
} from './arktype.js';

export type AdapterSync = (schema: unknown) => JSONSchema;
export type AdapterAsync = (schema: unknown) => Promise<JSONSchema>;

/**
 * Registry of sync adapters by normalized vendor name
 */
const syncAdapters: Record<string, AdapterSync> = {
  zod: zodToJsonSchemaSync,
  valibot: valibotToJsonSchemaSync,
  arktype: arktypeToJsonSchemaSync,
};

/**
 * Registry of async adapters by normalized vendor name
 */
const asyncAdapters: Record<string, AdapterAsync> = {
  zod: zodToJsonSchemaAsync,
  valibot: valibotToJsonSchemaAsync,
  arktype: arktypeToJsonSchemaAsync,
};

/**
 * Get the sync adapter for a vendor
 */
export function getSyncAdapter(vendor: string): AdapterSync | null {
  const normalized = normalizeVendor(vendor);
  if (!normalized) return null;
  return syncAdapters[normalized] ?? null;
}

/**
 * Get the async adapter for a vendor
 */
export function getAsyncAdapter(vendor: string): AdapterAsync | null {
  const normalized = normalizeVendor(vendor);
  if (!normalized) return null;
  return asyncAdapters[normalized] ?? null;
}

// Re-export individual adapters for direct use
export {
  zodToJsonSchemaSync,
  zodToJsonSchemaAsync,
  valibotToJsonSchemaSync,
  valibotToJsonSchemaAsync,
  arktypeToJsonSchemaSync,
  arktypeToJsonSchemaAsync,
};
