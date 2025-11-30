/**
 * Superstruct Integration Tests
 *
 * Tests validation and JSON Schema transformation for Superstruct schemas.
 */

import { describe, expect, it } from 'bun:test'
import * as s from 'superstruct'
import {
	createTransformer,
	createValidator,
	superstructTransformer,
	superstructValidator,
} from '../src/adapter/index.js'

// Create validator and transformer with Superstruct adapter
const { validate, is, parse } = createValidator({ adapters: [superstructValidator] })
const { toJsonSchema } = createTransformer({ adapters: [superstructTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('Superstruct Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = s.string()
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = s.number()
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = s.boolean()
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate date', () => {
			const schema = s.date()
			expect(validate(schema, new Date()).success).toBe(true)
			expect(validate(schema, 'not a date').success).toBe(false)
		})
	})

	describe('Objects', () => {
		it('should validate object', () => {
			const schema = s.object({
				name: s.string(),
				age: s.number(),
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate nested objects', () => {
			const schema = s.object({
				user: s.object({
					name: s.string(),
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = s.array(s.string())
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})
	})

	describe('Tuple', () => {
		it('should validate tuple', () => {
			const schema = s.tuple([s.string(), s.number()])
			expect(validate(schema, ['hello', 42]).success).toBe(true)
			expect(validate(schema, [42, 'hello']).success).toBe(false)
		})
	})

	describe('Union', () => {
		it('should validate union', () => {
			const schema = s.union([s.string(), s.number()])
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('Optional and Nullable', () => {
		it('should validate optional', () => {
			const schema = s.optional(s.string())
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})

		it('should validate nullable', () => {
			const schema = s.nullable(s.string())
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})
	})

	describe('Literal', () => {
		it('should validate literal', () => {
			const schema = s.literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})
	})

	describe('Enums', () => {
		it('should validate enums', () => {
			const schema = s.enums(['red', 'green', 'blue'])
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = s.string()
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = s.string()
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = s.string()
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('Superstruct JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = s.string()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = s.number()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = s.boolean()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert date', () => {
			const schema = s.date()
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
			expect(json.format).toBe('date-time')
		})
	})

	describe('Objects', () => {
		it('should convert object', () => {
			const schema = s.object({
				name: s.string(),
				age: s.number(),
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
			const schema = s.array(s.string())
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.items).toEqual({ type: 'string' })
		})
	})

	describe('Tuple', () => {
		it('should convert tuple to array', () => {
			const schema = s.tuple([s.string(), s.number()])
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			// Note: Superstruct doesn't expose tuple items for introspection
		})
	})

	describe('Union', () => {
		it('should convert union to anyOf', () => {
			const schema = s.union([s.string(), s.number()])
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			// Note: Superstruct doesn't expose union options for introspection
		})
	})

	describe('Optional', () => {
		it('should convert optional (inner type)', () => {
			const schema = s.optional(s.string())
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})
	})

	describe('Nullable', () => {
		it('should convert nullable (inner type)', () => {
			const schema = s.nullable(s.string())
			const json = toJsonSchema(schema)
			// Note: Superstruct's nullable modifies validator, type remains 'string'
			// Introspection returns the inner type, not a nullable wrapper
			expect(json.type).toBe('string')
		})
	})

	describe('Literal', () => {
		it('should convert literal to const', () => {
			const schema = s.literal('hello')
			const json = toJsonSchema(schema)
			expect(json.const).toBe('hello')
		})
	})

	describe('Enums', () => {
		it('should convert enums to enum', () => {
			const schema = s.enums(['red', 'green', 'blue'])
			const json = toJsonSchema(schema)
			expect(json.enum).toBeDefined()
			expect(json.enum).toContain('red')
			expect(json.enum).toContain('green')
			expect(json.enum).toContain('blue')
		})
	})
})
