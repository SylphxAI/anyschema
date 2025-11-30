import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';

import {
  toJsonSchema,
  toJsonSchemaAsync,
  supportsToJsonSchema,
  isSupportedVendor,
  getVendor,
  normalizeVendor,
  SUPPORTED_VENDORS,
} from '../src/index.js';

describe('toJsonSchema', () => {
  describe('Zod', () => {
    it('should convert a simple zod string schema', () => {
      const schema = z.string();
      const jsonSchema = toJsonSchema(schema);

      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('string');
    });

    it('should convert a zod object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const jsonSchema = toJsonSchema(schema);

      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
    });

    it('should handle zod constraints', () => {
      const schema = z.string().min(1).max(100);
      const jsonSchema = toJsonSchema(schema);

      expect(jsonSchema.type).toBe('string');
      expect(jsonSchema.minLength).toBe(1);
      expect(jsonSchema.maxLength).toBe(100);
    });
  });

  describe('Valibot', () => {
    it('should convert a simple valibot string schema', async () => {
      const schema = v.string();
      const jsonSchema = await toJsonSchemaAsync(schema);

      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('string');
    });

    it('should convert a valibot object schema', async () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });
      const jsonSchema = await toJsonSchemaAsync(schema);

      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
    });
  });

  describe('ArkType', () => {
    it('should convert a simple arktype string schema', () => {
      const schema = type('string');
      const jsonSchema = toJsonSchema(schema);

      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('string');
    });

    it('should convert an arktype object schema', () => {
      const schema = type({
        name: 'string',
        age: 'number',
      });
      const jsonSchema = toJsonSchema(schema);

      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
    });
  });
});

describe('toJsonSchemaAsync', () => {
  it('should work with all supported vendors', async () => {
    const zodSchema = z.string();
    const valibotSchema = v.string();
    const arktypeSchema = type('string');

    const results = await Promise.all([
      toJsonSchemaAsync(zodSchema),
      toJsonSchemaAsync(valibotSchema),
      toJsonSchemaAsync(arktypeSchema),
    ]);

    results.forEach((result) => {
      expect(result).toBeDefined();
      expect(result.type).toBe('string');
    });
  });
});

describe('supportsToJsonSchema', () => {
  it('should return true for supported schemas', () => {
    expect(supportsToJsonSchema(z.string())).toBe(true);
    expect(supportsToJsonSchema(v.string())).toBe(true);
    expect(supportsToJsonSchema(type('string'))).toBe(true);
  });
});

describe('vendor utilities', () => {
  describe('getVendor', () => {
    it('should extract vendor from schemas', () => {
      expect(getVendor(z.string())).toBe('zod');
      expect(getVendor(v.string())).toBe('valibot');
      expect(getVendor(type('string'))).toBe('arktype');
    });
  });

  describe('isSupportedVendor', () => {
    it('should return true for supported vendors', () => {
      expect(isSupportedVendor('zod')).toBe(true);
      expect(isSupportedVendor('valibot')).toBe(true);
      expect(isSupportedVendor('arktype')).toBe(true);
    });

    it('should return false for unsupported vendors', () => {
      expect(isSupportedVendor('unknown')).toBe(false);
      expect(isSupportedVendor('my-lib')).toBe(false);
      // TypeBox and Effect don't implement Standard Schema
      expect(isSupportedVendor('typebox')).toBe(false);
      expect(isSupportedVendor('effect')).toBe(false);
    });
  });

  describe('normalizeVendor', () => {
    it('should normalize vendor names', () => {
      expect(normalizeVendor('zod')).toBe('zod');
      expect(normalizeVendor('valibot')).toBe('valibot');
      expect(normalizeVendor('arktype')).toBe('arktype');
    });

    it('should return null for unsupported vendors', () => {
      expect(normalizeVendor('unknown')).toBeNull();
      expect(normalizeVendor('typebox')).toBeNull();
      expect(normalizeVendor('effect')).toBeNull();
    });
  });

  describe('SUPPORTED_VENDORS', () => {
    it('should contain all supported vendors', () => {
      expect(SUPPORTED_VENDORS).toContain('zod');
      expect(SUPPORTED_VENDORS).toContain('valibot');
      expect(SUPPORTED_VENDORS).toContain('arktype');
    });

    it('should only contain Standard Schema compatible vendors', () => {
      expect(SUPPORTED_VENDORS).not.toContain('typebox');
      expect(SUPPORTED_VENDORS).not.toContain('effect');
    });
  });
});
