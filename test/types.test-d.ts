import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';
import type { JSONSchema, InferOutput, InferInput, ValidationResult, AnySchema } from '../src/types.js';
import { toJsonSchema, toJsonSchemaSync, validate, validateAsync } from '../src/index.js';
import { toJsonSchema as zodToJsonSchema, validate as zodValidate } from '../src/zod.js';
import { toJsonSchema as valibotToJsonSchema, validate as valibotValidate } from '../src/valibot.js';
import { toJsonSchema as arktypeToJsonSchema, validate as arktypeValidate } from '../src/arktype.js';

describe('toJsonSchema types', () => {
  it('should return Promise<JSONSchema> for async version', () => {
    expectTypeOf(toJsonSchema).returns.toEqualTypeOf<Promise<JSONSchema>>();
  });

  it('should return JSONSchema for sync version', () => {
    expectTypeOf(toJsonSchemaSync).returns.toEqualTypeOf<JSONSchema>();
  });
});

describe('InferOutput type', () => {
  it('should infer Zod output type', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    type Output = InferOutput<typeof schema>;
    expectTypeOf<Output>().toEqualTypeOf<{ name: string; age: number }>();
  });

  it('should infer Valibot output type', () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    type Output = InferOutput<typeof schema>;
    expectTypeOf<Output>().toEqualTypeOf<{ name: string; age: number }>();
  });

  it('should infer ArkType output type', () => {
    const schema = type({ name: 'string', age: 'number' });
    type Output = InferOutput<typeof schema>;
    expectTypeOf<Output>().toEqualTypeOf<{ name: string; age: number }>();
  });
});

describe('InferInput type', () => {
  it('should infer Zod input type', () => {
    const schema = z.object({ name: z.string() });
    type Input = InferInput<typeof schema>;
    expectTypeOf<Input>().toEqualTypeOf<{ name: string }>();
  });

  it('should infer Valibot input type', () => {
    const schema = v.object({ name: v.string() });
    type Input = InferInput<typeof schema>;
    expectTypeOf<Input>().toEqualTypeOf<{ name: string }>();
  });
});

describe('validate types', () => {
  it('should return ValidationResult with inferred type for Zod', () => {
    const schema = z.object({ name: z.string() });
    const result = validate(schema, {});
    expectTypeOf(result).toEqualTypeOf<ValidationResult<{ name: string }>>();
  });

  it('should return ValidationResult with inferred type for Valibot', () => {
    const schema = v.object({ name: v.string() });
    const result = validate(schema, {});
    expectTypeOf(result).toEqualTypeOf<ValidationResult<{ name: string }>>();
  });

  it('should return ValidationResult with inferred type for ArkType', () => {
    const schema = type({ name: 'string' });
    const result = validate(schema, {});
    expectTypeOf(result).toEqualTypeOf<ValidationResult<{ name: string }>>();
  });
});

describe('validateAsync types', () => {
  it('should return Promise<ValidationResult> for Zod', () => {
    const schema = z.string();
    const result = validateAsync(schema, '');
    expectTypeOf(result).toEqualTypeOf<Promise<ValidationResult<string>>>();
  });

  it('should return Promise<ValidationResult> for Valibot', () => {
    const schema = v.string();
    const result = validateAsync(schema, '');
    expectTypeOf(result).toEqualTypeOf<Promise<ValidationResult<string>>>();
  });

  it('should return Promise<ValidationResult> for ArkType', () => {
    const schema = type('string');
    const result = validateAsync(schema, '');
    expectTypeOf(result).toEqualTypeOf<Promise<ValidationResult<string>>>();
  });
});

describe('Subpath export types', () => {
  it('zodToJsonSchema should accept ZodType and return JSONSchema', () => {
    expectTypeOf(zodToJsonSchema).parameter(0).toMatchTypeOf<z.ZodType>();
    expectTypeOf(zodToJsonSchema).returns.toEqualTypeOf<JSONSchema>();
  });

  it('zodValidate should return ValidationResult', () => {
    const schema = z.string();
    expectTypeOf(zodValidate(schema, '')).toEqualTypeOf<ValidationResult<string>>();
  });

  it('valibotToJsonSchema should return JSONSchema', () => {
    expectTypeOf(valibotToJsonSchema).returns.toEqualTypeOf<JSONSchema>();
  });

  it('arktypeToJsonSchema should accept Type and return JSONSchema', () => {
    expectTypeOf(arktypeToJsonSchema).parameter(0).toMatchTypeOf<type.Any>();
    expectTypeOf(arktypeToJsonSchema).returns.toEqualTypeOf<JSONSchema>();
  });
});

describe('AnySchema type', () => {
  it('should accept Zod schemas', () => {
    const schema: AnySchema = z.string();
    expectTypeOf(schema).toMatchTypeOf<AnySchema>();
  });

  it('should accept Valibot schemas', () => {
    const schema: AnySchema = v.string();
    expectTypeOf(schema).toMatchTypeOf<AnySchema>();
  });

  it('should accept ArkType schemas', () => {
    const schema: AnySchema = type('string');
    expectTypeOf(schema).toMatchTypeOf<AnySchema>();
  });
});
