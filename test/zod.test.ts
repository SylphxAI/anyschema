/**
 * Comprehensive Zod Integration Tests
 *
 * Tests all Zod schema types and features with AnySchema.
 * Includes both Zod v3 (via 'zod') and Zod v4 (via 'zod/v4') tests.
 */
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { toJSONSchema as zodV4ToJSONSchema, z as zv4 } from 'zod/v4'
import {
	assert,
	detect,
	detectVendor,
	getMetadata,
	type InferInput,
	type InferOutput,
	is,
	isStandardSchema,
	isZodSchema,
	parse,
	parseAsync,
	toJsonSchema,
	toJsonSchemaSync,
	ValidationError,
	validate,
} from '../src/index.js'

// ============================================================================
// Primitive Types
// ============================================================================

describe('Zod Primitives', () => {
	describe('string', () => {
		it('should validate strings', () => {
			const schema = z.string()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, '').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
			expect(validate(schema, null).success).toBe(false)
		})

		it('should validate with min/max', () => {
			const schema = z.string().min(2).max(10)
			expect(validate(schema, 'ab').success).toBe(true)
			expect(validate(schema, 'a').success).toBe(false)
			expect(validate(schema, 'a'.repeat(11)).success).toBe(false)
		})

		it('should validate with length', () => {
			const schema = z.string().length(5)
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'hi').success).toBe(false)
		})

		it('should validate email', () => {
			const schema = z.string().email()
			expect(validate(schema, 'test@example.com').success).toBe(true)
			expect(validate(schema, 'invalid-email').success).toBe(false)
		})

		it('should validate url', () => {
			const schema = z.string().url()
			expect(validate(schema, 'https://example.com').success).toBe(true)
			expect(validate(schema, 'not-a-url').success).toBe(false)
		})

		it('should validate uuid', () => {
			const schema = z.string().uuid()
			expect(validate(schema, '550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
			expect(validate(schema, 'not-a-uuid').success).toBe(false)
		})

		it('should validate regex', () => {
			const schema = z.string().regex(/^[A-Z]{3}$/)
			expect(validate(schema, 'ABC').success).toBe(true)
			expect(validate(schema, 'abc').success).toBe(false)
			expect(validate(schema, 'ABCD').success).toBe(false)
		})

		it('should validate startsWith/endsWith', () => {
			const schema = z.string().startsWith('hello').endsWith('world')
			expect(validate(schema, 'hello world').success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
			expect(validate(schema, 'world').success).toBe(false)
		})

		it('should validate includes', () => {
			const schema = z.string().includes('test')
			expect(validate(schema, 'this is a test').success).toBe(true)
			expect(validate(schema, 'no match here').success).toBe(false)
		})

		it('should handle trim/toLowerCase/toUpperCase', () => {
			const schema = z.string().trim().toLowerCase()
			const result = validate(schema, '  HELLO  ')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe('hello')
			}
		})
	})

	describe('number', () => {
		it('should validate numbers', () => {
			const schema = z.number()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 3.14).success).toBe(true)
			expect(validate(schema, '42').success).toBe(false)
			expect(validate(schema, NaN).success).toBe(false)
		})

		it('should validate with min/max', () => {
			const schema = z.number().min(0).max(100)
			expect(validate(schema, 50).success).toBe(true)
			expect(validate(schema, -1).success).toBe(false)
			expect(validate(schema, 101).success).toBe(false)
		})

		it('should validate positive/negative/nonnegative/nonpositive', () => {
			expect(validate(z.number().positive(), 1).success).toBe(true)
			expect(validate(z.number().positive(), 0).success).toBe(false)
			expect(validate(z.number().negative(), -1).success).toBe(true)
			expect(validate(z.number().nonnegative(), 0).success).toBe(true)
			expect(validate(z.number().nonpositive(), 0).success).toBe(true)
		})

		it('should validate int', () => {
			const schema = z.number().int()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 3.14).success).toBe(false)
		})

		it('should validate multipleOf', () => {
			const schema = z.number().multipleOf(5)
			expect(validate(schema, 10).success).toBe(true)
			expect(validate(schema, 12).success).toBe(false)
		})

		it('should validate finite', () => {
			const schema = z.number().finite()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, Infinity).success).toBe(false)
			expect(validate(schema, -Infinity).success).toBe(false)
		})

		it('should validate safe', () => {
			const schema = z.number().safe()
			expect(validate(schema, Number.MAX_SAFE_INTEGER).success).toBe(true)
			expect(validate(schema, Number.MAX_SAFE_INTEGER + 1).success).toBe(false)
		})
	})

	describe('bigint', () => {
		it('should validate bigints', () => {
			const schema = z.bigint()
			expect(validate(schema, BigInt(42)).success).toBe(true)
			expect(validate(schema, 42).success).toBe(false)
		})

		it('should validate with constraints', () => {
			const schema = z.bigint().positive()
			expect(validate(schema, BigInt(1)).success).toBe(true)
			expect(validate(schema, BigInt(0)).success).toBe(false)
		})
	})

	describe('boolean', () => {
		it('should validate booleans', () => {
			const schema = z.boolean()
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, false).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
			expect(validate(schema, 1).success).toBe(false)
		})
	})

	describe('date', () => {
		it('should validate dates', () => {
			const schema = z.date()
			expect(validate(schema, new Date()).success).toBe(true)
			expect(validate(schema, '2023-01-01').success).toBe(false)
		})

		it('should validate with min/max', () => {
			const minDate = new Date('2023-01-01')
			const maxDate = new Date('2023-12-31')
			const schema = z.date().min(minDate).max(maxDate)

			expect(validate(schema, new Date('2023-06-15')).success).toBe(true)
			expect(validate(schema, new Date('2022-06-15')).success).toBe(false)
			expect(validate(schema, new Date('2024-06-15')).success).toBe(false)
		})

		it('should reject invalid dates', () => {
			const schema = z.date()
			expect(validate(schema, new Date('invalid')).success).toBe(false)
		})
	})

	describe('symbol', () => {
		it('should validate symbols', () => {
			const schema = z.symbol()
			expect(validate(schema, Symbol('test')).success).toBe(true)
			expect(validate(schema, 'symbol').success).toBe(false)
		})
	})

	describe('undefined', () => {
		it('should validate undefined', () => {
			const schema = z.undefined()
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, null).success).toBe(false)
			expect(validate(schema, '').success).toBe(false)
		})
	})

	describe('null', () => {
		it('should validate null', () => {
			const schema = z.null()
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})
	})

	describe('void', () => {
		it('should validate void (undefined)', () => {
			const schema = z.void()
			expect(validate(schema, undefined).success).toBe(true)
		})
	})

	describe('any', () => {
		it('should accept any value', () => {
			const schema = z.any()
			expect(validate(schema, 'string').success).toBe(true)
			expect(validate(schema, 123).success).toBe(true)
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, {}).success).toBe(true)
		})
	})

	describe('unknown', () => {
		it('should accept any value', () => {
			const schema = z.unknown()
			expect(validate(schema, 'string').success).toBe(true)
			expect(validate(schema, 123).success).toBe(true)
			expect(validate(schema, null).success).toBe(true)
		})
	})

	describe('never', () => {
		it('should reject all values', () => {
			const schema = z.never()
			expect(validate(schema, 'anything').success).toBe(false)
			expect(validate(schema, undefined).success).toBe(false)
		})
	})
})

