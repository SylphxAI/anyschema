/**
 * Runtypes Integration Tests
 *
 * Tests validation and JSON Schema transformation for Runtypes schemas.
 */

import { describe, expect, it } from 'bun:test'
import * as rt from 'runtypes'
import { createTransformer, createValidator, runtypesTransformer, runtypesValidator } from '../src/adapter/index.js'

// Create validator and transformer with Runtypes adapter
const { validate, is, parse } = createValidator({ adapters: [runtypesValidator] })
const { toJsonSchema } = createTransformer({ adapters: [runtypesTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('Runtypes Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = rt.String
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = rt.Number
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = rt.Boolean
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate null', () => {
			const schema = rt.Null
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})

		it('should validate undefined', () => {
			const schema = rt.Undefined
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, null).success).toBe(false)
		})
	})

	describe('Objects', () => {
		it('should validate object', () => {
			const schema = rt.Object({
				name: rt.String,
				age: rt.Number,
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate nested objects', () => {
			const schema = rt.Object({
				user: rt.Object({
					name: rt.String,
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})

		it('should validate partial', () => {
			const schema = rt.Object({
				name: rt.String.optional(),
				age: rt.Number.optional(),
			})
			expect(validate(schema, { name: 'John' }).success).toBe(true)
			expect(validate(schema, {}).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = rt.Array(rt.String)
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})
	})

	describe('Tuple', () => {
		it('should validate tuple', () => {
			const schema = rt.Tuple(rt.String, rt.Number)
			expect(validate(schema, ['hello', 42]).success).toBe(true)
			expect(validate(schema, [42, 'hello']).success).toBe(false)
		})
	})

	describe('Union', () => {
		it('should validate union', () => {
			const schema = rt.Union(rt.String, rt.Number)
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('Intersection', () => {
		it('should validate intersect', () => {
			const schema = rt.Intersect(rt.Object({ name: rt.String }), rt.Object({ age: rt.Number }))
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})
	})

	describe('Optional', () => {
		it('should validate optional in object', () => {
			// Runtypes optional is used within objects, not standalone
			const schema = rt.Object({ name: rt.String.optional() })
			expect(validate(schema, {}).success).toBe(true)
			expect(validate(schema, { name: 'hello' }).success).toBe(true)
		})
	})

	describe('Literal', () => {
		it('should validate literal', () => {
			const schema = rt.Literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = rt.String
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = rt.String
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = rt.String
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('Runtypes JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = rt.String
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = rt.Number
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = rt.Boolean
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert null', () => {
			const schema = rt.Null
			const json = toJsonSchema(schema)
			expect(json.type).toBe('null')
		})
	})

	describe('Objects', () => {
		it('should convert object', () => {
			const schema = rt.Object({
				name: rt.String,
				age: rt.Number,
			})
			const json = toJsonSchema(schema)
			expect(json.type).toBe('object')
			expect(json.properties).toBeDefined()
			expect(json.properties?.name?.type).toBe('string')
			expect(json.properties?.age?.type).toBe('number')
		})
	})

	describe('Arrays', () => {
		it('should convert array', () => {
			const schema = rt.Array(rt.String)
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.items).toEqual({ type: 'string' })
		})
	})

	describe('Tuple', () => {
		it('should convert tuple', () => {
			const schema = rt.Tuple(rt.String, rt.Number)
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.prefixItems).toBeDefined()
			expect(json.prefixItems?.[0]).toEqual({ type: 'string' })
			expect(json.prefixItems?.[1]).toEqual({ type: 'number' })
		})
	})

	describe('Union', () => {
		it('should convert union to anyOf', () => {
			const schema = rt.Union(rt.String, rt.Number)
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			expect(json.anyOf).toContainEqual({ type: 'string' })
			expect(json.anyOf).toContainEqual({ type: 'number' })
		})
	})

	describe('Intersection', () => {
		it('should convert intersect to allOf', () => {
			const schema = rt.Intersect(rt.Object({ name: rt.String }), rt.Object({ age: rt.Number }))
			const json = toJsonSchema(schema)
			expect(json.allOf).toBeDefined()
		})
	})

	describe('Literal', () => {
		it('should convert literal to const', () => {
			const schema = rt.Literal('hello')
			const json = toJsonSchema(schema)
			expect(json.const).toBe('hello')
		})
	})
})
