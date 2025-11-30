import { describe, expectTypeOf, it } from 'vitest';
import type {
  WithToJsonSchema,
  SupportedVendor,
  ExtractVendor,
  StandardSchemaWithVendor,
  JSONSchema,
} from '../src/index.js';
import { toJsonSchema, toJsonSchemaAsync } from '../src/index.js';

describe('WithToJsonSchema type', () => {
  it('should accept schemas with supported vendors', () => {
    type ZodSchema = StandardSchemaWithVendor<'zod'>;
    type ValibotSchema = StandardSchemaWithVendor<'valibot'>;
    type ArktypeSchema = StandardSchemaWithVendor<'arktype'>;

    expectTypeOf<WithToJsonSchema<ZodSchema>>().toEqualTypeOf<ZodSchema>();
    expectTypeOf<WithToJsonSchema<ValibotSchema>>().toEqualTypeOf<ValibotSchema>();
    expectTypeOf<WithToJsonSchema<ArktypeSchema>>().toEqualTypeOf<ArktypeSchema>();
  });

  it('should reject schemas with unsupported vendors', () => {
    type UnsupportedSchema = StandardSchemaWithVendor<'unknown-vendor'>;
    type TypeboxSchema = StandardSchemaWithVendor<'typebox'>;
    type EffectSchema = StandardSchemaWithVendor<'effect'>;

    expectTypeOf<WithToJsonSchema<UnsupportedSchema>>().toBeNever();
    expectTypeOf<WithToJsonSchema<TypeboxSchema>>().toBeNever();
    expectTypeOf<WithToJsonSchema<EffectSchema>>().toBeNever();
  });
});

describe('ExtractVendor type', () => {
  it('should extract vendor from schema', () => {
    type ZodSchema = StandardSchemaWithVendor<'zod'>;

    expectTypeOf<ExtractVendor<ZodSchema>>().toEqualTypeOf<'zod'>();
  });
});

describe('toJsonSchema function types', () => {
  it('should accept supported schemas', () => {
    type ZodSchema = StandardSchemaWithVendor<'zod'>;

    expectTypeOf(toJsonSchema<ZodSchema>).parameter(0).toEqualTypeOf<ZodSchema>();
    expectTypeOf(toJsonSchema<ZodSchema>).returns.toEqualTypeOf<JSONSchema>();
  });
});

describe('toJsonSchemaAsync function types', () => {
  it('should return Promise<JSONSchema>', () => {
    type ValibotSchema = StandardSchemaWithVendor<'valibot'>;

    expectTypeOf(toJsonSchemaAsync<ValibotSchema>).returns.toEqualTypeOf<Promise<JSONSchema>>();
  });
});

describe('SupportedVendor type', () => {
  it('should include all supported vendors', () => {
    expectTypeOf<'zod'>().toMatchTypeOf<SupportedVendor>();
    expectTypeOf<'valibot'>().toMatchTypeOf<SupportedVendor>();
    expectTypeOf<'arktype'>().toMatchTypeOf<SupportedVendor>();
  });

  it('should not include unsupported vendors', () => {
    expectTypeOf<'unknown'>().not.toMatchTypeOf<SupportedVendor>();
    expectTypeOf<'typebox'>().not.toMatchTypeOf<SupportedVendor>();
    expectTypeOf<'effect'>().not.toMatchTypeOf<SupportedVendor>();
  });
});
