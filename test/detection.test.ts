/**
 * Detection Tests
 *
 * Tests for duck typing detection of all supported schema libraries.
 * Uses mock objects to simulate library structures without actual dependencies.
 */
import { describe, it, expect } from 'vitest';

import {
  detectVendor,
  detect,
  isAnySchemaProtocol,
  isStandardSchema,
  isZodSchema,
  isValibotSchema,
  isArkTypeSchema,
  isYupSchema,
  isJoiSchema,
  isIoTsSchema,
  isSuperstructSchema,
  isTypeBoxSchema,
  isEffectSchema,
  isRuntypesSchema,
  supportsJsonSchema,
  supportsAsync,
  hasMetadata,
} from '../src/index.js';

// ============================================================================
// Mock Schema Factories
// ============================================================================

/**
 * Create mock Zod schema structure
 * Zod schemas have: _def, parse, safeParse, parseAsync
 */
function createMockZodSchema() {
  return {
    _def: { typeName: 'ZodString' },
    parse: (data: unknown) => data,
    safeParse: (data: unknown) => ({ success: true, data }),
    parseAsync: async (data: unknown) => data,
    optional: () => createMockZodSchema(),
    nullable: () => createMockZodSchema(),
  };
}

/**
 * Create mock Valibot schema structure
 * Valibot schemas have: kind, async, expects, _run
 */
function createMockValibotSchema() {
  return {
    kind: 'schema',
    type: 'string',
    async: false,
    expects: 'string',
    _run: (dataset: unknown, config: unknown) => ({ typed: true, value: dataset }),
  };
}

/**
 * Create mock ArkType schema structure
 * ArkType schemas are callable with: toJsonSchema, infer, t
 */
function createMockArkTypeSchema() {
  const fn = (data: unknown) => data;
  (fn as Record<string, unknown>).toJsonSchema = () => ({ type: 'string' });
  (fn as Record<string, unknown>).infer = undefined;
  (fn as Record<string, unknown>).t = { domain: 'string' };
  return fn;
}

/**
 * Create mock Yup schema structure
 * Yup schemas have: __isYupSchema__, validate, validateSync, cast
 */
function createMockYupSchema() {
  return {
    __isYupSchema__: true,
    type: 'string',
    validate: async (data: unknown) => data,
    validateSync: (data: unknown) => data,
    cast: (data: unknown) => data,
    isValid: async (data: unknown) => true,
    isValidSync: (data: unknown) => true,
  };
}

/**
 * Create mock Joi schema structure
 * Joi schemas have: $_root, type, validate, validateAsync
 */
function createMockJoiSchema() {
  return {
    $_root: {},
    type: 'string',
    validate: (data: unknown) => ({ value: data, error: undefined }),
    validateAsync: async (data: unknown) => data,
    describe: () => ({ type: 'string' }),
  };
}

/**
 * Create mock io-ts schema structure
 * io-ts codecs have: _tag, name, is, decode, encode
 */
function createMockIoTsSchema() {
  return {
    _tag: 'StringType',
    name: 'string',
    is: (u: unknown): u is string => typeof u === 'string',
    decode: (u: unknown) => ({ _tag: 'Right', right: u }),
    encode: (a: unknown) => a,
    validate: (u: unknown, c: unknown) => ({ _tag: 'Right', right: u }),
  };
}

/**
 * Create mock Superstruct schema structure
 * Superstruct schemas have: refiner, validator, coercer, type
 */
function createMockSuperstructSchema() {
  return {
    type: 'string',
    schema: null,
    refiner: () => [],
    validator: () => [],
    coercer: (value: unknown) => value,
    entries: function* () {},
  };
}

/**
 * Create mock TypeBox schema structure
 * TypeBox schemas have: [Symbol.for('TypeBox.Kind')], type, $id
 */
function createMockTypeBoxSchema() {
  const schema: Record<string | symbol, unknown> = {
    type: 'string',
    $id: 'T',
  };
  schema[Symbol.for('TypeBox.Kind')] = 'String';
  return schema;
}

/**
 * Create mock Effect Schema structure
 * Effect schemas have: Type, Encoded, ast, annotations
 */
function createMockEffectSchema() {
  return {
    Type: undefined as unknown,
    Encoded: undefined as unknown,
    ast: { _tag: 'StringKeyword' },
    annotations: {},
    pipe: (...args: unknown[]) => createMockEffectSchema(),
  };
}

/**
 * Create mock Runtypes schema structure
 * Runtypes have: reflect, check, guard, validate
 */
