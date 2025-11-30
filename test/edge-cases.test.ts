/**
 * Edge Cases and Error Handling Tests
 *
 * Tests for boundary conditions, error handling, and unusual inputs.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';

import {
  validate,
  validateAsync,
  validateAny,
  is,
  parse,
  parseAsync,
  assert,
  toJsonSchema,
  toJsonSchemaSync,
  detectVendor,
  detect,
  createSchema,
  ValidationError,
} from '../src/index.js';

// ============================================================================
// Null and Undefined Handling
// ============================================================================

describe('Null and Undefined Handling', () => {
  describe('validate()', () => {
    it('should return failure for null schema', () => {
      const result = validate(null as any, 'data');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues[0].message).toContain('Unsupported');
      }
    });

    it('should return failure for undefined schema', () => {
      const result = validate(undefined as any, 'data');
      expect(result.success).toBe(false);
    });

    it('should handle null data correctly', () => {
      const schema = z.null();
      const result = validate(schema, null);
      expect(result.success).toBe(true);
    });

    it('should handle undefined data with optional fields', () => {
      const schema = z.object({ name: z.string().optional() });
      const result = validate(schema, { name: undefined });
      expect(result.success).toBe(true);
    });
  });

  describe('detectVendor()', () => {
    it('should return null for null', () => {
      expect(detectVendor(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(detectVendor(undefined)).toBeNull();
    });

    it('should return null for primitives', () => {
      expect(detectVendor(123)).toBeNull();
      expect(detectVendor('string')).toBeNull();
      expect(detectVendor(true)).toBeNull();
      expect(detectVendor(Symbol('test'))).toBeNull();
      expect(detectVendor(BigInt(123))).toBeNull();
    });
  });
});

// ============================================================================
// Empty Objects and Arrays
// ============================================================================

describe('Empty Objects and Arrays', () => {
  it('should validate empty object against empty schema', () => {
    const schema = z.object({});
    const result = validate(schema, {});
    expect(result.success).toBe(true);
  });

  it('should validate empty array', () => {
    const schema = z.array(z.string());
    const result = validate(schema, []);
    expect(result.success).toBe(true);
  });

  it('should reject non-empty object against empty schema (strict)', () => {
    const schema = z.object({}).strict();
    const result = validate(schema, { extra: 'field' });
    expect(result.success).toBe(false);
  });

  it('should handle empty string', () => {
    const schema = z.string();
    const result = validate(schema, '');
    expect(result.success).toBe(true);
  });

  it('should handle empty string with min length', () => {
    const schema = z.string().min(1);
    const result = validate(schema, '');
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Nested Structures
// ============================================================================

describe('Nested Structures', () => {
  it('should validate deeply nested objects', () => {
    const schema = z.object({
      level1: z.object({
        level2: z.object({
          level3: z.object({
            value: z.string(),
          }),
        }),
      }),
    });

    const validData = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };

    const result = validate(schema, validData);
    expect(result.success).toBe(true);
  });

  it('should report correct path for nested errors', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          age: z.number(),
        }),
      }),
    });

    const result = validate(schema, {
      user: {
        profile: {
          age: 'not a number',
        },
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues[0].path).toContain('age');
    }
  });

  it('should handle nested arrays', () => {
    const schema = z.array(z.array(z.number()));
    const result = validate(schema, [[1, 2], [3, 4], [5, 6]]);
    expect(result.success).toBe(true);
  });

  it('should handle array of objects', () => {
    const schema = z.array(z.object({ id: z.number(), name: z.string() }));
    const result = validate(schema, [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Type Coercion Edge Cases
// ============================================================================

describe('Type Coercion Edge Cases', () => {
  it('should not coerce string to number by default', () => {
    const schema = z.number();
    const result = validate(schema, '123');
    expect(result.success).toBe(false);
  });

  it('should coerce with coerce schema', () => {
    const schema = z.coerce.number();
    const result = validate(schema, '123');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(123);
    }
  });

  it('should handle NaN', () => {
    const schema = z.number();
    const result = validate(schema, NaN);
    expect(result.success).toBe(false);
  });

  it('should handle Infinity', () => {
    const schema = z.number().finite();
    const result = validate(schema, Infinity);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Union and Intersection Types
// ============================================================================

describe('Union and Intersection Types', () => {
  it('should validate union types', () => {
    const schema = z.union([z.string(), z.number()]);

    expect(validate(schema, 'hello').success).toBe(true);
    expect(validate(schema, 123).success).toBe(true);
    expect(validate(schema, true).success).toBe(false);
  });

  it('should validate discriminated unions', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('a'), valueA: z.string() }),
      z.object({ type: z.literal('b'), valueB: z.number() }),
    ]);

    expect(validate(schema, { type: 'a', valueA: 'test' }).success).toBe(true);
    expect(validate(schema, { type: 'b', valueB: 123 }).success).toBe(true);
    expect(validate(schema, { type: 'c' }).success).toBe(false);
  });

  it('should validate intersection types', () => {
    const schema = z.intersection(
      z.object({ name: z.string() }),
      z.object({ age: z.number() })
    );

    expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true);
    expect(validate(schema, { name: 'John' }).success).toBe(false);
  });
});

// ============================================================================
// Special Values
// ============================================================================

describe('Special Values', () => {
  it('should handle Date objects', () => {
    const schema = z.date();
    const result = validate(schema, new Date());
    expect(result.success).toBe(true);
  });

  it('should reject invalid Date', () => {
    const schema = z.date();
    const result = validate(schema, new Date('invalid'));
    expect(result.success).toBe(false);
  });

  it('should handle regex', () => {
    const schema = z.string().regex(/^[a-z]+$/);
    expect(validate(schema, 'abc').success).toBe(true);
    expect(validate(schema, 'ABC').success).toBe(false);
    expect(validate(schema, '123').success).toBe(false);
  });

  it('should handle enum', () => {
    const schema = z.enum(['red', 'green', 'blue']);
    expect(validate(schema, 'red').success).toBe(true);
    expect(validate(schema, 'yellow').success).toBe(false);
  });

  it('should handle literal', () => {
    const schema = z.literal('exact');
    expect(validate(schema, 'exact').success).toBe(true);
    expect(validate(schema, 'other').success).toBe(false);
  });
});

// ============================================================================
// Error Handling
// ============================================================================

describe('Error Handling', () => {
  describe('ValidationError', () => {
    it('should be thrown by parse() on invalid input', () => {
      const schema = z.string();
      expect(() => parse(schema, 123)).toThrow(ValidationError);
    });

    it('should contain issues array', () => {
      const schema = z.string();
      try {
        parse(schema, 123);
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect((e as ValidationError).issues).toBeDefined();
        expect((e as ValidationError).issues.length).toBeGreaterThan(0);
      }
    });

    it('should have descriptive message', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      try {
        parse(schema, { name: 123, age: 'invalid' });
      } catch (e) {
        expect((e as ValidationError).message).toBeTruthy();
      }
    });

    it('should be thrown by assert() on invalid input', () => {
      const schema = z.number();
      expect(() => assert(schema, 'not a number')).toThrow(ValidationError);
    });
  });

  describe('toJsonSchema errors', () => {
    it('should throw for unsupported schema', async () => {
      await expect(toJsonSchema({} as any)).rejects.toThrow();
    });

    it('should throw sync for unsupported schema', () => {
      expect(() => toJsonSchemaSync({} as any)).toThrow();
    });
  });
});

// ============================================================================
// Async Edge Cases
// ============================================================================

describe('Async Edge Cases', () => {
  it('should handle async validation on sync schema', async () => {
    const schema = z.string();
    const result = await validateAsync(schema, 'hello');
    expect(result.success).toBe(true);
  });

  it('should handle parseAsync on sync schema', async () => {
    const schema = z.number();
    const result = await parseAsync(schema, 123);
    expect(result).toBe(123);
  });

  it('should throw on parseAsync with invalid data', async () => {
    const schema = z.string();
    await expect(parseAsync(schema, 123)).rejects.toThrow(ValidationError);
  });
});

// ============================================================================
// Type Guard Edge Cases
// ============================================================================

describe('Type Guard Edge Cases', () => {
  it('is() should return false for wrong type', () => {
    const schema = z.string();
    expect(is(schema, 123)).toBe(false);
    expect(is(schema, null)).toBe(false);
    expect(is(schema, undefined)).toBe(false);
    expect(is(schema, {})).toBe(false);
    expect(is(schema, [])).toBe(false);
  });

  it('is() should work with complex schemas', () => {
    const schema = z.object({
      users: z.array(z.object({
        id: z.number(),
        name: z.string(),
      })),
    });

    const validData = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    };

    const invalidData = {
      users: [
        { id: '1', name: 'Alice' }, // id should be number
      ],
    };

    expect(is(schema, validData)).toBe(true);
    expect(is(schema, invalidData)).toBe(false);
  });
});

// ============================================================================
// Multiple Issues
// ============================================================================

describe('Multiple Issues', () => {
  it('should collect multiple validation errors', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    });

    const result = validate(schema, {
      name: 123,
      age: 'not a number',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.length).toBeGreaterThan(1);
    }
  });

  it('ValidationError should combine multiple messages', () => {
    const error = new ValidationError([
      { message: 'Error 1' },
      { message: 'Error 2' },
      { message: 'Error 3' },
    ]);

    expect(error.message).toBe('Error 1; Error 2; Error 3');
    expect(error.issues.length).toBe(3);
  });
});

// ============================================================================
// Cross-Library Consistency
// ============================================================================

describe('Cross-Library Consistency', () => {
  const testData = {
    valid: { name: 'John', age: 30 },
    invalid: { name: 123, age: 'thirty' },
  };

  it('Zod and Valibot should produce consistent results', () => {
    const zodSchema = z.object({ name: z.string(), age: z.number() });
    const valibotSchema = v.object({ name: v.string(), age: v.number() });

    const zodValid = validate(zodSchema, testData.valid);
    const valibotValid = validate(valibotSchema, testData.valid);

    expect(zodValid.success).toBe(valibotValid.success);
    expect(zodValid.success).toBe(true);

    const zodInvalid = validate(zodSchema, testData.invalid);
    const valibotInvalid = validate(valibotSchema, testData.invalid);

    expect(zodInvalid.success).toBe(valibotInvalid.success);
    expect(zodInvalid.success).toBe(false);
  });

  it('All libraries should reject null for required fields', () => {
    const zodSchema = z.object({ name: z.string() });
    const valibotSchema = v.object({ name: v.string() });
    const arktypeSchema = type({ name: 'string' });

    expect(validate(zodSchema, { name: null }).success).toBe(false);
    expect(validate(valibotSchema, { name: null }).success).toBe(false);
    expect(validate(arktypeSchema, { name: null }).success).toBe(false);
  });
});

// ============================================================================
// createSchema Edge Cases
// ============================================================================

describe('createSchema Edge Cases', () => {
  it('should handle validation that always fails', () => {
    const failSchema = createSchema<never>({
      vendor: 'test',
      validate: () => ({
        success: false,
        issues: [{ message: 'Always fails' }],
      }),
    });

    expect(validate(failSchema, 'anything').success).toBe(false);
    expect(validate(failSchema, null).success).toBe(false);
    expect(validate(failSchema, {}).success).toBe(false);
  });

  it('should handle validation that always succeeds', () => {
    const anySchema = createSchema<unknown>({
      vendor: 'test',
      validate: (data) => ({ success: true, data }),
    });

    expect(validate(anySchema, 'anything').success).toBe(true);
    expect(validate(anySchema, null).success).toBe(true);
    expect(validate(anySchema, {}).success).toBe(true);
  });

  it('should handle async validation in protocol schema', async () => {
    const asyncSchema = createSchema<string>({
      vendor: 'test',
      validate: (data) =>
        typeof data === 'string'
          ? { success: true, data }
          : { success: false, issues: [{ message: 'Expected string' }] },
      validateAsync: async (data) => {
        await new Promise((r) => setTimeout(r, 10));
        return typeof data === 'string'
          ? { success: true, data }
          : { success: false, issues: [{ message: 'Expected string (async)' }] };
      },
    });

    const result = await validateAsync(asyncSchema, 'hello');
    expect(result.success).toBe(true);
  });
});
