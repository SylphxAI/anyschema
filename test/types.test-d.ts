import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';
import type {
  JSONSchema,
  InferOutput,
  InferInput,
  ValidationResult,
  AnySchema,
  IsValidSchema,
} from '../src/types.js';
import { toJsonSchema, toJsonSchemaSync, validate, validateAsync } from '../src/index.js';

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

  it('should return never for invalid schema', () => {
    type Output = InferOutput<{ foo: string }>;
    expectTypeOf<Output>().toEqualTypeOf<never>();
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

  it('should return never for invalid schema', () => {
    type Input = InferInput<{ foo: string }>;
    expectTypeOf<Input>().toEqualTypeOf<never>();
  });
});

describe('IsValidSchema type', () => {
  it('should return true for valid schemas', () => {
    const zodSchema = z.string();
    type IsZodValid = IsValidSchema<typeof zodSchema>;
    expectTypeOf<IsZodValid>().toEqualTypeOf<true>();

    const valibotSchema = v.string();
    type IsValibotValid = IsValidSchema<typeof valibotSchema>;
    expectTypeOf<IsValibotValid>().toEqualTypeOf<true>();

    const arktypeSchema = type('string');
    type IsArkTypeValid = IsValidSchema<typeof arktypeSchema>;
    expectTypeOf<IsArkTypeValid>().toEqualTypeOf<true>();
  });

  it('should return false for invalid schemas', () => {
    type IsInvalid = IsValidSchema<{ foo: string }>;
    expectTypeOf<IsInvalid>().toEqualTypeOf<false>();
  });
});

describe('toJsonSchema types', () => {
  it('should return Promise<JSONSchema> for async version', () => {
    const schema = z.string();
    expectTypeOf(toJsonSchema(schema)).toEqualTypeOf<Promise<JSONSchema>>();
  });

  it('should return JSONSchema for sync version', () => {
    const schema = z.string();
    expectTypeOf(toJsonSchemaSync(schema)).toEqualTypeOf<JSONSchema>();
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

describe('AnySchema type', () => {
  it('should accept Zod schemas structurally', () => {
    const schema = z.string();
    // Zod schemas match ZodLike structure
    expectTypeOf(schema).toMatchTypeOf<AnySchema>();
  });

  it('should accept Valibot schemas structurally', () => {
    const schema = v.string();
    // Valibot schemas match ValibotLike structure
    expectTypeOf(schema).toMatchTypeOf<AnySchema>();
  });

  it('should accept ArkType schemas structurally', () => {
    const schema = type('string');
    // ArkType schemas match ArkTypeLike structure
    expectTypeOf(schema).toMatchTypeOf<AnySchema>();
  });
});