// ============================================================================
// Complex Types
// ============================================================================

describe('Zod Complex Types', () => {
	describe('literal', () => {
		it('should validate string literals', () => {
			const schema = z.literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})

		it('should validate number literals', () => {
			const schema = z.literal(42)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 43).success).toBe(false)
		})

		it('should validate boolean literals', () => {
			const schema = z.literal(true)
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, false).success).toBe(false)
		})
	})

	describe('enum', () => {
		it('should validate enum values', () => {
			const schema = z.enum(['red', 'green', 'blue'])
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})

		it('should validate native enum', () => {
			enum Color {
				Red = 'red',
				Green = 'green',
				Blue = 'blue',
			}
			const schema = z.nativeEnum(Color)
			expect(validate(schema, Color.Red).success).toBe(true)
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('array', () => {
		it('should validate arrays', () => {
			const schema = z.array(z.string())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, []).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
			expect(validate(schema, 'not an array').success).toBe(false)
		})

		it('should validate with min/max', () => {
			const schema = z.array(z.number()).min(1).max(3)
			expect(validate(schema, [1]).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(true)
			expect(validate(schema, []).success).toBe(false)
			expect(validate(schema, [1, 2, 3, 4]).success).toBe(false)
		})

		it('should validate with length', () => {
			const schema = z.array(z.string()).length(2)
			expect(validate(schema, ['a', 'b']).success).toBe(true)
			expect(validate(schema, ['a']).success).toBe(false)
		})

		it('should validate nonempty', () => {
			const schema = z.array(z.string()).nonempty()
			expect(validate(schema, ['a']).success).toBe(true)
			expect(validate(schema, []).success).toBe(false)
		})
	})

	describe('tuple', () => {
		it('should validate tuples', () => {
			const schema = z.tuple([z.string(), z.number()])
			expect(validate(schema, ['hello', 42]).success).toBe(true)
			expect(validate(schema, [42, 'hello']).success).toBe(false)
			expect(validate(schema, ['hello']).success).toBe(false)
		})

		it('should validate tuples with rest', () => {
			const schema = z.tuple([z.string()]).rest(z.number())
			expect(validate(schema, ['hello']).success).toBe(true)
			expect(validate(schema, ['hello', 1, 2, 3]).success).toBe(true)
			expect(validate(schema, ['hello', 'world']).success).toBe(false)
		})
	})

	describe('object', () => {
		it('should validate objects', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
			expect(validate(schema, { name: 123, age: 30 }).success).toBe(false)
		})

		it('should handle optional fields', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number().optional(),
			})
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
		})

		it('should handle nullable fields', () => {
			const schema = z.object({
				name: z.string(),
				nickname: z.string().nullable(),
			})
			expect(validate(schema, { name: 'John', nickname: null }).success).toBe(true)
			expect(validate(schema, { name: 'John', nickname: 'Johnny' }).success).toBe(true)
		})

		it('should handle strict mode', () => {
			const schema = z.object({ name: z.string() }).strict()
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, { name: 'John', extra: 'field' }).success).toBe(false)
		})

		it('should handle passthrough mode', () => {
			const schema = z.object({ name: z.string() }).passthrough()
			const result = validate(schema, { name: 'John', extra: 'field' })
			expect(result.success).toBe(true)
			if (result.success) {
				expect((result.data as any).extra).toBe('field')
			}
		})

		it('should handle strip mode (default)', () => {
			const schema = z.object({ name: z.string() })
			const result = validate(schema, { name: 'John', extra: 'field' })
			expect(result.success).toBe(true)
			if (result.success) {
				expect((result.data as any).extra).toBeUndefined()
			}
		})

		it('should handle extend', () => {
			const baseSchema = z.object({ name: z.string() })
			const extendedSchema = baseSchema.extend({ age: z.number() })
			expect(validate(extendedSchema, { name: 'John', age: 30 }).success).toBe(true)
		})

		it('should handle merge', () => {
			const schema1 = z.object({ name: z.string() })
			const schema2 = z.object({ age: z.number() })
			const mergedSchema = schema1.merge(schema2)
			expect(validate(mergedSchema, { name: 'John', age: 30 }).success).toBe(true)
		})

		it('should handle pick', () => {
			const schema = z.object({ name: z.string(), age: z.number() }).pick({ name: true })
			expect(validate(schema, { name: 'John' }).success).toBe(true)
		})

		it('should handle omit', () => {
			const schema = z.object({ name: z.string(), age: z.number() }).omit({ age: true })
			expect(validate(schema, { name: 'John' }).success).toBe(true)
		})

		it('should handle partial', () => {
			const schema = z.object({ name: z.string(), age: z.number() }).partial()
			expect(validate(schema, {}).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(true)
		})

		it('should handle required', () => {
			const schema = z.object({ name: z.string().optional() }).required()
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, {}).success).toBe(false)
		})
	})

	describe('record', () => {
		it('should validate records', () => {
			const schema = z.record(z.string(), z.number())
			expect(validate(schema, { a: 1, b: 2 }).success).toBe(true)
			expect(validate(schema, { a: 'not a number' }).success).toBe(false)
		})

		it('should validate records with key validation', () => {
			const schema = z.record(z.string().min(2), z.number())
			expect(validate(schema, { ab: 1 }).success).toBe(true)
			expect(validate(schema, { a: 1 }).success).toBe(false)
		})
	})

	describe('map', () => {
		it('should validate maps', () => {
			const schema = z.map(z.string(), z.number())
			const validMap = new Map([
				['a', 1],
				['b', 2],
			])
			expect(validate(schema, validMap).success).toBe(true)
		})
	})

	describe('set', () => {
		it('should validate sets', () => {
			const schema = z.set(z.number())
			const validSet = new Set([1, 2, 3])
			expect(validate(schema, validSet).success).toBe(true)
		})

		it('should validate with min/max', () => {
			const schema = z.set(z.number()).min(1).max(3)
			expect(validate(schema, new Set([1])).success).toBe(true)
			expect(validate(schema, new Set()).success).toBe(false)
			expect(validate(schema, new Set([1, 2, 3, 4])).success).toBe(false)
		})
	})

	describe('union', () => {
		it('should validate unions', () => {
			const schema = z.union([z.string(), z.number()])
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})

		it('should validate discriminated unions', () => {
			const schema = z.discriminatedUnion('type', [
				z.object({ type: z.literal('a'), value: z.string() }),
				z.object({ type: z.literal('b'), value: z.number() }),
			])
			expect(validate(schema, { type: 'a', value: 'hello' }).success).toBe(true)
			expect(validate(schema, { type: 'b', value: 42 }).success).toBe(true)
			expect(validate(schema, { type: 'c', value: 'x' }).success).toBe(false)
		})
	})

	describe('intersection', () => {
		it('should validate intersections', () => {
			const schema = z.intersection(z.object({ name: z.string() }), z.object({ age: z.number() }))
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})
	})

	describe('function', () => {
		it('should validate functions', () => {
			const schema = z.function()
			expect(validate(schema, () => {}).success).toBe(true)
			expect(validate(schema, 'not a function').success).toBe(false)
		})
	})

	describe('promise', () => {
		it('should validate promises', () => {
			const schema = z.promise(z.string())
			expect(validate(schema, Promise.resolve('hello')).success).toBe(true)
			expect(validate(schema, 'not a promise').success).toBe(false)
		})
	})
})

