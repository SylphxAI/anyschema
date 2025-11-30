/**
 * Register All Adapters
 *
 * Import this module to auto-register all built-in adapters.
 * Use this for backwards compatibility or when you want all adapters.
 *
 * @example
 * ```typescript
 * // Import once at app entry point
 * import '@sylphx/anyschema/register-all';
 *
 * // Now global functions work with all schema types
 * import { validate, toJsonSchema } from '@sylphx/anyschema';
 * ```
 */

import { registerAdapter } from './types.js'

// Import all adapters
import { arktypeAdapter } from './adapters/arktype.js'
import { effectAdapter } from './adapters/effect.js'
import { ioTsAdapter } from './adapters/io-ts.js'
import { joiAdapter } from './adapters/joi.js'
import { runtypesAdapter } from './adapters/runtypes.js'
import { superstructAdapter } from './adapters/superstruct.js'
import { typeboxAdapter } from './adapters/typebox.js'
import { valibotAdapter } from './adapters/valibot.js'
import { yupAdapter } from './adapters/yup.js'
import { zodV3Adapter } from './adapters/zod-v3.js'
import { zodV4Adapter } from './adapters/zod-v4.js'

// Register in order (more specific first)
registerAdapter(zodV4Adapter)
registerAdapter(zodV3Adapter)
registerAdapter(valibotAdapter)
registerAdapter(arktypeAdapter)
registerAdapter(yupAdapter)
registerAdapter(joiAdapter)
registerAdapter(ioTsAdapter)
registerAdapter(superstructAdapter)
registerAdapter(typeboxAdapter)
registerAdapter(effectAdapter)
registerAdapter(runtypesAdapter)
