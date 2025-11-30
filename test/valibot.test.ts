/**
 * Comprehensive Valibot Integration Tests
 *
 * Tests all Valibot schema types and features with AnySchema.
 */

import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import {
	assert,
	detect,
	detectVendor,
	type InferInput,
	type InferOutput,
	is,
	isStandardSchema,
	isValibotSchema,
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

describe('Valibot Primitives', () => {
	describe('string', () => {
		it('should validate strings', () => {
			const schema = v.string()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, '').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
			expect(validate(schema, null).success).toBe(false)
		})

		it('should validate with minLength/maxLength', () => {
			const schema = v.pipe(v.string(), v.minLength(2), v.maxLength(10))
			expect(validate(schema, 'ab').success).toBe(true)
			expect(validate(schema, 'a').success).toBe(false)
			expect(validate(schema, 'a'.repeat(11)).success).toBe(false)
		})

		it('should validate with length', () => {
			const schema = v.pipe(v.string(), v.length(5))
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'hi').success).toBe(false)
		})

		it('should validate email', () => {
			const schema = v.pipe(v.string(), v.email())
			expect(validate(schema, 'test@example.com').success).toBe(true)
			expect(validate(schema, 'invalid-email').success).toBe(false)
		})

		it('should validate url', () => {
			const schema = v.pipe(v.string(), v.url())
			expect(validate(schema, 'https://example.com').success).toBe(true)
			expect(validate(schema, 'not-a-url').success).toBe(false)
		})

		it('should validate uuid', () => {
			const schema = v.pipe(v.string(), v.uuid())
			expect(validate(schema, '550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
			expect(validate(schema, 'not-a-uuid').success).toBe(false)
		})

		it('should validate regex', () => {
			const schema = v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))
			expect(validate(schema, 'ABC').success).toBe(true)
			expect(validate(schema, 'abc').success).toBe(false)
		})

		it('should validate startsWith/endsWith', () => {
			const schema = v.pipe(v.string(), v.startsWith('hello'), v.endsWith('world'))
			expect(validate(schema, 'hello world').success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate includes', () => {
			const schema = v.pipe(v.string(), v.includes('test'))
			expect(validate(schema, 'this is a test').success).toBe(true)
			expect(validate(schema, 'no match here').success).toBe(false)
		})

		it('should validate nonEmpty', () => {
			const schema = v.pipe(v.string(), v.nonEmpty())
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, '').success).toBe(false)
		})

		it('should handle trim', () => {
			const schema = v.pipe(v.string(), v.trim())
			const result = validate(schema, '  hello  ')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe('hello')
			}
		})

		it('should handle toLowerCase', () => {
			const schema = v.pipe(v.string(), v.toLowerCase())
			const result = validate(schema, 'HELLO')
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toBe('hello')
			}
		})
	})

	describe('number', () => {
		it('should validate numbers', () => {
			const schema = v.number()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 3.14).success).toBe(true)
			expect(validate(schema, '42').success).toBe(false)
			expect(validate(schema, NaN).success).toBe(false)
		})

		it('should validate with minValue/maxValue', () => {
			const schema = v.pipe(v.number(), v.minValue(0), v.maxValue(100))
			expect(validate(schema, 50).success).toBe(true)
			expect(validate(schema, -1).success).toBe(false)
			expect(validate(schema, 101).success).toBe(false)
		})

		it('should validate integer', () => {
			const schema = v.pipe(v.number(), v.integer())
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 3.14).success).toBe(false)
		})

		it('should validate multipleOf', () => {
			const schema = v.pipe(v.number(), v.multipleOf(5))
			expect(validate(schema, 10).success).toBe(true)
			expect(validate(schema, 12).success).toBe(false)
		})

		it('should validate finite', () => {
			const schema = v.pipe(v.number(), v.finite())
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, Infinity).success).toBe(false)
		})

		it('should validate safeInteger', () => {
			const schema = v.pipe(v.number(), v.safeInteger())
			expect(validate(schema, Number.MAX_SAFE_INTEGER).success).toBe(true)
			expect(validate(schema, Number.MAX_SAFE_INTEGER + 1).success).toBe(false)
		})
	})

	describe('bigint', () => {
		it('should validate bigints', () => {
			const schema = v.bigint()
			expect(validate(schema, BigInt(42)).success).toBe(true)
			expect(validate(schema, 42).success).toBe(false)
		})
	})

	describe('boolean', () => {
		it('should validate booleans', () => {
			const schema = v.boolean()
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, false).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})
	})

	describe('date', () => {
		it('should validate dates', () => {
			const schema = v.date()
			expect(validate(schema, new Date()).success).toBe(true)
			expect(validate(schema, '2023-01-01').success).toBe(false)
		})

		it('should validate with minValue/maxValue', () => {
			const minDate = new Date('2023-01-01')
			const maxDate = new Date('2023-12-31')
			const schema = v.pipe(v.date(), v.minValue(minDate), v.maxValue(maxDate))

			expect(validate(schema, new Date('2023-06-15')).success).toBe(true)
			expect(validate(schema, new Date('2022-06-15')).success).toBe(false)
		})
	})

	describe('symbol', () => {
		it('should validate symbols', () => {
			const schema = v.symbol()
			expect(validate(schema, Symbol('test')).success).toBe(true)
			expect(validate(schema, 'symbol').success).toBe(false)
		})
	})

	describe('undefined', () => {
		it('should validate undefined', () => {
			const schema = v.undefined()
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, null).success).toBe(false)
		})
	})

	describe('null', () => {
		it('should validate null', () => {
			const schema = v.null()
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})
	})

	describe('void', () => {
		it('should validate void (undefined)', () => {
			const schema = v.void()
			expect(validate(schema, undefined).success).toBe(true)
		})
	})

	describe('any', () => {
		it('should accept any value', () => {
			const schema = v.any()
			expect(validate(schema, 'string').success).toBe(true)
			expect(validate(schema, 123).success).toBe(true)
			expect(validate(schema, null).success).toBe(true)
		})
	})

	describe('unknown', () => {
		it('should accept any value', () => {
			const schema = v.unknown()
			expect(validate(schema, 'string').success).toBe(true)
			expect(validate(schema, 123).success).toBe(true)
		})
	})

	describe('never', () => {
		it('should reject all values', () => {
			const schema = v.never()
			expect(validate(schema, 'anything').success).toBe(false)
		})
	})
})