// ============================================================================
// Transformations
// ============================================================================

describe('Zod Transformations', () => {
	it('should transform values', () => {
		const schema = z.string().transform((val) => val.toUpperCase())
		const result = validate(schema, 'hello')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('HELLO')
		}
	})

	it('should chain transformations', () => {
		const schema = z
			.string()
			.transform((val) => val.trim())
			.transform((val) => val.toLowerCase())
		const result = validate(schema, '  HELLO  ')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('hello')
		}
	})

	it('should handle coerce', () => {
		const schema = z.coerce.number()
		const result = validate(schema, '42')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe(42)
		}
	})

	it('should handle preprocess', () => {
		const schema = z.preprocess((val) => String(val), z.string())
		const result = validate(schema, 123)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('123')
		}
	})
})

// ============================================================================
// Refinements
// ============================================================================

describe('Zod Refinements', () => {
	it('should validate with refine', () => {
		const schema = z.string().refine((val) => val.length > 3, {
			message: 'String must be longer than 3 characters',
		})
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, 'hi').success).toBe(false)
	})

	it('should validate with superRefine', () => {
		const schema = z
			.object({
				password: z.string(),
				confirmPassword: z.string(),
			})
			.superRefine((val, ctx) => {
				if (val.password !== val.confirmPassword) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Passwords do not match',
						path: ['confirmPassword'],
					})
				}
			})

		expect(validate(schema, { password: 'abc', confirmPassword: 'abc' }).success).toBe(true)
		expect(validate(schema, { password: 'abc', confirmPassword: 'xyz' }).success).toBe(false)
	})
})

