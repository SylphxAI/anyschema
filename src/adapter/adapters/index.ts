/**
 * Built-in Adapters
 *
 * Split into validator and transformer for tree-shaking.
 * Import only what you need.
 */

// ============================================================================
// Validators (minimal - for validation only)
// ============================================================================

export { arktypeValidator } from './arktype.validator.js'
export { effectValidator } from './effect.validator.js'
export { ioTsValidator } from './io-ts.validator.js'
export { joiValidator } from './joi.validator.js'
export { runtypesValidator } from './runtypes.validator.js'
export { superstructValidator } from './superstruct.validator.js'
export { typeboxValidator } from './typebox.validator.js'
export { valibotValidator } from './valibot.validator.js'
export { yupValidator } from './yup.validator.js'
export { zodV3Validator } from './zod-v3.validator.js'
export { zodV4Validator } from './zod-v4.validator.js'

// ============================================================================
// Transformers (for JSON Schema conversion)
// ============================================================================

export { arktypeTransformer } from './arktype.transformer.js'
export { effectTransformer } from './effect.transformer.js'
export { ioTsTransformer } from './io-ts.transformer.js'
export { joiTransformer } from './joi.transformer.js'
export { runtypesTransformer } from './runtypes.transformer.js'
export { superstructTransformer } from './superstruct.transformer.js'
export { typeboxTransformer } from './typebox.transformer.js'
export { valibotTransformer } from './valibot.transformer.js'
export { yupTransformer } from './yup.transformer.js'
export { zodV3Transformer } from './zod-v3.transformer.js'
export { zodV4Transformer } from './zod-v4.transformer.js'

// ============================================================================
// Schema Types (for type inference)
// ============================================================================

export type { ArkTypeSchema } from './arktype.validator.js'
export type { EffectSchema } from './effect.validator.js'
export type { IoTsSchema } from './io-ts.validator.js'
export type { JoiSchema } from './joi.validator.js'
export type { RuntypesSchema } from './runtypes.validator.js'
export type { SuperstructSchema } from './superstruct.validator.js'
export type { TypeBoxSchema } from './typebox.validator.js'
export type { ValibotSchema } from './valibot.validator.js'
export type { YupSchema } from './yup.validator.js'
export type { ZodV3Schema } from './zod-v3.validator.js'
export type { ZodV4Schema } from './zod-v4.validator.js'
