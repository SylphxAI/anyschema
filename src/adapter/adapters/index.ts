/**
 * Built-in Adapters
 *
 * Auto-registers all built-in adapters.
 * Order matters - more specific first.
 */

import { registerAdapter } from '../types.js'

// Import all adapters
import { arkTypeToJsonSchema, arktypeAdapter } from './arktype.js'
import { effectAdapter } from './effect.js'
import { ioTsAdapter } from './io-ts.js'
import { joiAdapter } from './joi.js'
import { runtypesAdapter } from './runtypes.js'
import { superstructAdapter } from './superstruct.js'
import { typeboxAdapter } from './typebox.js'
import { valibotAdapter } from './valibot.js'
import { yupAdapter } from './yup.js'
import { zodV3Adapter } from './zod-v3.js'
import { zodV4Adapter } from './zod-v4.js'

// Register built-in adapters (order matters - more specific first)
// 1. Zod v4 first (check _zod before _def)
registerAdapter(zodV4Adapter)
// 2. Zod v3 (has _def + parse)
registerAdapter(zodV3Adapter)
// 3. Valibot (has kind === 'schema')
registerAdapter(valibotAdapter)
// 4. ArkType (callable + internal + json)
registerAdapter(arktypeAdapter)
// 5. Yup (has __isYupSchema__)
registerAdapter(yupAdapter)
// 6. Joi (has $_root + type + validate)
registerAdapter(joiAdapter)
// 7. io-ts (has _tag + decode + encode)
registerAdapter(ioTsAdapter)
// 8. Superstruct (has refiner + validator + coercer)
registerAdapter(superstructAdapter)
// 9. TypeBox (has TypeBox.Kind symbol)
registerAdapter(typeboxAdapter)
// 10. Effect (has Type + Encoded + ast)
registerAdapter(effectAdapter)
// 11. Runtypes (has reflect + check + guard)
registerAdapter(runtypesAdapter)

// Export for direct use
export {
	arktypeAdapter,
	arkTypeToJsonSchema,
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
}