// ============================================================================
// Default Values
// ============================================================================

describe('Zod Default Values', () => {
	it('should use default values', () => {
		const schema = z.object({
			name: z.string(),
			role: z.string().default('user'),
		})

		const result = validate(schema, { name: 'John' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.role).toBe('user')
		}
	})

	it('should not override provided values', () => {
		const schema = z.string().default('default')
		const result = validate(schema, 'provided')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('provided')
		}
	})
})

// ============================================================================
// Type Inference
// ============================================================================

describe('Zod Type Inference', () => {
	it('should infer output type', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
			email: z.string().email().optional(),
		})

		type Output = InferOutput<typeof schema>

		const validData: Output = { name: 'John', age: 30 }
		expect(validate(schema, validData).success).toBe(true)
	})

	it('should infer input type for transforms', () => {
		const schema = z.string().transform((val) => val.length)

		type Input = InferInput<typeof schema>
		type Output = InferOutput<typeof schema>

		const input: Input = 'hello'
		const result = validate(schema, input)
		expect(result.success).toBe(true)
		if (result.success) {
			const output: Output = result.data
			expect(typeof output).toBe('number')
		}
	})
})

// ============================================================================
// JSON Schema Conversion
// ============================================================================

describe('Zod JSON Schema Conversion', () => {
	it('should convert string schema', async () => {
		const schema = z.string()
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('string')
	})

	it('should convert number schema', async () => {
		const schema = z.number()
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('number')
	})

	it('should convert object schema', async () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		})
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('object')
		expect(jsonSchema.properties).toHaveProperty('name')
		expect(jsonSchema.properties).toHaveProperty('age')
		expect(jsonSchema.required).toContain('name')
	})

	it('should convert array schema', async () => {
		const schema = z.array(z.string())
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('array')
		expect((jsonSchema.items as any).type).toBe('string')
	})

	it('should convert enum schema', async () => {
		const schema = z.enum(['a', 'b', 'c'])
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.enum).toEqual(['a', 'b', 'c'])
	})

	it('should convert union schema', async () => {
		const schema = z.union([z.string(), z.number()])
		const jsonSchema = await toJsonSchema(schema)
		// Union may be represented as anyOf, oneOf, or type array
		const hasUnion = jsonSchema.anyOf || jsonSchema.oneOf || Array.isArray(jsonSchema.type)
		expect(hasUnion).toBeTruthy()
	})

	it('should convert optional fields', async () => {
		const schema = z.object({
			required: z.string(),
			optional: z.string().optional(),
		})
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.required).toContain('required')
		expect(jsonSchema.required).not.toContain('optional')
	})

	it('should work synchronously', () => {
		const schema = z.string().min(1).max(100)
		const jsonSchema = toJsonSchemaSync(schema)
		expect(jsonSchema.type).toBe('string')
		expect(jsonSchema.minLength).toBe(1)
		expect(jsonSchema.maxLength).toBe(100)
	})
})

