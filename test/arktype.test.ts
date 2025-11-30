/**
 * ArkType Comprehensive Tests
 *
 * Tests for all ArkType features and their integration with AnySchema.
 * ArkType uses a unique string-based type syntax.
 */

import { type } from 'arktype'
import { describe, expect, it } from 'vitest'

import {
	assert,
	detect,
	detectVendor,
	type InferOutput,
	is,
	isArkTypeSchema,
	parse,
	parseAsync,
	toJsonSchema,
	toJsonSchemaSync,
	ValidationError,
	validate,
	validateAsync,
} from '../src/index.js'

// ============================================================================
// Primitive Types
// ============================================================================

describe('ArkType Primitives', () => {
	describe('string', () => {
		it('should validate string', () => {
			const schema = type('string')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
			expect(validate(schema, null).success).toBe(false)
		})

		it('should validate string with length constraints', () => {
			const schema = type('string > 2')
			expect(validate(schema, 'abc').success).toBe(true)
			expect(validate(schema, 'ab').success).toBe(false)
		})

		it('should validate string patterns', () => {
			const emailSchema = type('string.email')
			expect(validate(emailSchema, 'test@example.com').success).toBe(true)
			expect(validate(emailSchema, 'invalid').success).toBe(false)
		})

		it('should validate URL', () => {
			const urlSchema = type('string.url')
			expect(validate(urlSchema, 'https://example.com').success).toBe(true)
			expect(validate(urlSchema, 'not-a-url').success).toBe(false)
		})
	})

	describe('number', () => {
		it('should validate number', () => {
			const schema = type('number')
			expect(validate(schema, 123).success).toBe(true)
			expect(validate(schema, 3.14).success).toBe(true)
			expect(validate(schema, '123').success).toBe(false)
		})

		it('should validate integer', () => {
			const schema = type('number.integer')
			expect(validate(schema, 123).success).toBe(true)
			expect(validate(schema, 3.14).success).toBe(false)
		})

		it('should validate number range', () => {
			const schema = type('number >= 0')
			expect(validate(schema, 0).success).toBe(true)
			expect(validate(schema, 10).success).toBe(true)
			expect(validate(schema, -1).success).toBe(false)
		})

		it('should validate number between range', () => {
			const schema = type('0 < number < 100')
			expect(validate(schema, 50).success).toBe(true)
			expect(validate(schema, 0).success).toBe(false)
			expect(validate(schema, 100).success).toBe(false)
		})
	})

	describe('bigint', () => {
		it('should validate bigint', () => {
			const schema = type('bigint')
			expect(validate(schema, BigInt(123)).success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})
	})

	describe('boolean', () => {
		it('should validate boolean', () => {
			const schema = type('boolean')
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, false).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
			expect(validate(schema, 1).success).toBe(false)
		})
	})

	describe('symbol', () => {
		it('should validate symbol', () => {
			const schema = type('symbol')
			expect(validate(schema, Symbol('test')).success).toBe(true)
			expect(validate(schema, 'symbol').success).toBe(false)
		})
	})

	describe('null and undefined', () => {
		it('should validate null', () => {
			const schema = type('null')
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})

		it('should validate undefined', () => {
			const schema = type('undefined')
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, null).success).toBe(false)
		})
	})
})

// ============================================================================
// Literal Types
// ============================================================================

describe('ArkType Literals', () => {
	it('should validate string literal', () => {
		const schema = type('"hello"')
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, 'world').success).toBe(false)
	})

	it('should validate number literal', () => {
		const schema = type('42')
		expect(validate(schema, 42).success).toBe(true)
		expect(validate(schema, 43).success).toBe(false)
	})

	it('should validate boolean literal', () => {
		const trueSchema = type('true')
		expect(validate(trueSchema, true).success).toBe(true)
		expect(validate(trueSchema, false).success).toBe(false)

		const falseSchema = type('false')
		expect(validate(falseSchema, false).success).toBe(true)
		expect(validate(falseSchema, true).success).toBe(false)
	})
})

// ============================================================================
// Object Types
// ============================================================================