// ============================================================================
// Complex Types
// ============================================================================

describe('Valibot Complex Types', () => {
	describe('literal', () => {
		it('should validate string literals', () => {
			const schema = v.literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})

		it('should validate number literals', () => {
			const schema = v.literal(42)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 43).success).toBe(false)
		})

		it('should validate boolean literals', () => {
			const schema = v.literal(true)
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, false).success).toBe(false)
		})
	})

	describe('picklist (enum)', () => {
		it('should validate picklist values', () => {
			const schema = v.picklist(['red', 'green', 'blue'])
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('enum', () => {
		it('should validate native enum', () => {
			enum Color {
				Red = 'red',
				Green = 'green',
				Blue = 'blue',
			}
			const schema = v.enum(Color)
			expect(validate(schema, Color.Red).success).toBe(true)
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('array', () => {
		it('should validate arrays', () => {
			const schema = v.array(v.string())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, []).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})

		it('should validate with minLength/maxLength', () => {
			const schema = v.pipe(v.array(v.number()), v.minLength(1), v.maxLength(3))
			expect(validate(schema, [1]).success).toBe(true)
			expect(validate(schema, []).success).toBe(false)
			expect(validate(schema, [1, 2, 3, 4]).success).toBe(false)
		})

		it('should validate with length', () => {
			const schema = v.pipe(v.array(v.string()), v.length(2))
			expect(validate(schema, ['a', 'b']).success).toBe(true)
			expect(validate(schema, ['a']).success).toBe(false)
		})

		it('should validate nonEmpty', () => {
			const schema = v.pipe(v.array(v.string()), v.nonEmpty())
			expect(validate(schema, ['a']).success).toBe(true)
			expect(validate(schema, []).success).toBe(false)
		})
	})

	describe('tuple', () => {
		it('should validate tuples', () => {
			const schema = v.tuple([v.string(), v.number()])
			expect(validate(schema, ['hello', 42]).success).toBe(true)
			expect(validate(schema, [42, 'hello']).success).toBe(false)
			expect(validate(schema, ['hello']).success).toBe(false)
		})

		it('should validate tuples with rest', () => {
			const schema = v.tupleWithRest([v.string()], v.number())
			expect(validate(schema, ['hello']).success).toBe(true)
			expect(validate(schema, ['hello', 1, 2, 3]).success).toBe(true)
			expect(validate(schema, ['hello', 'world']).success).toBe(false)
		})
	})

	describe('object', () => {
		it('should validate objects', () => {
			const schema = v.object({
				name: v.string(),
				age: v.number(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should handle optional fields', () => {
			const schema = v.object({
				name: v.string(),
				age: v.optional(v.number()),
			})
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
		})

		it('should handle nullable fields', () => {
			const schema = v.object({
				name: v.string(),
				nickname: v.nullable(v.string()),
			})
			expect(validate(schema, { name: 'John', nickname: null }).success).toBe(true)
			expect(validate(schema, { name: 'John', nickname: 'Johnny' }).success).toBe(true)
		})

		it('should handle strict objects', () => {
			const schema = v.strictObject({ name: v.string() })
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, { name: 'John', extra: 'field' }).success).toBe(false)
		})

		it('should handle loose objects', () => {
			const schema = v.looseObject({ name: v.string() })
			const result = validate(schema, { name: 'John', extra: 'field' })
			expect(result.success).toBe(true)
		})

		it('should handle partial', () => {
			const schema = v.partial(v.object({ name: v.string(), age: v.number() }))
			expect(validate(schema, {}).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(true)
		})

		it('should handle required', () => {
			const schema = v.required(v.object({ name: v.optional(v.string()) }))
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, {}).success).toBe(false)
		})

		it('should handle pick', () => {
			const schema = v.pick(v.object({ name: v.string(), age: v.number() }), ['name'])
			expect(validate(schema, { name: 'John' }).success).toBe(true)
		})

		it('should handle omit', () => {
			const schema = v.omit(v.object({ name: v.string(), age: v.number() }), ['age'])
			expect(validate(schema, { name: 'John' }).success).toBe(true)
		})

		it('should handle merge with intersect', () => {
			const schema1 = v.object({ name: v.string() })
			const schema2 = v.object({ age: v.number() })
			// In Valibot v1, use intersect instead of merge
			const mergedSchema = v.intersect([schema1, schema2])
			expect(validate(mergedSchema, { name: 'John', age: 30 }).success).toBe(true)
		})
	})

	describe('record', () => {
		it('should validate records', () => {
			const schema = v.record(v.string(), v.number())
			expect(validate(schema, { a: 1, b: 2 }).success).toBe(true)
			expect(validate(schema, { a: 'not a number' }).success).toBe(false)
		})
	})

	describe('map', () => {
		it('should validate maps', () => {
			const schema = v.map(v.string(), v.number())
			const validMap = new Map([
				['a', 1],
				['b', 2],
			])
			expect(validate(schema, validMap).success).toBe(true)
		})
	})

	describe('set', () => {
		it('should validate sets', () => {
			const schema = v.set(v.number())
			const validSet = new Set([1, 2, 3])
			expect(validate(schema, validSet).success).toBe(true)
		})

		it('should validate with minSize/maxSize', () => {
			const schema = v.pipe(v.set(v.number()), v.minSize(1), v.maxSize(3))
			expect(validate(schema, new Set([1])).success).toBe(true)
			expect(validate(schema, new Set()).success).toBe(false)
			expect(validate(schema, new Set([1, 2, 3, 4])).success).toBe(false)
		})
	})

	describe('union', () => {
		it('should validate unions', () => {
			const schema = v.union([v.string(), v.number()])
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('variant (discriminated union)', () => {
		it('should validate variants', () => {
			const schema = v.variant('type', [
				v.object({ type: v.literal('a'), value: v.string() }),
				v.object({ type: v.literal('b'), value: v.number() }),
			])
			expect(validate(schema, { type: 'a', value: 'hello' }).success).toBe(true)
			expect(validate(schema, { type: 'b', value: 42 }).success).toBe(true)
			expect(validate(schema, { type: 'c', value: 'x' }).success).toBe(false)
		})
	})

	describe('intersect', () => {
		it('should validate intersections', () => {
			const schema = v.intersect([v.object({ name: v.string() }), v.object({ age: v.number() })])
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})
	})

	describe('lazy (recursive)', () => {
		it('should validate recursive schemas', () => {
			type Node = {
				value: string
				children: Node[]
			}

			const nodeSchema: v.GenericSchema<Node> = v.object({
				value: v.string(),
				children: v.lazy(() => v.array(nodeSchema)),
			})

			const validTree: Node = {
				value: 'root',
				children: [
					{ value: 'child1', children: [] },
					{
						value: 'child2',
						children: [{ value: 'grandchild', children: [] }],
					},
				],
			}

			expect(validate(nodeSchema, validTree).success).toBe(true)
		})
	})

	describe('instance', () => {
		it('should validate class instances', () => {
			class MyClass {
				constructor(public value: string) {}
			}
			const schema = v.instance(MyClass)
			expect(validate(schema, new MyClass('test')).success).toBe(true)
			expect(validate(schema, { value: 'test' }).success).toBe(false)
		})
	})
})

// ============================================================================
// Transformations
// ============================================================================

describe('Valibot Transformations', () => {
	it('should transform values', () => {
		const schema = v.pipe(
			v.string(),
			v.transform((val) => val.toUpperCase())
		)
		const result = validate(schema, 'hello')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('HELLO')
		}
	})

	it('should chain transformations', () => {
		const schema = v.pipe(v.string(), v.trim(), v.toLowerCase())
		const result = validate(schema, '  HELLO  ')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('hello')
		}
	})
})

// ============================================================================
// Custom Validation
// ============================================================================

describe('Valibot Custom Validation', () => {
	it('should validate with custom check', () => {
		const schema = v.pipe(
			v.string(),
			v.check((val) => val.length > 3, 'String must be longer than 3 characters')
		)
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, 'hi').success).toBe(false)
	})
})

// ============================================================================
// Default Values
// ============================================================================

describe('Valibot Default Values', () => {
	it('should use default values with fallback', () => {
		const schema = v.object({
			name: v.string(),
			role: v.fallback(v.string(), 'user'),
		})

		const result = validate(schema, { name: 'John' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.role).toBe('user')
		}
	})
})

// ============================================================================
// Type Inference
// ============================================================================

describe('Valibot Type Inference', () => {
	it('should infer output type', () => {
		const schema = v.object({
			name: v.string(),
			age: v.number(),
			email: v.optional(v.pipe(v.string(), v.email())),
		})

		type Output = InferOutput<typeof schema>

		const validData: Output = { name: 'John', age: 30 }
		expect(validate(schema, validData).success).toBe(true)
	})

	it('should infer input type for transforms', () => {
		const schema = v.pipe(
			v.string(),
			v.transform((val) => val.length)
		)

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

describe('Valibot JSON Schema Conversion', () => {
	it('should convert string schema', async () => {
		const schema = v.string()
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('string')
	})

	it('should convert number schema', async () => {
		const schema = v.number()
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('number')
	})

	it('should convert object schema', async () => {
		const schema = v.object({
			name: v.string(),
			age: v.number(),
		})
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('object')
		expect(jsonSchema.properties).toHaveProperty('name')
		expect(jsonSchema.properties).toHaveProperty('age')
	})

	it('should convert array schema', async () => {
		const schema = v.array(v.string())
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('array')
	})

	it('should convert picklist schema', async () => {
		const schema = v.picklist(['a', 'b', 'c'])
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.enum).toEqual(['a', 'b', 'c'])
	})

	it('should convert union schema', async () => {
		const schema = v.union([v.string(), v.number()])
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.anyOf || jsonSchema.oneOf).toBeDefined()
	})

	it('should work synchronously', () => {
		const schema = v.pipe(v.string(), v.minLength(1), v.maxLength(100))
		const jsonSchema = toJsonSchemaSync(schema)
		expect(jsonSchema.type).toBe('string')
	})
})

// ============================================================================
// Detection
// ============================================================================

describe('Valibot Detection', () => {
	it('should be detected by isValibotSchema', () => {
		expect(isValibotSchema(v.string())).toBe(true)
		expect(isValibotSchema(v.number())).toBe(true)
		expect(isValibotSchema(v.object({}))).toBe(true)
	})

	it('should be detected as Standard Schema (Valibot v1+)', () => {
		expect(isStandardSchema(v.string())).toBe(true)
	})

	it('should return correct vendor', () => {
		expect(detectVendor(v.string())).toBe('valibot')
	})

	it('should return standard-schema in detect()', () => {
		const result = detect(v.string())
		expect(result?.type).toBe('standard-schema')
		expect(result?.vendor).toBe('valibot')
	})
})

// ============================================================================
// Error Messages
// ============================================================================

describe('Valibot Error Messages', () => {
	it('should include error messages', () => {
		const schema = v.string()
		const result = validate(schema, 123)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].message).toBeTruthy()
		}
	})

	it('should include custom error messages', () => {
		const schema = v.pipe(v.string(), v.minLength(5, 'Must be at least 5 characters'))
		const result = validate(schema, 'hi')
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].message).toBe('Must be at least 5 characters')
		}
	})

	it('should include path for nested errors', () => {
		const schema = v.object({
			user: v.object({
				name: v.string(),
			}),
		})
		const result = validate(schema, { user: { name: 123 } })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].path).toBeDefined()
		}
	})
})

