/**
 * Protocol Integration Tests
 *
 * Tests for AnySchema Protocol v1 and Standard Schema v1 compatibility.
 */
import { describe, it, expect } from 'vitest';
import {
  validate,
  validateAsync,
  is,
  parse,
  assert,
  toJsonSchema,
  toJsonSchemaSync,
  getMetadata,
  createSchema,
  detectVendor,
  detect,
  isAnySchemaProtocol,
  isStandardSchema,
  ValidationError,
  type AnySchemaV1,
  type ValidationResult,
  type JSONSchema,
  type InferOutput,
} from '../src/index.js';

// ============================================================================
// AnySchema Protocol v1 Tests
// ============================================================================

describe('AnySchema Protocol v1', () => {
  describe('Basic Schema Creation', () => {
    it('should create a string schema', () => {
      const stringSchema = createSchema<string>({
        vendor: 'test-lib',
        validate: (data) => {
          if (typeof data === 'string') {
            return { success: true, data };
          }
          return { success: false, issues: [{ message: 'Expected string' }] };
        },
      });

      expect(isAnySchemaProtocol(stringSchema)).toBe(true);
      expect(validate(stringSchema, 'hello').success).toBe(true);
      expect(validate(stringSchema, 123).success).toBe(false);
    });

    it('should create a number schema', () => {
      const numberSchema = createSchema<number>({
        vendor: 'test-lib',
        validate: (data) => {
          if (typeof data === 'number' && !isNaN(data)) {
            return { success: true, data };
          }
          return { success: false, issues: [{ message: 'Expected number' }] };
        },
      });

      expect(validate(numberSchema, 42).success).toBe(true);
      expect(validate(numberSchema, 'hello').success).toBe(false);
      expect(validate(numberSchema, NaN).success).toBe(false);
    });

    it('should create a boolean schema', () => {
      const boolSchema = createSchema<boolean>({
        vendor: 'test-lib',
        validate: (data) => {
          if (typeof data === 'boolean') {
            return { success: true, data };
          }
          return { success: false, issues: [{ message: 'Expected boolean' }] };
        },
      });

      expect(validate(boolSchema, true).success).toBe(true);
      expect(validate(boolSchema, false).success).toBe(true);
      expect(validate(boolSchema, 'true').success).toBe(false);
    });

    it('should create an object schema', () => {
      interface User {
        name: string;
        age: number;
      }

      const userSchema = createSchema<User>({
        vendor: 'test-lib',
        validate: (data) => {
          if (
            typeof data === 'object' &&
            data !== null &&
            typeof (data as any).name === 'string' &&
            typeof (data as any).age === 'number'
          ) {
            return { success: true, data: data as User };
          }
          return { success: false, issues: [{ message: 'Expected User object' }] };
        },
      });

      expect(validate(userSchema, { name: 'John', age: 30 }).success).toBe(true);
      expect(validate(userSchema, { name: 'John' }).success).toBe(false);
      expect(validate(userSchema, null).success).toBe(false);
    });

    it('should create an array schema', () => {
      const arraySchema = createSchema<string[]>({
        vendor: 'test-lib',
        validate: (data) => {
          if (Array.isArray(data) && data.every((item) => typeof item === 'string')) {
            return { success: true, data };
          }
          return { success: false, issues: [{ message: 'Expected string array' }] };
        },
      });

      expect(validate(arraySchema, ['a', 'b', 'c']).success).toBe(true);
      expect(validate(arraySchema, []).success).toBe(true);
      expect(validate(arraySchema, [1, 2, 3]).success).toBe(false);
    });
  });

  describe('Protocol Detection', () => {
    it('should detect vendor from protocol schema', () => {
      const schema = createSchema<string>({
        vendor: 'my-custom-lib',
        validate: (d) =>
          typeof d === 'string'
            ? { success: true, data: d }
            : { success: false, issues: [{ message: '' }] },
      });

      expect(detectVendor(schema)).toBe('my-custom-lib');
    });

    it('should return anyschema type in detect()', () => {
      const schema = createSchema<string>({
        vendor: 'my-lib',
        validate: (d) =>
          typeof d === 'string'
            ? { success: true, data: d }
            : { success: false, issues: [{ message: '' }] },
      });

      const result = detect(schema);
      expect(result).toEqual({ type: 'anyschema', vendor: 'my-lib' });
    });

    it('should take priority over Standard Schema', () => {
      // Schema that implements both protocols
      const dualProtocolSchema = {
        '~anyschema': {
          version: 1,
          vendor: 'anyschema-vendor',
        },
        '~types': {
          input: null as unknown as string,
          output: null as unknown as string,
        },
        '~validate': (data: unknown): ValidationResult<string> =>
          typeof data === 'string'
            ? { success: true, data }
            : { success: false, issues: [{ message: '' }] },
        '~standard': {
          version: 1,
          vendor: 'standard-vendor',
          validate: (data: unknown) => ({ value: data }),
        },
      };

      // AnySchema should take priority
      const result = detect(dualProtocolSchema);
      expect(result?.type).toBe('anyschema');
      expect(result?.vendor).toBe('anyschema-vendor');
    });
  });

  describe('JSON Schema Support', () => {
    it('should convert protocol schema to JSON Schema', async () => {
      const emailSchema = createSchema<string>({
        vendor: 'test-lib',
        validate: (data) =>
          typeof data === 'string' && data.includes('@')
            ? { success: true, data }
            : { success: false, issues: [{ message: 'Invalid email' }] },
        toJsonSchema: () => ({
          type: 'string',
          format: 'email',
        }),
      });

      const jsonSchema = await toJsonSchema(emailSchema);
      expect(jsonSchema.type).toBe('string');
      expect(jsonSchema.format).toBe('email');
    });

    it('should convert sync to JSON Schema', () => {
      const intSchema = createSchema<number>({
        vendor: 'test-lib',
        validate: (data) =>
          typeof data === 'number' && Number.isInteger(data)
            ? { success: true, data }
            : { success: false, issues: [{ message: 'Expected integer' }] },
        toJsonSchema: () => ({
          type: 'integer',
          minimum: 0,
        }),
      });

      const jsonSchema = toJsonSchemaSync(intSchema);
      expect(jsonSchema.type).toBe('integer');
      expect(jsonSchema.minimum).toBe(0);
    });

    it('should handle complex JSON Schema', async () => {
      interface Address {
        street: string;
        city: string;
        zipCode: string;
      }

      const addressSchema = createSchema<Address>({
        vendor: 'test-lib',
        validate: (data) => {
          const d = data as any;
          if (
            typeof d?.street === 'string' &&
            typeof d?.city === 'string' &&
            typeof d?.zipCode === 'string'
          ) {
            return { success: true, data: d as Address };
          }
          return { success: false, issues: [{ message: 'Invalid address' }] };
        },
        toJsonSchema: () => ({
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string', pattern: '^[0-9]{5}$' },
          },
          required: ['street', 'city', 'zipCode'],
        }),
      });

      const jsonSchema = await toJsonSchema(addressSchema);
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toBeDefined();
      expect(jsonSchema.required).toContain('street');
    });
  });

  describe('Metadata Support', () => {
    it('should extract metadata from protocol schema', () => {
      const schema = createSchema<string>({
        vendor: 'test-lib',
        validate: (d) =>
          typeof d === 'string'
            ? { success: true, data: d }
            : { success: false, issues: [{ message: '' }] },
        meta: {
          title: 'Username',
          description: 'A unique username for the user',
          examples: ['john_doe', 'jane123'],
          deprecated: false,
        },
      });

      const meta = getMetadata(schema);
      expect(meta.title).toBe('Username');
      expect(meta.description).toBe('A unique username for the user');
      expect(meta.examples).toEqual(['john_doe', 'jane123']);
      expect(meta.deprecated).toBe(false);
    });

    it('should handle partial metadata', () => {
      const schema = createSchema<string>({
        vendor: 'test-lib',
        validate: (d) =>
          typeof d === 'string'
            ? { success: true, data: d }
            : { success: false, issues: [{ message: '' }] },
        meta: {
          description: 'Just a description',
        },
      });

      const meta = getMetadata(schema);
      expect(meta.description).toBe('Just a description');
      expect(meta.title).toBeUndefined();
    });

    it('should return empty object for schema without metadata', () => {
      const schema = createSchema<string>({
        vendor: 'test-lib',
        validate: (d) =>
          typeof d === 'string'
            ? { success: true, data: d }
            : { success: false, issues: [{ message: '' }] },
      });

      const meta = getMetadata(schema);
      expect(meta).toEqual({});
    });
  });

  describe('Async Validation', () => {
    it('should use async validation when available', async () => {
      let asyncCalled = false;

      const schema = createSchema<string>({
        vendor: 'test-lib',
        validate: (data) =>
          typeof data === 'string'
            ? { success: true, data }
            : { success: false, issues: [{ message: 'sync' }] },
        validateAsync: async (data) => {
          asyncCalled = true;
          await new Promise((r) => setTimeout(r, 5));
          return typeof data === 'string'
            ? { success: true, data }
            : { success: false, issues: [{ message: 'async' }] };
        },
      });

      const result = await validateAsync(schema, 'hello');
      expect(result.success).toBe(true);
      expect(asyncCalled).toBe(true);
    });

    it('should fall back to sync validation if no async', async () => {
      const schema = createSchema<string>({
        vendor: 'test-lib',
        validate: (data) =>
          typeof data === 'string'
            ? { success: true, data }
            : { success: false, issues: [{ message: '' }] },
      });

      const result = await validateAsync(schema, 'hello');
      expect(result.success).toBe(true);
    });
  });

  describe('Type Inference', () => {
    it('should correctly infer output type', () => {
      const schema = createSchema<{ id: number; name: string }>({
        vendor: 'test-lib',
        validate: (d) => ({ success: true, data: d as any }),
      });

      type Output = InferOutput<typeof schema>;
      // TypeScript should infer { id: number; name: string }
      const result = validate(schema, { id: 1, name: 'test' });
      if (result.success) {
        // This should type-check
        const id: number = result.data.id;
        const name: string = result.data.name;
        expect(id).toBe(1);
        expect(name).toBe('test');
      }
    });

    it('should support different input/output types', () => {
      // Schema that transforms string to number
      const schema = createSchema<number, string>({
        vendor: 'test-lib',
        validate: (data) => {
          if (typeof data === 'string') {
            const num = parseInt(data, 10);
            if (!isNaN(num)) {
              return { success: true, data: num };
            }
          }
          return { success: false, issues: [{ message: 'Expected numeric string' }] };
        },
      });

      const result = validate(schema, '42');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe('number');
      }
    });
  });

  describe('is(), parse(), assert() with Protocol', () => {
    const stringSchema = createSchema<string>({
      vendor: 'test-lib',
      validate: (d) =>
        typeof d === 'string'
          ? { success: true, data: d }
          : { success: false, issues: [{ message: 'Expected string' }] },
    });

    it('is() should work with protocol schema', () => {
      expect(is(stringSchema, 'hello')).toBe(true);
      expect(is(stringSchema, 123)).toBe(false);
    });

    it('parse() should work with protocol schema', () => {
      expect(parse(stringSchema, 'hello')).toBe('hello');
      expect(() => parse(stringSchema, 123)).toThrow(ValidationError);
    });

    it('assert() should work with protocol schema', () => {
      const data: unknown = 'hello';
      assert(stringSchema, data);
      // After assert, data should be typed as string
      expect(data).toBe('hello');
    });
  });
});

