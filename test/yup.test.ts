/**
 * Yup Integration Tests
 *
 * Tests validation and JSON Schema transformation for Yup schemas.
 */

import { describe, expect, it } from 'bun:test'
import * as y from 'yup'
import { createTransformer, createValidator, yupTransformer, yupValidator } from '../src/adapter/index.js'

// Create validator and transformer with Yup adapter
const { validate, is, parse } = createValidator({ adapters: [yupValidator] })
const { toJsonSchema } = createTransformer({ adapters: [yupTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('Yup Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = y.string().required()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = y.number().required()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = y.boolean().required()
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate date', () => {
			const schema = y.date().required()
			expect(validate(schema, new Date()).success).toBe(true)
		})
	})

	describe('Objects', () => {
		it('should validate object', () => {
			const schema = y.object({
				name: y.string().required(),
				age: y.number().required(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate nested objects', () => {
			const schema = y.object({
				user: y.object({
					name: y.string().required(),
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = y.array().of(y.string())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})
	})

	describe('Optional and Nullable', () => {
		it('should validate optional', () => {
			const schema = y.string()
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})

		it('should validate nullable', () => {
			const schema = y.string().nullable()
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})
	})

	describe('Constraints', () => {
		it('should validate min/max length', () => {
			const schema = y.string().min(2).max(5).required()
			expect(validate(schema, 'hi').success).toBe(true)
			expect(validate(schema, 'h').success).toBe(false)
			expect(validate(schema, 'hello!').success).toBe(false)
		})

		it('should validate min/max number', () => {
			const schema = y.number().min(0).max(100).required()
			expect(validate(schema, 50).success).toBe(true)
			expect(validate(schema, -1).success).toBe(false)
			expect(validate(schema, 101).success).toBe(false)
		})

		it('should validate email', () => {
			const schema = y.string().email().required()
			expect(validate(schema, 'test@example.com').success).toBe(true)
			expect(validate(schema, 'invalid').success).toBe(false)
		})

		it('should validate url', () => {
			const schema = y.string().url().required()
			expect(validate(schema, 'https://example.com').success).toBe(true)
			expect(validate(schema, 'invalid').success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = y.string().required()
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				// TypeScript should know data is string here
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = y.string().required()
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = y.string().required()
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('Yup JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = y.string()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = y.number()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = y.boolean()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert date', () => {
			const schema = y.date()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
			expect(json.format).toBe('date-time')
		})
	})

	describe('Objects', () => {
		it('should convert object', () => {
			const schema = y.object({
				name: y.string().required(),
				age: y.number().required(),
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
			const schema = y.array().of(y.string())
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.items).toEqual({ type: 'string' })
		})
	})

	describe('Constraints', () => {
		it('should include string constraints', () => {
			const schema = y.string().min(2).max(10)
			const json = toJsonSchema(schema)
			expect(json.minLength).toBe(2)
			expect(json.maxLength).toBe(10)
		})

		it('should include number constraints', () => {
			const schema = y.number().min(0).max(100)
			const json = toJsonSchema(schema)
			expect(json.minimum).toBe(0)
			expect(json.maximum).toBe(100)
		})

		it('should include format for email', () => {
			const schema = y.string().email()
			const json = toJsonSchema(schema)
			expect(json.format).toBe('email')
		})

		it('should include format for url', () => {
			const schema = y.string().url()
			const json = toJsonSchema(schema)
			expect(json.format).toBe('uri')
		})
	})

	describe('Nullable', () => {
		it('should convert nullable', () => {
			const schema = y.string().nullable()
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			expect(json.anyOf).toContainEqual({ type: 'null' })
		})
	})
})
