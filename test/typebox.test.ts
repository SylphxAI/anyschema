/**
 * TypeBox Integration Tests
 *
 * Tests validation and JSON Schema transformation for TypeBox schemas.
 * TypeBox schemas ARE JSON Schema, so transformation should be identity.
 */

import { describe, expect, it } from 'bun:test'
import { Type } from '@sinclair/typebox'
import { createTransformer, createValidator, typeboxTransformer, typeboxValidator } from '../src/adapter/index.js'

// Create validator and transformer with TypeBox adapter
const { validate, is, parse } = createValidator({ adapters: [typeboxValidator] })
const { toJsonSchema } = createTransformer({ adapters: [typeboxTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('TypeBox Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = Type.String()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = Type.Number()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = Type.Boolean()
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate null', () => {
			const schema = Type.Null()
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})

		it('should validate integer', () => {
			const schema = Type.Integer()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 42.5).success).toBe(false)
		})
	})

	describe('Objects', () => {
		it('should validate object', () => {
			const schema = Type.Object({
				name: Type.String(),
				age: Type.Number(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate nested objects', () => {
			const schema = Type.Object({
				user: Type.Object({
					name: Type.String(),
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = Type.Array(Type.String())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})

		it('should validate array constraints', () => {
			const schema = Type.Array(Type.String(), { minItems: 1, maxItems: 3 })
			expect(validate(schema, ['a']).success).toBe(true)
			expect(validate(schema, []).success).toBe(false)
			expect(validate(schema, ['a', 'b', 'c', 'd']).success).toBe(false)
		})
	})

	describe('Tuple', () => {
		it('should validate tuple', () => {
			const schema = Type.Tuple([Type.String(), Type.Number()])
			expect(validate(schema, ['hello', 42]).success).toBe(true)
			expect(validate(schema, [42, 'hello']).success).toBe(false)
		})
	})

	describe('Union', () => {
		it('should validate union', () => {
			const schema = Type.Union([Type.String(), Type.Number()])
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('Optional and Nullable', () => {
		it('should validate optional in object', () => {
			// TypeBox Optional is for object properties only
			const schema = Type.Object({
				name: Type.Optional(Type.String()),
			})
			expect(validate(schema, {}).success).toBe(true)
			expect(validate(schema, { name: 'hello' }).success).toBe(true)
		})
	})

	describe('Literal', () => {
		it('should validate literal', () => {
			const schema = Type.Literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})
	})

	describe('Enum', () => {
		it('should validate enum', () => {
			const schema = Type.Union([Type.Literal('red'), Type.Literal('green'), Type.Literal('blue')])
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('Constraints', () => {
		it('should validate string minLength/maxLength', () => {
			const schema = Type.String({ minLength: 2, maxLength: 5 })
			expect(validate(schema, 'hi').success).toBe(true)
			expect(validate(schema, 'h').success).toBe(false)
			expect(validate(schema, 'hello!').success).toBe(false)
		})

		it('should validate number minimum/maximum', () => {
			const schema = Type.Number({ minimum: 0, maximum: 100 })
			expect(validate(schema, 50).success).toBe(true)
			expect(validate(schema, -1).success).toBe(false)
			expect(validate(schema, 101).success).toBe(false)
		})

		it('should validate pattern', () => {
			const schema = Type.String({ pattern: '^[A-Z]+$' })
			expect(validate(schema, 'ABC').success).toBe(true)
			expect(validate(schema, 'abc').success).toBe(false)
		})

		it('should validate format email with registered format', () => {
			// TypeBox requires format validators to be registered
			const { FormatRegistry } = require('@sinclair/typebox')
			FormatRegistry.Set('email', (v: string) => /^[^@]+@[^@]+\.[^@]+$/.test(v))

			const schema = Type.String({ format: 'email' })
			expect(validate(schema, 'test@example.com').success).toBe(true)
			expect(validate(schema, 'invalid').success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = Type.String()
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = Type.String()
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = Type.String()
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('TypeBox JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = Type.String()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = Type.Number()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = Type.Boolean()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert null', () => {
			const schema = Type.Null()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('null')
		})

		it('should convert integer', () => {
			const schema = Type.Integer()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('integer')
		})
	})

	describe('Objects', () => {
		it('should convert object', () => {
			const schema = Type.Object({
				name: Type.String(),
				age: Type.Number(),
			})
			const json = toJsonSchema(schema)
			expect(json.type).toBe('object')
			expect(json.properties).toBeDefined()
		})
	})

	describe('Arrays', () => {
		it('should convert array', () => {
			const schema = Type.Array(Type.String())
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
		})

		it('should preserve array constraints', () => {
			const schema = Type.Array(Type.String(), { minItems: 1, maxItems: 10 })
			const json = toJsonSchema(schema)
			expect(json.minItems).toBe(1)
			expect(json.maxItems).toBe(10)
		})
	})

	describe('Union', () => {
		it('should convert union to anyOf', () => {
			const schema = Type.Union([Type.String(), Type.Number()])
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
		})
	})

	describe('Literal', () => {
		it('should convert literal to const', () => {
			const schema = Type.Literal('hello')
			const json = toJsonSchema(schema)
			expect(json.const).toBe('hello')
		})
	})

	describe('Constraints', () => {
		it('should preserve string constraints', () => {
			const schema = Type.String({ minLength: 2, maxLength: 10 })
			const json = toJsonSchema(schema)
			expect(json.minLength).toBe(2)
			expect(json.maxLength).toBe(10)
		})

		it('should preserve number constraints', () => {
			const schema = Type.Number({ minimum: 0, maximum: 100 })
			const json = toJsonSchema(schema)
			expect(json.minimum).toBe(0)
			expect(json.maximum).toBe(100)
		})

		it('should preserve pattern', () => {
			const schema = Type.String({ pattern: '^[A-Z]+$' })
			const json = toJsonSchema(schema)
			expect(json.pattern).toBe('^[A-Z]+$')
		})

		it('should preserve format', () => {
			const schema = Type.String({ format: 'email' })
			const json = toJsonSchema(schema)
			expect(json.format).toBe('email')
		})
	})

	describe('Metadata', () => {
		it('should preserve title', () => {
			const schema = Type.String({ title: 'Name' })
			const json = toJsonSchema(schema)
			expect(json.title).toBe('Name')
		})

		it('should preserve description', () => {
			const schema = Type.String({ description: 'User name' })
			const json = toJsonSchema(schema)
			expect(json.description).toBe('User name')
		})
	})
})