// ============================================================================
// Standard Schema v1 Tests
// ============================================================================

describe('Standard Schema v1', () => {
  describe('Basic Validation', () => {
    it('should validate Standard Schema compliant objects', () => {
      const standardSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'test-standard',
          validate: (data: unknown) => {
            if (typeof data === 'string') {
              return { value: data };
            }
            return { issues: [{ message: 'Expected string' }] };
          },
        },
      };

      const validResult = validate(standardSchema as any, 'hello');
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe('hello');
      }

      const invalidResult = validate(standardSchema as any, 123);
      expect(invalidResult.success).toBe(false);
    });

    it('should handle Standard Schema with path in issues', () => {
      const standardSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'test-standard',
          validate: (data: unknown) => {
            if (typeof data === 'object' && data !== null) {
              const obj = data as Record<string, unknown>;
              if (typeof obj.name !== 'string') {
                return {
                  issues: [{ message: 'Expected string', path: ['name'] }],
                };
              }
              return { value: data };
            }
            return { issues: [{ message: 'Expected object' }] };
          },
        },
      };

      const result = validate(standardSchema as any, { name: 123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues[0].path).toContain('name');
      }
    });

    it('should handle Standard Schema with key objects in path', () => {
      const standardSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'test-standard',
          validate: (data: unknown) => ({
            issues: [{ message: 'Error', path: [{ key: 'field' }] }],
          }),
        },
      };

      const result = validate(standardSchema as any, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues[0].path).toContain('field');
      }
    });
  });

  describe('Detection', () => {
    it('should detect Standard Schema via isStandardSchema', () => {
      const standardSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ value: null }),
        },
      };

      expect(isStandardSchema(standardSchema)).toBe(true);
      expect(isStandardSchema({})).toBe(false);
      expect(isStandardSchema({ '~standard': {} })).toBe(false); // Missing required fields
    });

    it('should return standard-schema type in detect()', () => {
      const standardSchema = {
        '~standard': {
          version: 1,
          vendor: 'my-standard-lib',
          validate: () => ({ value: null }),
        },
      };

      const result = detect(standardSchema);
      expect(result).toEqual({ type: 'standard-schema', vendor: 'my-standard-lib' });
    });
  });

  describe('Async Validation', () => {
    it('should handle async Standard Schema validation', async () => {
      const standardSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'test-standard',
          validate: async (data: unknown) => {
            await new Promise((r) => setTimeout(r, 5));
            if (typeof data === 'string') {
              return { value: data };
            }
            return { issues: [{ message: 'Expected string' }] };
          },
        },
      };

      const result = await validateAsync(standardSchema as any, 'hello');
      expect(result.success).toBe(true);
    });
  });

  describe('Real-world Standard Schema Implementations', () => {
    // Zod and Valibot implement Standard Schema in recent versions
    // These are tested in their respective test files
    // Here we test the protocol behavior with mock implementations

    it('should handle Zod-style Standard Schema', () => {
      // Simulate how Zod exposes Standard Schema
      const zodLikeSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'zod',
          validate: (data: unknown) => {
            if (typeof data === 'string') {
              return { value: data };
            }
            return {
              issues: [
                {
                  message: 'Expected string, received number',
                  path: [],
                },
              ],
            };
          },
          types: {
            input: null as unknown as string,
            output: null as unknown as string,
          },
        },
        // Zod also has these for duck typing
        _def: {},
        parse: (data: unknown) => data,
        safeParse: (data: unknown) => ({ success: true, data }),
      };

      // Should be detected as standard-schema (higher priority than duck typing)
      const result = detect(zodLikeSchema);
      expect(result?.type).toBe('standard-schema');
    });

    it('should handle Valibot-style Standard Schema', () => {
      // Simulate how Valibot exposes Standard Schema
      const valibotLikeSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'valibot',
          validate: (data: unknown) => {
            if (typeof data === 'string') {
              return { value: data };
            }
            return {
              issues: [{ message: 'Invalid type: Expected string but received number' }],
            };
          },
          types: {
            input: null as unknown as string,
            output: null as unknown as string,
          },
        },
        // Valibot also has these for duck typing
        kind: 'string',
        async: false,
        types: {
          input: null as unknown as string,
          output: null as unknown as string,
        },
      };

      // Should be detected as standard-schema (higher priority than duck typing)
      const result = detect(valibotLikeSchema);
      expect(result?.type).toBe('standard-schema');
    });
  });
});