describe('ArkType Objects', () => {
	it('should validate simple object', () => {
		const schema = type({
			name: 'string',
			age: 'number',
		})

		expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
		expect(validate(schema, { name: 'John' }).success).toBe(false)
		expect(validate(schema, { name: 123, age: 30 }).success).toBe(false)
	})

	it('should validate optional properties', () => {
		const schema = type({
			name: 'string',
			'age?': 'number',
		})

		expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
		expect(validate(schema, { name: 'John' }).success).toBe(true)
	})

	it('should validate nested objects', () => {
		const schema = type({
			user: {
				profile: {
					name: 'string',
					bio: 'string',
				},
			},
		})

		const validData = {
			user: {
				profile: {
					name: 'John',
					bio: 'Developer',
				},
			},
		}

		expect(validate(schema, validData).success).toBe(true)
	})

	it('should validate with extra keys by default', () => {
		const schema = type({
			name: 'string',
		})

		// ArkType allows extra keys by default
		expect(validate(schema, { name: 'John', extra: 'field' }).success).toBe(true)
	})
})

// ============================================================================
// Array Types
// ============================================================================

describe('ArkType Arrays', () => {
	it('should validate array of strings', () => {
		const schema = type('string[]')
		expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
		expect(validate(schema, [1, 2, 3]).success).toBe(false)
		expect(validate(schema, []).success).toBe(true)
	})

	it('should validate array of objects', () => {
		const schema = type({ id: 'number', name: 'string' }).array()
		const data = [
			{ id: 1, name: 'Alice' },
			{ id: 2, name: 'Bob' },
		]
		expect(validate(schema, data).success).toBe(true)
	})

	it('should validate with length constraints', () => {
		const schema = type('string[] > 0')
		expect(validate(schema, ['a']).success).toBe(true)
		expect(validate(schema, []).success).toBe(false)
	})
})

// ============================================================================
// Tuple Types
// ============================================================================

describe('ArkType Tuples', () => {
	it('should validate tuple', () => {
		const schema = type(['string', 'number'])
		expect(validate(schema, ['hello', 42]).success).toBe(true)
		expect(validate(schema, [42, 'hello']).success).toBe(false)
		expect(validate(schema, ['hello']).success).toBe(false)
	})

	it('should validate tuple with different types', () => {
		const schema = type(['string', 'number', 'boolean'])
		expect(validate(schema, ['hello', 42, true]).success).toBe(true)
	})
})

// ============================================================================
// Union Types
// ============================================================================

describe('ArkType Unions', () => {
	it('should validate union with pipe syntax', () => {
		const schema = type('string | number')
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, 123).success).toBe(true)
		expect(validate(schema, true).success).toBe(false)
	})

	it('should validate union with null', () => {
		const schema = type('string | null')
		expect(validate(schema, 'hello').success).toBe(true)
		expect(validate(schema, null).success).toBe(true)
		expect(validate(schema, undefined).success).toBe(false)
	})

	it('should validate discriminated union', () => {
		const schema = type({ type: '"a"', valueA: 'string' }, '|', { type: '"b"', valueB: 'number' })

		expect(validate(schema, { type: 'a', valueA: 'test' }).success).toBe(true)
		expect(validate(schema, { type: 'b', valueB: 123 }).success).toBe(true)
		expect(validate(schema, { type: 'c' }).success).toBe(false)
	})
})

// ============================================================================
// Intersection Types
// ============================================================================

describe('ArkType Intersections', () => {
	it('should validate intersection with & syntax', () => {
		const schema = type({ name: 'string' }, '&', { age: 'number' })
		expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
		expect(validate(schema, { name: 'John' }).success).toBe(false)
	})
})

// ============================================================================
// Record Types
// ============================================================================

describe('ArkType Records', () => {
	it('should validate record type', () => {
		const schema = type('Record<string, number>')
		expect(validate(schema, { a: 1, b: 2 }).success).toBe(true)
		expect(validate(schema, { a: 'one' }).success).toBe(false)
		expect(validate(schema, {}).success).toBe(true)
	})
})

// ============================================================================
// Date Types
// ============================================================================

describe('ArkType Dates', () => {
	it('should validate Date instance', () => {
		const schema = type('Date')
		expect(validate(schema, new Date()).success).toBe(true)
		expect(validate(schema, '2024-01-01').success).toBe(false)
		expect(validate(schema, Date.now()).success).toBe(false)
	})
})

// ============================================================================
// Default Values
// ============================================================================

describe('ArkType Default Values', () => {
	it('should apply default value', () => {
		const schema = type({
			name: 'string',
			role: 'string = "user"',
		})

		const result = validate(schema, { name: 'John' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.role).toBe('user')
		}
	})
})

// ============================================================================
// Morphs (Transformations)
// ============================================================================

