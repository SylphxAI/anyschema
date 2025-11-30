import type { JSONSchema } from '../json-schema.js';
import { normalizeVendor } from '../vendor.js';

// Sync adapters - imported statically (not tree-shakable for sync usage)
import { zodToJsonSchemaSync } from './zod.js';
import { valibotToJsonSchemaSync } from './valibot.js';
import { arktypeToJsonSchemaSync } from './arktype.js';

export type AdapterSync = (schema: unknown) => JSONSchema;
export type AdapterAsync = (schema: unknown) => Promise<JSONSchema>;

/**
 * Registry of sync adapters by normalized vendor name
 *
 * Note: Sync adapters are statically imported - not tree-shakable.
 * For tree-shaking, use toJsonSchemaAsync() which uses dynamic imports.
 */
const syncAdapters: Record<string, AdapterSync> = {
  zod: zodToJsonSchemaSync,
  valibot: valibotToJsonSchemaSync,
  arktype: arktypeToJsonSchemaSync,
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
 * Get the async adapter for a vendor (lazy loaded via dynamic import)
 *
 * This is tree-shakable - only the used adapter code will be loaded at runtime.
 */
export async function getAsyncAdapter(vendor: string): Promise<AdapterAsync | null> {
  const normalized = normalizeVendor(vendor);
  if (!normalized) return null;

  switch (normalized) {
    case 'zod': {
      const { zodToJsonSchemaAsync } = await import('./zod.js');
      return zodToJsonSchemaAsync;
    }
    case 'valibot': {
      const { valibotToJsonSchemaAsync } = await import('./valibot.js');
      return valibotToJsonSchemaAsync;
    }
    case 'arktype': {
      const { arktypeToJsonSchemaAsync } = await import('./arktype.js');
      return arktypeToJsonSchemaAsync;
    }
    default:
      return null;
  }
}

// Re-export individual adapters for direct use (tree-shakable when imported directly)
export { zodToJsonSchemaSync, zodToJsonSchemaAsync } from './zod.js';
export { valibotToJsonSchemaSync, valibotToJsonSchemaAsync } from './valibot.js';
export { arktypeToJsonSchemaSync, arktypeToJsonSchemaAsync } from './arktype.js';
