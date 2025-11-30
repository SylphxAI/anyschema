/**
 * Built-in Adapters
 *
 * Auto-registers all built-in adapters.
 */

import { registerAdapter } from '../types.js'
import { arkTypeToJsonSchema, arktypeAdapter } from './arktype.js'
import { valibotAdapter } from './valibot.js'
import { zodV3Adapter } from './zod-v3.js'
import { zodV4Adapter } from './zod-v4.js'

// Register built-in adapters (order matters - more specific first)
registerAdapter(zodV4Adapter)
registerAdapter(zodV3Adapter)
registerAdapter(valibotAdapter)
registerAdapter(arktypeAdapter)

// Export for direct use
export { zodV4Adapter, zodV3Adapter, valibotAdapter, arktypeAdapter, arkTypeToJsonSchema }