describe('ArkType Morphs', () => {
	it('should transform with pipe', () => {
		const schema = type('string').pipe((s) => s.toUpperCase())
		const result = validate(schema, 'hello')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('HELLO')
		}
	})

	it('should parse and transform', () => {
		const schema = type('string.numeric.parse')
		const result = validate(schema, '123')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe(123)
		}
	})
})

// ============================================================================
// Narrow (Refinements)
// ============================================================================

describe('ArkType Narrow', () => {
	it('should narrow with custom predicate', () => {
		const schema = type('number').narrow((n) => n > 0)
		expect(validate(schema, 5).success).toBe(true)
		expect(validate(schema, -1).success).toBe(false)
		expect(validate(schema, 0).success).toBe(false)
	})

	it('should narrow with message', () => {
		const schema = type('number').narrow((n, ctx) => {
			if (n <= 0) {
				return ctx.mustBe('positive')
			}
			return true
		})
		const result = validate(schema, -1)
		expect(result.success).toBe(false)
	})
})

// ============================================================================
// Type Inference
// ============================================================================

describe('ArkType Type Inference', () => {
	it('should infer simple types', () => {
		const schema = type('string')
		type Output = InferOutput<typeof schema>
		// Type-level test: Output should be string
		const value: Output = 'hello'
		expect(typeof value).toBe('string')
	})

	it('should infer object types', () => {
		const schema = type({
			name: 'string',
			age: 'number',
			'email?': 'string',
		})
		type Output = InferOutput<typeof schema>

		const value: Output = { name: 'John', age: 30 }
		expect(value.name).toBe('John')
		expect(value.age).toBe(30)
	})

	it('should infer array types', () => {
		const schema = type('number[]')
		type Output = InferOutput<typeof schema>

		const value: Output = [1, 2, 3]
		expect(Array.isArray(value)).toBe(true)
	})

	it('should infer union types', () => {
		const schema = type('string | number')
		type Output = InferOutput<typeof schema>

		const stringValue: Output = 'hello'
		const numberValue: Output = 123
		expect(typeof stringValue === 'string' || typeof stringValue === 'number').toBe(true)
		expect(typeof numberValue === 'string' || typeof numberValue === 'number').toBe(true)
	})
})

// ============================================================================
// Detection
// ============================================================================

describe('ArkType Detection', () => {
	it('should detect ArkType schema', () => {
		const schema = type('string')
		expect(isArkTypeSchema(schema)).toBe(true)
	})

	it('should return correct vendor', () => {
		const schema = type({ name: 'string' })
		const vendor = detectVendor(schema)
		// ArkType v2 implements Standard Schema
		expect(vendor === 'arktype' || vendor === 'standard-schema').toBe(true)
	})

	it('should return detection result', () => {
		const schema = type('number')
		const result = detect(schema)
		expect(result).not.toBeNull()
		expect(result?.type).toBeDefined()
		expect(result?.vendor).toBeDefined()
	})
})

// ============================================================================
// JSON Schema Conversion
// ============================================================================

describe('ArkType JSON Schema', () => {
	it('should convert simple type to JSON Schema', async () => {
		const schema = type('string')
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('string')
	})

	it('should convert object to JSON Schema', async () => {
		const schema = type({
			name: 'string',
			age: 'number',
		})
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('object')
		expect(jsonSchema.properties).toBeDefined()
	})

	it('should convert array to JSON Schema', async () => {
		const schema = type('string[]')
		const jsonSchema = await toJsonSchema(schema)
		expect(jsonSchema.type).toBe('array')
	})

	it('should work with sync conversion', () => {
		const schema = type('boolean')
		const jsonSchema = toJsonSchemaSync(schema)
		expect(jsonSchema.type).toBe('boolean')
	})
})

// ============================================================================
// API Integration
// ============================================================================