// ============================================================================
// Protocol Interoperability
// ============================================================================

describe('Protocol Interoperability', () => {
  it('AnySchema Protocol should work alongside Standard Schema', () => {
    const anySchema = createSchema<string>({
      vendor: 'anyschema-lib',
      validate: (d) =>
        typeof d === 'string'
          ? { success: true, data: d }
          : { success: false, issues: [{ message: '' }] },
    });

    const standardSchema = {
      '~standard': {
        version: 1 as const,
        vendor: 'standard-lib',
        validate: (d: unknown) =>
          typeof d === 'string' ? { value: d } : { issues: [{ message: '' }] },
      },
    };

    // Both should validate the same data correctly
    expect(validate(anySchema, 'test').success).toBe(true);
    expect(validate(standardSchema as any, 'test').success).toBe(true);

    expect(validate(anySchema, 123).success).toBe(false);
    expect(validate(standardSchema as any, 123).success).toBe(false);
  });

  it('should detect the correct protocol for each', () => {
    const anySchema = createSchema<string>({
      vendor: 'any-vendor',
      validate: (d) =>
        typeof d === 'string'
          ? { success: true, data: d }
          : { success: false, issues: [{ message: '' }] },
    });

    const standardSchema = {
      '~standard': {
        version: 1 as const,
        vendor: 'standard-vendor',
        validate: () => ({ value: '' }),
      },
    };

    expect(detect(anySchema)?.type).toBe('anyschema');
    expect(detect(standardSchema)?.type).toBe('standard-schema');
  });
});