// ============================================================================
// Metadata
// ============================================================================

describe('Zod Metadata', () => {
	it('should extract description', () => {
		const schema = z.string().describe('A user name')
		const meta = getMetadata(schema)
		expect(meta.description).toBe('A user name')
	})
})

// ============================================================================
// Detection
// ============================================================================

describe('Zod Detection', () => {
	it('should be detected by isZodSchema', () => {
		expect(isZodSchema(z.string())).toBe(true)
		expect(isZodSchema(z.number())).toBe(true)
		expect(isZodSchema(z.object({}))).toBe(true)
	})

	it('should be detected as Standard Schema (Zod v3.24+)', () => {
		expect(isStandardSchema(z.string())).toBe(true)
	})

	it('should return correct vendor', () => {
		expect(detectVendor(z.string())).toBe('zod')
	})

	it('should return standard-schema in detect()', () => {
		const result = detect(z.string())
		expect(result?.type).toBe('standard-schema')
		expect(result?.vendor).toBe('zod')
	})
})

// ============================================================================
// Error Messages
// ============================================================================

describe('Zod Error Messages', () => {
	it('should include error messages', () => {
		const schema = z.string()
		const result = validate(schema, 123)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].message).toBeTruthy()
		}
	})

	it('should include custom error messages', () => {
		const schema = z.string({
			required_error: 'Name is required',
			invalid_type_error: 'Name must be a string',
		})
		const result = validate(schema, 123)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].message).toBe('Name must be a string')
		}
	})

	it('should include path for nested errors', () => {
		const schema = z.object({
			user: z.object({
				name: z.string(),
			}),
		})
		const result = validate(schema, { user: { name: 123 } })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].path).toContain('user')
			expect(result.issues[0].path).toContain('name')
		}
	})
})