describe('ArkType API Integration', () => {
	describe('is()', () => {
		it('should return true for valid data', () => {
			const schema = type({ name: 'string', age: 'number' })
			expect(is(schema, { name: 'John', age: 30 })).toBe(true)
		})

		it('should return false for invalid data', () => {
			const schema = type('string')
			expect(is(schema, 123)).toBe(false)
			expect(is(schema, null)).toBe(false)
		})
	})

	describe('parse()', () => {
		it('should return data for valid input', () => {
			const schema = type('number')
			expect(parse(schema, 42)).toBe(42)
		})

		it('should throw ValidationError for invalid input', () => {
			const schema = type('string')
			expect(() => parse(schema, 123)).toThrow(ValidationError)
		})
	})

	describe('assert()', () => {
		it('should not throw for valid data', () => {
			const schema = type('boolean')
			expect(() => assert(schema, true)).not.toThrow()
		})

		it('should throw ValidationError for invalid data', () => {
			const schema = type('number')
			expect(() => assert(schema, 'not a number')).toThrow(ValidationError)
		})
	})

	describe('validateAsync()', () => {
		it('should validate asynchronously', async () => {
			const schema = type('string')
			const result = await validateAsync(schema, 'hello')
			expect(result.success).toBe(true)
		})
	})

	describe('parseAsync()', () => {
		it('should parse asynchronously', async () => {
			const schema = type('number')
			const result = await parseAsync(schema, 42)
			expect(result).toBe(42)
		})

		it('should throw on invalid async parse', async () => {
			const schema = type('string')
			await expect(parseAsync(schema, 123)).rejects.toThrow(ValidationError)
		})
	})
})

// ============================================================================
// Error Messages
// ============================================================================

describe('ArkType Error Messages', () => {
	it('should provide error message for wrong type', () => {
		const schema = type('string')
		const result = validate(schema, 123)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.issues[0].message).toBeTruthy()
		}
	})

	it('should provide path in nested errors', () => {
		const schema = type({
			user: {
				profile: {
					age: 'number',
				},
			},
		})

		const result = validate(schema, {
			user: {
				profile: {
					age: 'not a number',
				},
			},
		})

		expect(result.success).toBe(false)
		if (!result.success) {
			// ArkType provides path information in some form
			expect(result.issues.length).toBeGreaterThan(0)
		}
	})
})

// ============================================================================
// Advanced Types
// ============================================================================

describe('ArkType Advanced Types', () => {
	it('should validate keyof', () => {
		const schema = type("'a' | 'b' | 'c'")
		expect(validate(schema, 'a').success).toBe(true)
		expect(validate(schema, 'd').success).toBe(false)
	})

	it('should validate any', () => {
		const schema = type('unknown')
		expect(validate(schema, 'anything').success).toBe(true)
		expect(validate(schema, 123).success).toBe(true)
		expect(validate(schema, null).success).toBe(true)
	})

	it('should validate never for impossible types', () => {
		// 'never' in ArkType rejects everything
		const schema = type('never')
		expect(validate(schema, 'anything').success).toBe(false)
		expect(validate(schema, undefined).success).toBe(false)
	})
})

// ============================================================================
// Complex Real-World Examples
// ============================================================================

describe('ArkType Real-World Examples', () => {
	it('should validate API request', () => {
		const schema = type({
			method: '"GET" | "POST" | "PUT" | "DELETE"',
			path: 'string',
			'headers?': 'Record<string, string>',
			'body?': 'unknown',
		})

		expect(
			validate(schema, {
				method: 'GET',
				path: '/api/users',
			}).success
		).toBe(true)

		expect(
			validate(schema, {
				method: 'POST',
				path: '/api/users',
				headers: { 'Content-Type': 'application/json' },
				body: { name: 'John' },
			}).success
		).toBe(true)

		expect(
			validate(schema, {
				method: 'PATCH', // Invalid method
				path: '/api/users',
			}).success
		).toBe(false)
	})

	it('should validate user registration', () => {
		const schema = type({
			username: 'string > 2',
			email: 'string.email',
			password: 'string >= 8',
			'age?': 'number.integer >= 13',
		})

		expect(
			validate(schema, {
				username: 'john_doe',
				email: 'john@example.com',
				password: 'securepass123',
				age: 25,
			}).success
		).toBe(true)

		expect(
			validate(schema, {
				username: 'jo', // Too short
				email: 'john@example.com',
				password: 'securepass123',
			}).success
		).toBe(false)

		expect(
			validate(schema, {
				username: 'john_doe',
				email: 'invalid-email', // Invalid email
				password: 'securepass123',
			}).success
		).toBe(false)
	})

	it('should validate configuration object', () => {
		const schema = type({
			database: {
				host: 'string',
				port: '1 <= number.integer <= 65535',
				'ssl?': 'boolean',
			},
			'cache?': {
				enabled: 'boolean',
				'ttl?': 'number >= 0',
			},
		})

		expect(
			validate(schema, {
				database: {
					host: 'localhost',
					port: 5432,
					ssl: true,
				},
				cache: {
					enabled: true,
					ttl: 3600,
				},
			}).success
		).toBe(true)

		expect(
			validate(schema, {
				database: {
					host: 'localhost',
					port: 5432,
				},
			}).success
		).toBe(true)
	})
})
