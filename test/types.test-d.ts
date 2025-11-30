import { describe, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import type * as v from 'valibot';
import type { Type } from 'arktype';
import type { JSONSchema } from '../src/types.js';
import { toJsonSchema, toJsonSchemaSync } from '../src/index.js';
import { toJsonSchema as zodToJsonSchema } from '../src/zod.js';
import { toJsonSchema as valibotToJsonSchema } from '../src/valibot.js';
import { toJsonSchema as arktypeToJsonSchema } from '../src/arktype.js';

describe('toJsonSchema types', () => {
  it('should return Promise<JSONSchema> for async version', () => {
    expectTypeOf(toJsonSchema).returns.toEqualTypeOf<Promise<JSONSchema>>();
  });

  it('should return JSONSchema for sync version', () => {
    expectTypeOf(toJsonSchemaSync).returns.toEqualTypeOf<JSONSchema>();
  });
});

describe('Subpath export types', () => {
  it('zodToJsonSchema should accept ZodType and return JSONSchema', () => {
    expectTypeOf(zodToJsonSchema).parameter(0).toMatchTypeOf<z.ZodType>();
    expectTypeOf(zodToJsonSchema).returns.toEqualTypeOf<JSONSchema>();
  });

  it('valibotToJsonSchema should accept Valibot schema and return JSONSchema', () => {
    expectTypeOf(valibotToJsonSchema).returns.toEqualTypeOf<JSONSchema>();
  });

  it('arktypeToJsonSchema should accept Type and return JSONSchema', () => {
    expectTypeOf(arktypeToJsonSchema).parameter(0).toMatchTypeOf<Type>();
    expectTypeOf(arktypeToJsonSchema).returns.toEqualTypeOf<JSONSchema>();
  });
});