// ============================================================================
// is(), parse(), assert()
// ============================================================================

describe('Valibot with is(), parse(), assert()', () => {
	const userSchema = v.object({
		name: v.string(),
		age: v.number(),
	})

	describe('is()', () => {
		it('should narrow type correctly', () => {
			const data: unknown = { name: 'John', age: 30 }
			if (is(userSchema, data)) {
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
			expect(data.name).toBe('John')
		})

		it('should throw ValidationError', () => {
			expect(() => assert(userSchema, { name: 'John' })).toThrow(ValidationError)
		})
	})
})

// ============================================================================
// Nullish Handling
// ============================================================================

describe('Valibot Nullish Handling', () => {
	it('should handle optional', () => {
		const schema = v.optional(v.string())
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, undefined).success).toBe(true)
		expect(validate(schema, null).success).toBe(false)
	})

	it('should handle nullable', () => {
		const schema = v.nullable(v.string())
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, null).success).toBe(true)
		expect(validate(schema, undefined).success).toBe(false)
	})

	it('should handle nullish', () => {
		const schema = v.nullish(v.string())
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, null).success).toBe(true)
		expect(validate(schema, undefined).success).toBe(true)
	})

	it('should handle nonOptional', () => {
		const schema = v.nonOptional(v.optional(v.string()))
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, undefined).success).toBe(false)
	})

	it('should handle nonNullable', () => {
		const schema = v.nonNullable(v.nullable(v.string()))
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, null).success).toBe(false)
	})

	it('should handle nonNullish', () => {
		const schema = v.nonNullish(v.nullish(v.string()))
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, null).success).toBe(false)
		expect(validate(schema, undefined).success).toBe(false)
	})
})
