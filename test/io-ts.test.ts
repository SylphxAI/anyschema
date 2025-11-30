/**
 * io-ts Integration Tests
 *
 * Tests validation and JSON Schema transformation for io-ts schemas.
 */

import { describe, expect, it } from 'bun:test'
import * as t from 'io-ts'
import { createTransformer, createValidator, ioTsTransformer, ioTsValidator } from '../src/adapter/index.js'

// Create validator and transformer with io-ts adapter
const { validate, is, parse } = createValidator({ adapters: [ioTsValidator] })
const { toJsonSchema } = createTransformer({ adapters: [ioTsTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('io-ts Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = t.string
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = t.number
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = t.boolean
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate null', () => {
			const schema = t.null
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})

		it('should validate undefined', () => {
			const schema = t.undefined
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, null).success).toBe(false)
		})
	})

	describe('Objects', () => {
		it('should validate type (object)', () => {
			const schema = t.type({
				name: t.string,
				age: t.number,
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate partial', () => {
			const schema = t.partial({
				name: t.string,
				age: t.number,
			})
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, {}).success).toBe(true)
		})

		it('should validate nested objects', () => {
			const schema = t.type({
				user: t.type({
					name: t.string,
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = t.array(t.string)
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})
	})

	describe('Union', () => {
		it('should validate union', () => {
			const schema = t.union([t.string, t.number])
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('Intersection', () => {
		it('should validate intersection', () => {
			const schema = t.intersection([t.type({ name: t.string }), t.type({ age: t.number })])
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})
	})

	describe('Literal', () => {
		it('should validate literal', () => {
			const schema = t.literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})
	})

	describe('Keyof (Enum)', () => {
		it('should validate keyof', () => {
			const schema = t.keyof({ red: null, green: null, blue: null })
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = t.string
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = t.string
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = t.string
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('io-ts JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = t.string
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = t.number
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = t.boolean
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert null', () => {
			const schema = t.null
			const json = toJsonSchema(schema)
			expect(json.type).toBe('null')
		})
	})

	describe('Objects', () => {
		it('should convert type (object)', () => {
			const schema = t.type({
				name: t.string,
				age: t.number,
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
			const schema = t.array(t.string)
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.items).toEqual({ type: 'string' })
		})
	})

	describe('Union', () => {
		it('should convert union to anyOf', () => {
			const schema = t.union([t.string, t.number])
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			expect(json.anyOf).toContainEqual({ type: 'string' })
			expect(json.anyOf).toContainEqual({ type: 'number' })
		})
	})

	describe('Intersection', () => {
		it('should convert intersection to allOf', () => {
			const schema = t.intersection([t.type({ name: t.string }), t.type({ age: t.number })])
			const json = toJsonSchema(schema)
			expect(json.allOf).toBeDefined()
		})
	})

	describe('Literal', () => {
		it('should convert literal to const', () => {
			const schema = t.literal('hello')
			const json = toJsonSchema(schema)
			expect(json.const).toBe('hello')
		})
	})

	describe('Keyof (Enum)', () => {
		it('should convert keyof to enum', () => {
			const schema = t.keyof({ red: null, green: null, blue: null })
			const json = toJsonSchema(schema)
			expect(json.enum).toBeDefined()
			expect(json.enum).toContain('red')
			expect(json.enum).toContain('green')
			expect(json.enum).toContain('blue')
		})
	})
})
