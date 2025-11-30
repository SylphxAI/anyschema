/**
 * Joi Integration Tests
 *
 * Tests validation and JSON Schema transformation for Joi schemas.
 */

import { describe, expect, it } from 'bun:test'
import Joi from 'joi'
import { createTransformer, createValidator, joiTransformer, joiValidator } from '../src/adapter/index.js'

// Create validator and transformer with Joi adapter
const { validate, is, parse } = createValidator({ adapters: [joiValidator] })
const { toJsonSchema } = createTransformer({ adapters: [joiTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('Joi Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = Joi.string().required()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = Joi.number().required()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = Joi.boolean().required()
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate date', () => {
			const schema = Joi.date().required()
			expect(validate(schema, new Date()).success).toBe(true)
		})
	})

	describe('Objects', () => {
		it('should validate object', () => {
			const schema = Joi.object({
				name: Joi.string().required(),
				age: Joi.number().required(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate nested objects', () => {
			const schema = Joi.object({
				user: Joi.object({
					name: Joi.string().required(),
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = Joi.array().items(Joi.string())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})

		it('should validate array length', () => {
			const schema = Joi.array().items(Joi.string()).min(1).max(3)
			expect(validate(schema, ['a']).success).toBe(true)
			expect(validate(schema, []).success).toBe(false)
			expect(validate(schema, ['a', 'b', 'c', 'd']).success).toBe(false)
		})
	})

	describe('Optional and Nullable', () => {
		it('should validate optional', () => {
			const schema = Joi.string()
			expect(validate(schema, undefined).success).toBe(true)
		})

		it('should validate required', () => {
			const schema = Joi.string().required()
			expect(validate(schema, undefined).success).toBe(false)
		})

		it('should validate nullable', () => {
			const schema = Joi.string().allow(null)
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})
	})

	describe('Constraints', () => {
		it('should validate min/max length', () => {
			const schema = Joi.string().min(2).max(5).required()
			expect(validate(schema, 'hi').success).toBe(true)
			expect(validate(schema, 'h').success).toBe(false)
			expect(validate(schema, 'hello!').success).toBe(false)
		})

		it('should validate min/max number', () => {
			const schema = Joi.number().min(0).max(100).required()
			expect(validate(schema, 50).success).toBe(true)
			expect(validate(schema, -1).success).toBe(false)
			expect(validate(schema, 101).success).toBe(false)
		})

		it('should validate email', () => {
			const schema = Joi.string().email().required()
			expect(validate(schema, 'test@example.com').success).toBe(true)
			expect(validate(schema, 'invalid').success).toBe(false)
		})

		it('should validate uri', () => {
			const schema = Joi.string().uri().required()
			expect(validate(schema, 'https://example.com').success).toBe(true)
			expect(validate(schema, 'invalid').success).toBe(false)
		})

		it('should validate pattern', () => {
			const schema = Joi.string()
				.pattern(/^[A-Z]+$/)
				.required()
			expect(validate(schema, 'ABC').success).toBe(true)
			expect(validate(schema, 'abc').success).toBe(false)
		})
	})

	describe('Alternatives', () => {
		it('should validate alternatives', () => {
			const schema = Joi.alternatives().try(Joi.string(), Joi.number())
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = Joi.string().required()
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = Joi.string().required()
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = Joi.string().required()
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('Joi JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = Joi.string()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = Joi.number()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = Joi.boolean()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert date', () => {
			const schema = Joi.date()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
			expect(json.format).toBe('date-time')
		})
	})

	describe('Objects', () => {
		it('should convert object', () => {
			const schema = Joi.object({
				name: Joi.string().required(),
				age: Joi.number().required(),
			})
			const json = toJsonSchema(schema)
			expect(json.type).toBe('object')
			expect(json.properties).toBeDefined()
			expect(json.properties?.name).toEqual({ type: 'string' })
			expect(json.properties?.age).toEqual({ type: 'number' })
		})
	})

	describe('Arrays', () => {
		it('should convert array', () => {
			const schema = Joi.array().items(Joi.string())
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.items).toEqual({ type: 'string' })
		})
	})

	describe('Alternatives', () => {
		it('should convert alternatives to anyOf', () => {
			const schema = Joi.alternatives().try(Joi.string(), Joi.number())
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			expect(json.anyOf).toContainEqual({ type: 'string' })
			expect(json.anyOf).toContainEqual({ type: 'number' })
		})
	})

	describe('Constraints', () => {
		it('should include string constraints', () => {
			const schema = Joi.string().min(2).max(10)
			const json = toJsonSchema(schema)
			expect(json.minLength).toBe(2)
			expect(json.maxLength).toBe(10)
		})

		it('should include number constraints', () => {
			const schema = Joi.number().min(0).max(100)
			const json = toJsonSchema(schema)
			expect(json.minimum).toBe(0)
			expect(json.maximum).toBe(100)
		})

		it('should include format for email', () => {
			const schema = Joi.string().email()
			const json = toJsonSchema(schema)
			expect(json.format).toBe('email')
		})

		it('should include format for uri', () => {
			const schema = Joi.string().uri()
			const json = toJsonSchema(schema)
			expect(json.format).toBe('uri')
		})

		it('should include pattern', () => {
			const schema = Joi.string().pattern(/^[A-Z]+$/)
			const json = toJsonSchema(schema)
			expect(json.pattern).toBe('^[A-Z]+$')
		})
	})
})
