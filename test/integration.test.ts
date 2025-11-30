import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';

import {
  toJsonSchema,
  toJsonSchemaSync,
  detectVendor,
  isZodSchema,
  isValibotSchema,
  isArkTypeSchema,
} from '../src/index.js';

// Subpath imports
import { toJsonSchema as zodToJsonSchema } from '../src/zod.js';
import { toJsonSchema as valibotToJsonSchema } from '../src/valibot.js';
import { toJsonSchema as arktypeToJsonSchema } from '../src/arktype.js';

describe('Auto-detect toJsonSchema (async)', () => {
  it('should convert Zod schema', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = await toJsonSchema(schema);

    expect(result).toBeDefined();
    expect(result.type).toBe('object');
    expect(result.properties).toHaveProperty('name');
    expect(result.properties).toHaveProperty('age');
  });

  it('should convert Valibot schema', async () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    const result = await toJsonSchema(schema);

    expect(result).toBeDefined();
    expect(result.type).toBe('object');
    expect(result.properties).toHaveProperty('name');
    expect(result.properties).toHaveProperty('age');
  });

  it('should convert ArkType schema', async () => {
    const schema = type({ name: 'string', age: 'number' });
    const result = await toJsonSchema(schema);

    expect(result).toBeDefined();
    expect(result.type).toBe('object');
    expect(result.properties).toHaveProperty('name');
    expect(result.properties).toHaveProperty('age');
  });

  it('should throw for unsupported schema', async () => {
    await expect(toJsonSchema({} as any)).rejects.toThrow('Unsupported schema type');
  });
});

describe('Auto-detect toJsonSchemaSync', () => {
  it('should convert Zod schema', () => {
    const schema = z.string();
    const result = toJsonSchemaSync(schema);

    expect(result).toBeDefined();
    expect(result.type).toBe('string');
  });

  it('should convert Valibot schema', () => {
    const schema = v.string();
    const result = toJsonSchemaSync(schema);

    expect(result).toBeDefined();
    expect(result.type).toBe('string');
  });

  it('should convert ArkType schema', () => {
    const schema = type('string');
    const result = toJsonSchemaSync(schema);

    expect(result).toBeDefined();
    expect(result.type).toBe('string');
  });
});

describe('Subpath exports', () => {
  describe('standard-schema-to-json/zod', () => {
    it('should convert Zod schema', () => {
      const schema = z.object({ name: z.string() });
      const result = zodToJsonSchema(schema);

      expect(result.type).toBe('object');
      expect(result.properties).toHaveProperty('name');
    });
  });

  describe('standard-schema-to-json/valibot', () => {
    it('should convert Valibot schema', () => {
      const schema = v.object({ name: v.string() });
      const result = valibotToJsonSchema(schema);

      expect(result.type).toBe('object');
      expect(result.properties).toHaveProperty('name');
    });
  });

  describe('standard-schema-to-json/arktype', () => {
    it('should convert ArkType schema', () => {
      const schema = type({ name: 'string' });
      const result = arktypeToJsonSchema(schema);

      expect(result.type).toBe('object');
      expect(result.properties).toHaveProperty('name');
    });
  });
});

describe('Detection utilities', () => {
  describe('detectVendor', () => {
    it('should detect Zod schema', () => {
      expect(detectVendor(z.string())).toBe('zod');
      expect(detectVendor(z.object({ a: z.number() }))).toBe('zod');
    });

    it('should detect Valibot schema', () => {
      expect(detectVendor(v.string())).toBe('valibot');
      expect(detectVendor(v.object({ a: v.number() }))).toBe('valibot');
    });

    it('should detect ArkType schema', () => {
      expect(detectVendor(type('string'))).toBe('arktype');
      expect(detectVendor(type({ a: 'number' }))).toBe('arktype');
    });

    it('should return null for unsupported types', () => {
      expect(detectVendor(null)).toBeNull();
      expect(detectVendor(undefined)).toBeNull();
      expect(detectVendor({})).toBeNull();
      expect(detectVendor('string')).toBeNull();
      expect(detectVendor(123)).toBeNull();
    });
  });

  describe('type guards', () => {
    it('isZodSchema', () => {
      expect(isZodSchema(z.string())).toBe(true);
      expect(isZodSchema(v.string())).toBe(false);
      expect(isZodSchema(type('string'))).toBe(false);
    });

    it('isValibotSchema', () => {
      expect(isValibotSchema(v.string())).toBe(true);
      expect(isValibotSchema(z.string())).toBe(false);
      expect(isValibotSchema(type('string'))).toBe(false);
    });

    it('isArkTypeSchema', () => {
      expect(isArkTypeSchema(type('string'))).toBe(true);
      expect(isArkTypeSchema(z.string())).toBe(false);
      expect(isArkTypeSchema(v.string())).toBe(false);
    });
  });
});
