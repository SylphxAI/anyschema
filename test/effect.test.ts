/**
 * Effect Schema Integration Tests
 *
 * Tests validation and JSON Schema transformation for Effect Schema.
 */

import { describe, expect, it } from 'bun:test'
import * as S from '@effect/schema/Schema'
import { createTransformer, createValidator, effectTransformer, effectValidator } from '../src/adapter/index.js'

// Create validator and transformer with Effect adapter
const { validate, is, parse } = createValidator({ adapters: [effectValidator] })
const { toJsonSchema } = createTransformer({ adapters: [effectTransformer] })

// ============================================================================
// Validation Tests
// ============================================================================

describe('Effect Schema Validation', () => {
	describe('Primitives', () => {
		it('should validate string', () => {
			const schema = S.String
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 123).success).toBe(false)
		})

		it('should validate number', () => {
			const schema = S.Number
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(false)
		})

		it('should validate boolean', () => {
			const schema = S.Boolean
			expect(validate(schema, true).success).toBe(true)
			expect(validate(schema, 'true').success).toBe(false)
		})

		it('should validate null', () => {
			const schema = S.Null
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, undefined).success).toBe(false)
		})

		it('should validate undefined', () => {
			const schema = S.Undefined
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, null).success).toBe(false)
		})
	})

	describe('Objects', () => {
		it('should validate struct', () => {
			const schema = S.Struct({
				name: S.String,
				age: S.Number,
			})
			expect(validate(schema, { name: 'John', age: 30 }).success).toBe(true)
			expect(validate(schema, { name: 'John' }).success).toBe(false)
		})

		it('should validate nested objects', () => {
			const schema = S.Struct({
				user: S.Struct({
					name: S.String,
				}),
			})
			expect(validate(schema, { user: { name: 'John' } }).success).toBe(true)
		})
	})

	describe('Arrays', () => {
		it('should validate array', () => {
			const schema = S.Array(S.String)
			expect(validate(schema, ['a', 'b', 'c']).success).toBe(true)
			expect(validate(schema, [1, 2, 3]).success).toBe(false)
		})
	})

	describe('Tuple', () => {
		it('should validate tuple', () => {
			const schema = S.Tuple(S.String, S.Number)
			expect(validate(schema, ['hello', 42]).success).toBe(true)
			expect(validate(schema, [42, 'hello']).success).toBe(false)
		})
	})

	describe('Union', () => {
		it('should validate union', () => {
			const schema = S.Union(S.String, S.Number)
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 42).success).toBe(true)
			expect(validate(schema, true).success).toBe(false)
		})
	})

	describe('Optional and Nullable', () => {
		it('should validate optional (Union with Undefined)', () => {
			// S.optional is for property signatures in Struct, not standalone
			const schema = S.Union(S.String, S.Undefined)
			expect(validate(schema, undefined).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})

		it('should validate nullable (NullOr)', () => {
			const schema = S.NullOr(S.String)
			expect(validate(schema, null).success).toBe(true)
			expect(validate(schema, 'hello').success).toBe(true)
		})
	})

	describe('Literal', () => {
		it('should validate literal', () => {
			const schema = S.Literal('hello')
			expect(validate(schema, 'hello').success).toBe(true)
			expect(validate(schema, 'world').success).toBe(false)
		})
	})

	describe('Enums', () => {
		it('should validate enums', () => {
			const schema = S.Literal('red', 'green', 'blue')
			expect(validate(schema, 'red').success).toBe(true)
			expect(validate(schema, 'yellow').success).toBe(false)
		})
	})

	describe('Type Guards', () => {
		it('is() should work as type guard', () => {
			const schema = S.String
			const data: unknown = 'hello'
			expect(is(schema, data)).toBe(true)
			if (is(schema, data)) {
				expect(data.toUpperCase()).toBe('HELLO')
			}
		})
	})

	describe('Parse', () => {
		it('parse() should return data on success', () => {
			const schema = S.String
			expect(parse(schema, 'hello')).toBe('hello')
		})

		it('parse() should throw on failure', () => {
			const schema = S.String
			expect(() => parse(schema, 123)).toThrow()
		})
	})
})

// ============================================================================
// JSON Schema Tests
// ============================================================================

describe('Effect Schema JSON Schema', () => {
	describe('Primitives', () => {
		it('should convert string', () => {
			const schema = S.String
			const json = toJsonSchema(schema)
			expect(json.type).toBe('string')
		})

		it('should convert number', () => {
			const schema = S.Number
			const json = toJsonSchema(schema)
			expect(json.type).toBe('number')
		})

		it('should convert boolean', () => {
			const schema = S.Boolean
			const json = toJsonSchema(schema)
			expect(json.type).toBe('boolean')
		})

		it('should convert null', () => {
			const schema = S.Null
			const json = toJsonSchema(schema)
			expect(json.type).toBe('null')
		})
	})

	describe('Objects', () => {
		it('should convert struct', () => {
			const schema = S.Struct({
				name: S.String,
				age: S.Number,
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
			const schema = S.Array(S.String)
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.items?.type).toBe('string')
		})
	})

	describe('Tuple', () => {
		it('should convert tuple', () => {
			const schema = S.Tuple(S.String, S.Number)
			const json = toJsonSchema(schema)
			expect(json.type).toBe('array')
			expect(json.prefixItems).toBeDefined()
		})
	})

	describe('Union', () => {
		it('should convert union to anyOf', () => {
			const schema = S.Union(S.String, S.Number)
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			expect(json.anyOf?.some((item: { type?: string }) => item.type === 'string')).toBe(true)
			expect(json.anyOf?.some((item: { type?: string }) => item.type === 'number')).toBe(true)
		})
	})

	describe('Literal', () => {
		it('should convert literal to const', () => {
			const schema = S.Literal('hello')
			const json = toJsonSchema(schema)
			expect(json.const).toBe('hello')
		})
	})

	describe('Nullable', () => {
		it('should convert nullable to anyOf with null', () => {
			const schema = S.NullOr(S.String)
			const json = toJsonSchema(schema)
			expect(json.anyOf).toBeDefined()
			expect(json.anyOf?.some((item: { type?: string }) => item.type === 'null')).toBe(true)
		})
	})
})