function createMockRuntypesSchema() {
  return {
    reflect: { tag: 'string' },
    check: (x: unknown) => x,
    guard: (x: unknown): x is string => typeof x === 'string',
    validate: (x: unknown) => ({ success: true, value: x }),
    Or: () => createMockRuntypesSchema(),
    And: () => createMockRuntypesSchema(),
  };
}

// ============================================================================
// AnySchema Protocol Detection
// ============================================================================

describe('AnySchema Protocol Detection', () => {
  it('should detect valid AnySchema Protocol schema', () => {
    const schema = {
      '~anyschema': {
        version: 1,
        vendor: 'custom',
      },
      '~validate': (data: unknown) => ({ success: true, data }),
    };

    expect(isAnySchemaProtocol(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('custom');
    expect(detect(schema)?.type).toBe('anyschema');
  });

  it('should reject schema without ~anyschema key', () => {
    const schema = {
      validate: () => ({ success: true }),
    };
    expect(isAnySchemaProtocol(schema)).toBe(false);
  });

  it('should reject schema with incomplete ~anyschema', () => {
    expect(isAnySchemaProtocol({ '~anyschema': {} })).toBe(false);
    expect(isAnySchemaProtocol({ '~anyschema': { version: 1 } })).toBe(false);
    expect(isAnySchemaProtocol({ '~anyschema': { vendor: 'test' } })).toBe(false);
    expect(isAnySchemaProtocol({ '~anyschema': null })).toBe(false);
  });
});

// ============================================================================
// Standard Schema Detection
// ============================================================================

describe('Standard Schema Detection', () => {
  it('should detect valid Standard Schema', () => {
    const schema = {
      '~standard': {
        version: 1,
        vendor: 'test-vendor',
        validate: (data: unknown) => ({ value: data }),
      },
    };

    expect(isStandardSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('test-vendor');
    expect(detect(schema)?.type).toBe('standard-schema');
  });

  it('should reject schema without ~standard key', () => {
    const schema = {
      validate: () => ({ value: 'test' }),
    };
    expect(isStandardSchema(schema)).toBe(false);
  });

  it('should reject schema with incomplete ~standard', () => {
    expect(isStandardSchema({ '~standard': {} })).toBe(false);
    expect(isStandardSchema({ '~standard': { version: 1 } })).toBe(false);
    expect(isStandardSchema({ '~standard': { version: 1, vendor: 'test' } })).toBe(false);
    expect(isStandardSchema({ '~standard': null })).toBe(false);
  });
});

// ============================================================================
// Zod Detection
// ============================================================================

describe('Zod Detection', () => {
  it('should detect mock Zod schema', () => {
    const schema = createMockZodSchema();
    expect(isZodSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('zod');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Zod schema as Zod', () => {
    expect(isZodSchema(createMockValibotSchema())).toBe(false);
    expect(isZodSchema(createMockYupSchema())).toBe(false);
    expect(isZodSchema({})).toBe(false);
  });

  it('should require both _def and parse', () => {
    expect(isZodSchema({ _def: {} })).toBe(false);
    expect(isZodSchema({ parse: () => {} })).toBe(false);
    expect(isZodSchema({ _def: {}, parse: 'not a function' })).toBe(false);
  });
});

// ============================================================================
// Valibot Detection
// ============================================================================

describe('Valibot Detection', () => {
  it('should detect mock Valibot schema', () => {
    const schema = createMockValibotSchema();
    expect(isValibotSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('valibot');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Valibot schema as Valibot', () => {
    expect(isValibotSchema(createMockZodSchema())).toBe(false);
    expect(isValibotSchema(createMockYupSchema())).toBe(false);
    expect(isValibotSchema({})).toBe(false);
  });

  it('should require both kind and async', () => {
    expect(isValibotSchema({ kind: 'schema' })).toBe(false);
    expect(isValibotSchema({ async: false })).toBe(false);
  });
});

// ============================================================================
// ArkType Detection
// ============================================================================

describe('ArkType Detection', () => {
  it('should detect mock ArkType schema', () => {
    const schema = createMockArkTypeSchema();
    expect(isArkTypeSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('arktype');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should require toJsonSchema to be a function', () => {
    const notArkType = () => {};
    (notArkType as Record<string, unknown>).toJsonSchema = 'not a function';
    expect(isArkTypeSchema(notArkType)).toBe(false);
  });

  it('should not detect regular function as ArkType', () => {
    expect(isArkTypeSchema(() => {})).toBe(false);
  });
});

// ============================================================================
// Yup Detection
// ============================================================================

describe('Yup Detection', () => {
  it('should detect mock Yup schema', () => {
    const schema = createMockYupSchema();
    expect(isYupSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('yup');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Yup schema as Yup', () => {
    expect(isYupSchema(createMockZodSchema())).toBe(false);
    expect(isYupSchema(createMockValibotSchema())).toBe(false);
    expect(isYupSchema({})).toBe(false);
  });

  it('should require __isYupSchema__ to be true', () => {
    expect(isYupSchema({ __isYupSchema__: false })).toBe(false);
    expect(isYupSchema({ __isYupSchema__: 'true' })).toBe(false);
  });
});

// ============================================================================
// Joi Detection
// ============================================================================

describe('Joi Detection', () => {
  it('should detect mock Joi schema', () => {
    const schema = createMockJoiSchema();
    expect(isJoiSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('joi');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Joi schema as Joi', () => {
    expect(isJoiSchema(createMockZodSchema())).toBe(false);
    expect(isJoiSchema(createMockValibotSchema())).toBe(false);
    expect(isJoiSchema({})).toBe(false);
  });

  it('should require $_root, type, and validate', () => {
    expect(isJoiSchema({ $_root: {} })).toBe(false);
    expect(isJoiSchema({ $_root: {}, type: 'string' })).toBe(false);
    expect(isJoiSchema({ type: 'string', validate: () => {} })).toBe(false);
  });
});

// ============================================================================
// io-ts Detection
// ============================================================================

describe('io-ts Detection', () => {
  it('should detect mock io-ts schema', () => {
    const schema = createMockIoTsSchema();
    expect(isIoTsSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('io-ts');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-io-ts schema as io-ts', () => {
    expect(isIoTsSchema(createMockZodSchema())).toBe(false);
    expect(isIoTsSchema(createMockValibotSchema())).toBe(false);
    expect(isIoTsSchema({})).toBe(false);
  });

  it('should require _tag, decode, and encode', () => {
    expect(isIoTsSchema({ _tag: 'Type' })).toBe(false);
    expect(isIoTsSchema({ _tag: 'Type', decode: () => {} })).toBe(false);
    expect(isIoTsSchema({ decode: () => {}, encode: () => {} })).toBe(false);
  });
});

// ============================================================================
// Superstruct Detection
// ============================================================================

describe('Superstruct Detection', () => {
  it('should detect mock Superstruct schema', () => {
    const schema = createMockSuperstructSchema();
    expect(isSuperstructSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('superstruct');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Superstruct schema as Superstruct', () => {
    expect(isSuperstructSchema(createMockZodSchema())).toBe(false);
    expect(isSuperstructSchema(createMockValibotSchema())).toBe(false);
    expect(isSuperstructSchema({})).toBe(false);
  });

  it('should require refiner, validator, and coercer', () => {
    expect(isSuperstructSchema({ refiner: () => [] })).toBe(false);
    expect(isSuperstructSchema({ refiner: () => [], validator: () => [] })).toBe(false);
    expect(isSuperstructSchema({ validator: () => [], coercer: () => {} })).toBe(false);
  });
});

// ============================================================================
// TypeBox Detection
// ============================================================================

describe('TypeBox Detection', () => {
  it('should detect mock TypeBox schema with Symbol', () => {
    const schema = createMockTypeBoxSchema();
    expect(isTypeBoxSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('typebox');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should detect TypeBox schema with static/params pattern', () => {
    const schema = {
      static: undefined,
      params: {},
      type: 'string',
    };
    expect(isTypeBoxSchema(schema)).toBe(true);
  });

  it('should not detect non-TypeBox schema as TypeBox', () => {
    expect(isTypeBoxSchema(createMockZodSchema())).toBe(false);
    expect(isTypeBoxSchema(createMockValibotSchema())).toBe(false);
    expect(isTypeBoxSchema({})).toBe(false);
  });
});

// ============================================================================
// Effect Schema Detection
// ============================================================================

describe('Effect Schema Detection', () => {
  it('should detect mock Effect Schema', () => {
    const schema = createMockEffectSchema();
    expect(isEffectSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('effect');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Effect schema as Effect', () => {
    expect(isEffectSchema(createMockZodSchema())).toBe(false);
    expect(isEffectSchema(createMockValibotSchema())).toBe(false);
    expect(isEffectSchema({})).toBe(false);
  });

  it('should require Type, Encoded, and ast', () => {
    expect(isEffectSchema({ Type: undefined })).toBe(false);
    expect(isEffectSchema({ Type: undefined, Encoded: undefined })).toBe(false);
    expect(isEffectSchema({ Encoded: undefined, ast: {} })).toBe(false);
  });
});

// ============================================================================
// Runtypes Detection
// ============================================================================

describe('Runtypes Detection', () => {
  it('should detect mock Runtypes schema', () => {
    const schema = createMockRuntypesSchema();
    expect(isRuntypesSchema(schema)).toBe(true);
    expect(detectVendor(schema)).toBe('runtypes');
    expect(detect(schema)?.type).toBe('duck');
  });

  it('should not detect non-Runtypes schema as Runtypes', () => {
    expect(isRuntypesSchema(createMockZodSchema())).toBe(false);
    expect(isRuntypesSchema(createMockValibotSchema())).toBe(false);
    expect(isRuntypesSchema({})).toBe(false);
  });

  it('should require reflect, check, and guard', () => {
    expect(isRuntypesSchema({ reflect: {} })).toBe(false);
    expect(isRuntypesSchema({ reflect: {}, check: () => {} })).toBe(false);
    expect(isRuntypesSchema({ check: () => {}, guard: () => true })).toBe(false);
  });
});

// ============================================================================
// Detection Priority
// ============================================================================

describe('Detection Priority', () => {
  it('should prioritize AnySchema Protocol over Standard Schema', () => {
    const schema = {
      '~anyschema': { version: 1, vendor: 'custom' },
      '~standard': { version: 1, vendor: 'other', validate: () => {} },
      '~validate': () => ({ success: true }),
    };

    expect(detect(schema)?.type).toBe('anyschema');
    expect(detectVendor(schema)).toBe('custom');
  });

  it('should prioritize Standard Schema over duck typing', () => {
    const schema = {
      '~standard': { version: 1, vendor: 'zod', validate: () => ({ value: 'test' }) },
      _def: {},
      parse: () => {},
    };

    expect(detect(schema)?.type).toBe('standard-schema');
    expect(detectVendor(schema)).toBe('zod');
  });

  it('should prioritize AnySchema over duck typing', () => {
    const schema = {
      '~anyschema': { version: 1, vendor: 'custom' },
      _def: {},
      parse: () => {},
      '~validate': () => ({ success: true }),
    };

    expect(detect(schema)?.type).toBe('anyschema');
    expect(detectVendor(schema)).toBe('custom');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Detection Edge Cases', () => {
  it('should return null for null', () => {
    expect(detectVendor(null)).toBeNull();
    expect(detect(null)).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(detectVendor(undefined)).toBeNull();
    expect(detect(undefined)).toBeNull();
  });

  it('should return null for primitives', () => {
    expect(detectVendor('string')).toBeNull();
    expect(detectVendor(123)).toBeNull();
    expect(detectVendor(true)).toBeNull();
    expect(detectVendor(Symbol('test'))).toBeNull();
  });

  it('should return null for empty object', () => {
    expect(detectVendor({})).toBeNull();
    expect(detect({})).toBeNull();
  });

  it('should return null for array', () => {
    expect(detectVendor([])).toBeNull();
    expect(detectVendor([1, 2, 3])).toBeNull();
  });

  it('should return null for non-schema function', () => {
    expect(detectVendor(() => {})).toBeNull();
    expect(detectVendor(function named() {})).toBeNull();
  });

  it('should return null for class instance without schema markers', () => {
    class CustomClass {
      value = 'test';
    }
    expect(detectVendor(new CustomClass())).toBeNull();
  });
});

// ============================================================================
// Capability Detection
// ============================================================================

describe('Capability Detection', () => {
  describe('supportsJsonSchema()', () => {
    it('should return true for AnySchema with ~toJsonSchema', () => {
      const schema = {
        '~anyschema': { version: 1, vendor: 'custom' },
        '~toJsonSchema': () => ({ type: 'string' }),
        '~validate': () => ({ success: true }),
      };
      expect(supportsJsonSchema(schema)).toBe(true);
    });

    it('should return true for libraries with JSON Schema support', () => {
      expect(supportsJsonSchema(createMockZodSchema())).toBe(true);
      expect(supportsJsonSchema(createMockValibotSchema())).toBe(true);
      expect(supportsJsonSchema(createMockArkTypeSchema())).toBe(true);
      expect(supportsJsonSchema(createMockTypeBoxSchema())).toBe(true);
      expect(supportsJsonSchema(createMockEffectSchema())).toBe(true);
    });

    it('should return false for libraries without JSON Schema support', () => {
      expect(supportsJsonSchema(createMockYupSchema())).toBe(false);
      expect(supportsJsonSchema(createMockJoiSchema())).toBe(false);
      expect(supportsJsonSchema(createMockIoTsSchema())).toBe(false);
      expect(supportsJsonSchema(createMockSuperstructSchema())).toBe(false);
      expect(supportsJsonSchema(createMockRuntypesSchema())).toBe(false);
    });

    it('should return false for non-schema objects', () => {
      expect(supportsJsonSchema({})).toBe(false);
      expect(supportsJsonSchema(null)).toBe(false);
    });
  });

  describe('supportsAsync()', () => {
    it('should return true for AnySchema with ~validateAsync', () => {
      const schema = {
        '~anyschema': { version: 1, vendor: 'custom' },
        '~validateAsync': async () => ({ success: true }),
        '~validate': () => ({ success: true }),
      };
      expect(supportsAsync(schema)).toBe(true);
    });

    it('should return true for all detected schemas', () => {
      expect(supportsAsync(createMockZodSchema())).toBe(true);
      expect(supportsAsync(createMockValibotSchema())).toBe(true);
      expect(supportsAsync(createMockYupSchema())).toBe(true);
      expect(supportsAsync(createMockJoiSchema())).toBe(true);
    });

    it('should return false for non-schema objects', () => {
      expect(supportsAsync({})).toBe(false);
      expect(supportsAsync(null)).toBe(false);
    });
  });

  describe('hasMetadata()', () => {
    it('should return true for AnySchema with ~meta', () => {
      const schema = {
        '~anyschema': { version: 1, vendor: 'custom' },
        '~meta': { title: 'Test' },
        '~validate': () => ({ success: true }),
      };
      expect(hasMetadata(schema)).toBe(true);
    });

    it('should return true for libraries with metadata support', () => {
      expect(hasMetadata(createMockZodSchema())).toBe(true);
      expect(hasMetadata(createMockYupSchema())).toBe(true);
      expect(hasMetadata(createMockTypeBoxSchema())).toBe(true);
      expect(hasMetadata(createMockEffectSchema())).toBe(true);
    });

    it('should return false for libraries without metadata support', () => {
      expect(hasMetadata(createMockValibotSchema())).toBe(false);
      expect(hasMetadata(createMockJoiSchema())).toBe(false);
      expect(hasMetadata(createMockIoTsSchema())).toBe(false);
      expect(hasMetadata(createMockSuperstructSchema())).toBe(false);
      expect(hasMetadata(createMockRuntypesSchema())).toBe(false);
    });

    it('should return false for non-schema objects', () => {
      expect(hasMetadata({})).toBe(false);
      expect(hasMetadata(null)).toBe(false);
    });
  });
});

// ============================================================================
// Detection Result Structure
// ============================================================================

describe('Detection Result Structure', () => {
  it('should include type and vendor for protocol schemas', () => {
    const anySchema = {
      '~anyschema': { version: 1, vendor: 'custom' },
      '~validate': () => ({ success: true }),
    };
    const result = detect(anySchema);
    expect(result).toEqual({ type: 'anyschema', vendor: 'custom' });
  });

  it('should include type and vendor for standard schema', () => {
    const standardSchema = {
      '~standard': { version: 1, vendor: 'test', validate: () => ({}) },
    };
    const result = detect(standardSchema);
    expect(result).toEqual({ type: 'standard-schema', vendor: 'test' });
  });

  it('should include type and vendor for duck-typed schemas', () => {
    const zodLike = createMockZodSchema();
    const result = detect(zodLike);
    expect(result).toEqual({ type: 'duck', vendor: 'zod' });
  });
});

// ============================================================================
// Cross-Detection (No False Positives)
// ============================================================================

describe('Cross-Detection (No False Positives)', () => {
  const schemas = [
    { name: 'Zod', create: createMockZodSchema, check: isZodSchema },
    { name: 'Valibot', create: createMockValibotSchema, check: isValibotSchema },
    { name: 'ArkType', create: createMockArkTypeSchema, check: isArkTypeSchema },
    { name: 'Yup', create: createMockYupSchema, check: isYupSchema },
    { name: 'Joi', create: createMockJoiSchema, check: isJoiSchema },
    { name: 'io-ts', create: createMockIoTsSchema, check: isIoTsSchema },
    { name: 'Superstruct', create: createMockSuperstructSchema, check: isSuperstructSchema },
    { name: 'TypeBox', create: createMockTypeBoxSchema, check: isTypeBoxSchema },
    { name: 'Effect', create: createMockEffectSchema, check: isEffectSchema },
    { name: 'Runtypes', create: createMockRuntypesSchema, check: isRuntypesSchema },
  ];

  for (const { name: targetName, create, check } of schemas) {
    it(`${targetName} should only be detected by its own check`, () => {
      const schema = create();

      for (const { name: otherName, check: otherCheck } of schemas) {
        if (otherName === targetName) {
          expect(otherCheck(schema)).toBe(true);
        } else {
          expect(otherCheck(schema)).toBe(false);
        }
      }
    });
  }
});
