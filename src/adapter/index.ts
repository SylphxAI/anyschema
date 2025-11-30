/**
 * Adapter System
 *
 * Plugin-based schema handling with zero dependencies.
 * Supports Zod v3/v4, Valibot, and ArkType.
 */

// Transformer
export { toJsonSchema } from './transformer.js'
// Types and registry
export type { PartialSchemaAdapter, SchemaAdapter, SchemaConstraints } from './types.js'
export { defineAdapter, findAdapter, getAdapters, registerAdapter } from './types.js'

// Built-in adapters (auto-registers)
import './adapters/index.js'

export {
	arkTypeToJsonSchema,
	arktypeAdapter,
	valibotAdapter,
	zodV3Adapter,
	zodV4Adapter,
} from './adapters/index.js'