// ============================================================================
// is(), parse(), assert()
// ============================================================================

describe('Zod with is(), parse(), assert()', () => {
	const userSchema = z.object({
		name: z.string(),
		age: z.number(),
	})

	describe('is()', () => {
		it('should narrow type correctly', () => {
			const data: unknown = { name: 'John', age: 30 }
			if (is(userSchema, data)) {
				// TypeScript knows data is { name: string; age: number }
				expect(data.name).toBe('John')
				expect(data.age).toBe(30)
			}
		})

		it('should return false for invalid data', () => {
			expect(is(userSchema, { name: 'John' })).toBe(false)
		})
	})

	describe('parse()', () => {
		it('should return parsed data', () => {
			const data = parse(userSchema, { name: 'John', age: 30 })
			expect(data.name).toBe('John')
		})

		it('should throw ValidationError', () => {
			expect(() => parse(userSchema, { name: 'John' })).toThrow(ValidationError)
		})
	})

	describe('parseAsync()', () => {
		it('should return parsed data', async () => {
			const data = await parseAsync(userSchema, { name: 'John', age: 30 })
			expect(data.name).toBe('John')
		})

		it('should reject with ValidationError', async () => {
			await expect(parseAsync(userSchema, { name: 'John' })).rejects.toThrow(ValidationError)
		})
	})

	describe('assert()', () => {
		it('should narrow type after assertion', () => {
			const data: unknown = { name: 'John', age: 30 }
			assert(userSchema, data)
			// Now TypeScript knows data is { name: string; age: number }
			expect(data.name).toBe('John')
		})

		it('should throw ValidationError', () => {
			expect(() => assert(userSchema, { name: 'John' })).toThrow(ValidationError)
		})
	})
})

// ============================================================================
// Zod v4 Native (zod/v4) Tests
// ============================================================================

