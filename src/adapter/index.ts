/**
 * Adapter System
 *
 * Plugin-based schema handling with zero dependencies.
 * Supports all major schema libraries via duck typing.
 */

// Composable helpers
export {
	isJsonSchema,
	tryNativeToJsonSchema,
	withCallable,
	withCheck,
	withDecode,
	withJoiValidate,
	withSafeParse,
	withSafeParseAsync,
	withStructValidate,
	withValibotRun,
	withValibotRunAsync,
	withValidateSync,
} from './helpers.js'
// Transformer
export { toJsonSchema } from './transformer.js'
// Types and registry
export type { PartialSchemaAdapter, SchemaAdapter, SchemaConstraints } from './types.js'
export { defineAdapter, findAdapter, getAdapters, registerAdapter } from './types.js'

// Built-in adapters (auto-registers)
import './adapters/index.js'

// Export all adapters
export {
	arkTypeToJsonSchema,
	arktypeAdapter,
	effectAdapter,
	ioTsAdapter,
	joiAdapter,
	runtypesAdapter,
	superstructAdapter,
	typeboxAdapter,
	valibotAdapter,
	yupAdapter,
	zodV3Adapter,
	zodV4Adapter,
} from './adapters/index.js'