describe('Zod v4 Native (zod/v4)', () => {
	describe('Detection', () => {
		it('should detect Zod v4 schemas by _zod property', () => {
			const schema = zv4.string()
			expect('_zod' in schema).toBe(true)
			expect(detectVendor(schema)).toBe('zod')
		})

		it('should detect Zod v4 objects', () => {
			const schema = zv4.object({ name: zv4.string() })
			expect(detectVendor(schema)).toBe('zod')
		})

		it('should return correct detection for v4 schemas', () => {
			const result = detect(zv4.string())
			// Zod v4 implements Standard Schema, so it may return 'standard-schema' or 'duck'
			expect(['standard-schema', 'duck']).toContain(result?.type)
			expect(result?.vendor).toBe('zod')
		})
	})

	describe('Validation', () => {
		it('should validate Zod v4 string schema', () => {
			const schema = zv4.string()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate Zod v4 number schema', () => {
			const schema = zv4.number()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'not a number').success).toBe(false)
		})

		it('should validate Zod v4 object schema', () => {
			const schema = zv4.object({
				name: zv4.string(),
				age: zv4.number(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate Zod v4 array schema', () => {
			const schema = zv4.array(zv4.string())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})

		it('should validate Zod v4 optional schema', () => {
			const schema = zv4.object({
				name: zv4.string(),
				age: zv4.number().optional(),
			})
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
		})

		it('should validate Zod v4 enum schema', () => {
			const schema = zv4.enum(['red', 'green', 'blue'])
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})

		it('should validate Zod v4 union schema', () => {
			const schema = zv4.union([zv4.string(), zv4.number()])
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('JSON Schema Conversion', () => {
		it('should convert Zod v4 string schema to JSON Schema', async () => {
			const schema = zv4.string()
			const jsonSchema = await toJsonSchema(schema)
			expect(jsonSchema.type).toBe('string')
		})

		it('should convert Zod v4 number schema to JSON Schema', async () => {
			const schema = zv4.number()
			const jsonSchema = await toJsonSchema(schema)
			expect(jsonSchema.type).toBe('number')
		})

		it('should convert Zod v4 object schema to JSON Schema', async () => {
			const schema = zv4.object({
				name: zv4.string(),
				age: zv4.number(),
			})
			const jsonSchema = await toJsonSchema(schema)
			expect(jsonSchema.type).toBe('object')
			expect(jsonSchema.properties).toHaveProperty('name')
			expect(jsonSchema.properties).toHaveProperty('age')
			expect(jsonSchema.required).toContain('name')
			expect(jsonSchema.required).toContain('age')
		})

		it('should convert Zod v4 array schema to JSON Schema', async () => {
			const schema = zv4.array(zv4.string())
			const jsonSchema = await toJsonSchema(schema)
			expect(jsonSchema.type).toBe('array')
			expect((jsonSchema.items as any).type).toBe('string')
		})

		it('should convert Zod v4 enum schema to JSON Schema', async () => {
			const schema = zv4.enum(['a', 'b', 'c'])
			const jsonSchema = await toJsonSchema(schema)
			expect(jsonSchema.enum).toEqual(['a', 'b', 'c'])
		})

		it('should convert Zod v4 schema synchronously', () => {
			const schema = zv4.object({ name: zv4.string() })
			const jsonSchema = toJsonSchemaSync(schema)
			expect(jsonSchema.type).toBe('object')
			expect(jsonSchema.properties).toHaveProperty('name')
		})

		it('should match native zod/v4 toJSONSchema output', async () => {
			const schema = zv4.object({
				name: zv4.string(),
				age: zv4.number(),
				email: zv4.string().optional(),
			})

			const anySchemaResult = await toJsonSchema(schema)
			const nativeResult = zodV4ToJSONSchema(schema)

			// Both should have same structure
			expect(anySchemaResult.type).toBe(nativeResult.type)
			expect(anySchemaResult.properties).toEqual(nativeResult.properties)
			expect(anySchemaResult.required).toEqual(nativeResult.required)
		})
	})

	describe('Type Guards', () => {
		it('should work with is() for Zod v4 schemas', () => {
			const schema = zv4.object({ name: zv4.string() })
			const data: unknown = { name: 'John' }
			expect(is(schema, data)).toBe(true)
			expect(is(schema, { name: 123 })).toBe(false)
		})

		it('should work with parse() for Zod v4 schemas', () => {
			const schema = zv4.object({ name: zv4.string() })
			const data = parse(schema, { name: 'John' })
			expect(data.name).toBe('John')
		})

		it('should throw ValidationError for invalid Zod v4 data', () => {
			const schema = zv4.object({ name: zv4.string() })
			expect(() => parse(schema, { name: 123 })).toThrow(ValidationError)
		})
	})

	describe('isZodSchema', () => {
		it('should detect Zod v4 schemas', () => {
			expect(isZodSchema(zv4.string())).toBe(true)
			expect(isZodSchema(zv4.number())).toBe(true)
			expect(isZodSchema(zv4.object({}))).toBe(true)
			expect(isZodSchema(zv4.array(zv4.string()))).toBe(true)
		})
	})

	describe('Metadata', () => {
		it('should extract description from Zod v4 schema', () => {
			const schema = zv4.string().describe('A v4 description')
			const meta = getMetadata(schema)
			expect(meta.description).toBe('A v4 description')
		})

		it('should return empty object for v4 schema without description', () => {
			const schema = zv4.string()
			const meta = getMetadata(schema)
			expect(meta).toEqual({})
		})
	})
})
