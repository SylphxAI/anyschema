import { type } from 'arktype'
import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
	assert,
	createSchema,
	detect,
	detectVendor,
	getMetadata,
	is,
	isAnySchemaProtocol,
	isArkTypeSchema,
	isStandardSchema,
	isValibotSchema,
	isZodSchema,
	parse,
	parseAsync,
	toJsonSchema,
	toJsonSchemaSync,
	ValidationError,
	validate,
	validateAny,
	validateAsync,
} from '../src/index.js'

describe('toJsonSchema (async)', () => {
	it('should convert Zod schema', async () => {
		const schema = z.object({ name: z.string(), age: z.number() })
		const result = await toJsonSchema(schema)

		expect(result).toBeDefined()
		expect(result.type).toBe('object')
		expect(result.properties).toHaveProperty('name')
		expect(result.properties).toHaveProperty('age')
	})

	it('should convert Valibot schema', async () => {
		const schema = v.object({ name: v.string(), age: v.number() })
		const result = await toJsonSchema(schema)

		expect(result).toBeDefined()
		expect(result.type).toBe('object')
		expect(result.properties).toHaveProperty('name')
		expect(result.properties).toHaveProperty('age')
	})

	it('should convert ArkType schema', async () => {
		const schema = type({ name: 'string', age: 'number' })
		const result = await toJsonSchema(schema)

		expect(result).toBeDefined()
		expect(result.type).toBe('object')
		expect(result.properties).toHaveProperty('name')
		expect(result.properties).toHaveProperty('age')
	})

	it('should throw for unsupported schema', async () => {
		await expect(toJsonSchema({} as any)).rejects.toThrow('Unsupported schema type')
	})
})

describe('toJsonSchemaSync', () => {
	it('should convert Zod schema', () => {
		const schema = z.string()
		const result = toJsonSchemaSync(schema)

		expect(result).toBeDefined()
		expect(result.type).toBe('string')
	})

	it('should convert Valibot schema', () => {
		const schema = v.string()
		const result = toJsonSchemaSync(schema)

		expect(result).toBeDefined()
		expect(result.type).toBe('string')
	})

	it('should convert ArkType schema', () => {
		const schema = type('string')
		const result = toJsonSchemaSync(schema)

		expect(result).toBeDefined()
		expect(result.type).toBe('string')
	})
})

describe('validate', () => {
	describe('Zod', () => {
		it('should validate valid data', () => {
			const schema = z.object({ name: z.string() })
			const result = validate(schema, { name: 'John' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual({ name: 'John' })
			}
		})

		it('should return issues for invalid data', () => {
			const schema = z.object({ name: z.string() })
			const result = validate(schema, { name: 123 })

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.issues.length).toBeGreaterThan(0)
			}
		})
	})

	describe('Valibot', () => {
		it('should validate valid data', () => {
			const schema = v.object({ name: v.string() })
			const result = validate(schema, { name: 'John' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual({ name: 'John' })
			}
		})

		it('should return issues for invalid data', () => {
			const schema = v.object({ name: v.string() })
			const result = validate(schema, { name: 123 })

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.issues.length).toBeGreaterThan(0)
			}
		})
	})

	describe('ArkType', () => {
		it('should validate valid data', () => {
			const schema = type({ name: 'string' })
			const result = validate(schema, { name: 'John' })

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual({ name: 'John' })
			}
		})

		it('should return issues for invalid data', () => {
			const schema = type({ name: 'string' })
			const result = validate(schema, { name: 123 })

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.issues.length).toBeGreaterThan(0)
			}
		})
	})
})

describe('validateAny', () => {
	it('should validate without type inference', () => {
		const schema = z.string()
		const result = validateAny(schema, 'hello')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('hello')
		}
	})
})

describe('validateAsync', () => {
	it('should validate Zod schema', async () => {
		const schema = z.string()
		const result = await validateAsync(schema, 'hello')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('hello')
		}
	})

	it('should validate Valibot schema', async () => {
		const schema = v.string()
		const result = await validateAsync(schema, 'hello')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('hello')
		}
	})

	it('should validate ArkType schema', async () => {
		const schema = type('string')
		const result = await validateAsync(schema, 'hello')

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data).toBe('hello')
		}
	})
})

describe('is() type guard', () => {
	it('should return true for valid data', () => {
		const schema = z.object({ name: z.string() })
		const data: unknown = { name: 'John' }

		if (is(schema, data)) {
			// TypeScript should know data is { name: string }
			expect(data.name).toBe('John')
		} else {
			throw new Error('Expected is() to return true')
		}
	})

	it('should return false for invalid data', () => {
		const schema = z.string()
		expect(is(schema, 123)).toBe(false)
	})

	it('should work with Valibot', () => {
		const schema = v.string()
		expect(is(schema, 'hello')).toBe(true)
		expect(is(schema, 123)).toBe(false)
	})

	it('should work with ArkType', () => {
		const schema = type('string')
		expect(is(schema, 'hello')).toBe(true)
		expect(is(schema, 123)).toBe(false)
	})
})

describe('parse()', () => {
	it('should return data for valid input', () => {
		const schema = z.object({ name: z.string() })
		const result = parse(schema, { name: 'John' })

		expect(result).toEqual({ name: 'John' })
	})

	it('should throw ValidationError for invalid input', () => {
		const schema = z.string()

		expect(() => parse(schema, 123)).toThrow(ValidationError)
		try {
			parse(schema, 123)
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError)
			expect((error as ValidationError).issues.length).toBeGreaterThan(0)
		}
	})

	it('should work with Valibot', () => {
		const schema = v.string()
		expect(parse(schema, 'hello')).toBe('hello')
		expect(() => parse(schema, 123)).toThrow(ValidationError)
	})

	it('should work with ArkType', () => {
		const schema = type('string')
		expect(parse(schema, 'hello')).toBe('hello')
		expect(() => parse(schema, 123)).toThrow(ValidationError)
	})
})

describe('parseAsync()', () => {
	it('should return data for valid input', async () => {
		const schema = z.string()
		const result = await parseAsync(schema, 'hello')
		expect(result).toBe('hello')
	})

	it('should throw ValidationError for invalid input', async () => {
		const schema = z.string()
		await expect(parseAsync(schema, 123)).rejects.toThrow(ValidationError)
	})
})

describe('assert()', () => {
	it('should not throw for valid input', () => {
		const schema = z.object({ name: z.string() })
		const data: unknown = { name: 'John' }

		expect(() => assert(schema, data)).not.toThrow()

		// After assert, TypeScript should know data is { name: string }
		assert(schema, data)
		expect(data.name).toBe('John')
	})

	it('should throw ValidationError for invalid input', () => {
		const schema = z.string()
		expect(() => assert(schema, 123)).toThrow(ValidationError)
	})
})

describe('createSchema()', () => {
	it('should create a valid AnySchema Protocol schema', () => {
		const myStringSchema = createSchema<string>({
			vendor: 'test-lib',
			validate: (data) => {
				if (typeof data === 'string') {
					return { success: true, data }
				}
				return { success: false, issues: [{ message: 'Expected string' }] }
			},
		})

		// Should be detected as AnySchema Protocol
		expect(isAnySchemaProtocol(myStringSchema)).toBe(true)
		expect(detectVendor(myStringSchema)).toBe('test-lib')

		// Should validate correctly
		const validResult = validate(myStringSchema, 'hello')
		expect(validResult.success).toBe(true)
		if (validResult.success) {
			expect(validResult.data).toBe('hello')
		}

		const invalidResult = validate(myStringSchema, 123)
		expect(invalidResult.success).toBe(false)
	})

	it('should support toJsonSchema', async () => {
		const myNumberSchema = createSchema<number>({
			vendor: 'test-lib',
			validate: (data) => {
				if (typeof data === 'number') {
					return { success: true, data }
				}
				return { success: false, issues: [{ message: 'Expected number' }] }
			},
			toJsonSchema: () => ({ type: 'number' }),
		})

		const jsonSchema = await toJsonSchema(myNumberSchema)
		expect(jsonSchema.type).toBe('number')
	})

	it('should support metadata', () => {
		const mySchema = createSchema<string>({
			vendor: 'test-lib',
			validate: (data) =>
				typeof data === 'string'
					? { success: true, data }
					: { success: false, issues: [{ message: 'Expected string' }] },
			meta: {
				title: 'My String',
				description: 'A custom string schema',
			},
		})

		const meta = getMetadata(mySchema)
		expect(meta.title).toBe('My String')
		expect(meta.description).toBe('A custom string schema')
	})
})

describe('Detection utilities', () => {
	describe('detectVendor', () => {
		it('should detect Zod schema', () => {
			expect(detectVendor(z.string())).toBe('zod')
			expect(detectVendor(z.object({ a: z.number() }))).toBe('zod')
		})

		it('should detect Valibot schema', () => {
			expect(detectVendor(v.string())).toBe('valibot')
			expect(detectVendor(v.object({ a: v.number() }))).toBe('valibot')
		})

		it('should detect ArkType schema', () => {
			expect(detectVendor(type('string'))).toBe('arktype')
			expect(detectVendor(type({ a: 'number' }))).toBe('arktype')
		})

		it('should return null for unsupported types', () => {
			expect(detectVendor(null)).toBeNull()
			expect(detectVendor(undefined)).toBeNull()
			expect(detectVendor({})).toBeNull()
			expect(detectVendor('string')).toBeNull()
			expect(detectVendor(123)).toBeNull()
		})
	})

	describe('detect()', () => {
		it('should return detailed detection result for Zod', () => {
			const result = detect(z.string())
			// Zod v3.24+ implements Standard Schema, so it's detected as standard-schema
			expect(result).toEqual({ type: 'standard-schema', vendor: 'zod' })
		})

		it('should return detailed detection result for Valibot', () => {
			const result = detect(v.string())
			// Valibot v1+ implements Standard Schema, so it's detected as standard-schema
			expect(result).toEqual({ type: 'standard-schema', vendor: 'valibot' })
		})

		it('should return detailed detection result for ArkType', () => {
			const result = detect(type('string'))
			// ArkType uses duck typing (does not implement Standard Schema marker)
			expect(result).toEqual({ type: 'duck', vendor: 'arktype' })
		})

		it('should return anyschema type for protocol schemas', () => {
			const mySchema = createSchema<string>({
				vendor: 'my-lib',
				validate: (d) =>
					typeof d === 'string'
						? { success: true, data: d }
						: { success: false, issues: [{ message: 'Expected string' }] },
			})

			const result = detect(mySchema)
			expect(result).toEqual({ type: 'anyschema', vendor: 'my-lib' })
		})
	})

	describe('type guards', () => {
		it('isZodSchema', () => {
			expect(isZodSchema(z.string())).toBe(true)
			expect(isZodSchema(v.string())).toBe(false)
			expect(isZodSchema(type('string'))).toBe(false)
		})

		it('isValibotSchema', () => {
			expect(isValibotSchema(v.string())).toBe(true)
			expect(isValibotSchema(z.string())).toBe(false)
			expect(isValibotSchema(type('string'))).toBe(false)
		})

		it('isArkTypeSchema', () => {
			expect(isArkTypeSchema(type('string'))).toBe(true)
			expect(isArkTypeSchema(z.string())).toBe(false)
			expect(isArkTypeSchema(v.string())).toBe(false)
		})

		it('isAnySchemaProtocol', () => {
			const mySchema = createSchema<string>({
				vendor: 'test',
				validate: (d) =>
					typeof d === 'string' ? { success: true, data: d } : { success: false, issues: [{ message: '' }] },
			})

			expect(isAnySchemaProtocol(mySchema)).toBe(true)
			expect(isAnySchemaProtocol(z.string())).toBe(false)
			expect(isAnySchemaProtocol(v.string())).toBe(false)
		})

		it('isStandardSchema', () => {
			// Create a Standard Schema compliant object
			const standardSchema = {
				'~standard': {
					version: 1,
					vendor: 'test',
					validate: (data: unknown) => ({ value: data }),
				},
			}

			expect(isStandardSchema(standardSchema)).toBe(true)
			// Zod v3.24+ implements Standard Schema
			expect(isStandardSchema(z.string())).toBe(true)
			// Valibot v1+ implements Standard Schema
			expect(isStandardSchema(v.string())).toBe(true)
			// Plain objects don't implement Standard Schema
			expect(isStandardSchema({})).toBe(false)
		})
	})
})

describe('Standard Schema compatibility', () => {
	it('should validate Standard Schema compliant objects', () => {
		const standardSchema = {
			'~standard': {
				version: 1,
				vendor: 'test',
				validate: (data: unknown) => {
					if (typeof data === 'string') {
						return { value: data }
					}
					return { issues: [{ message: 'Expected string' }] }
				},
			},
		}

		const validResult = validate(standardSchema as any, 'hello')
		expect(validResult.success).toBe(true)
		if (validResult.success) {
			expect(validResult.data).toBe('hello')
		}

		const invalidResult = validate(standardSchema as any, 123)
		expect(invalidResult.success).toBe(false)
	})
})

describe('getMetadata', () => {
	it('should extract metadata from Zod schema', () => {
		const schema = z.string().describe('A string value')
		const meta = getMetadata(schema)
		expect(meta.description).toBe('A string value')
	})

	it('should return empty object for schemas without metadata', () => {
		const schema = z.string()
		const meta = getMetadata(schema)
		expect(meta).toEqual({})
	})
})

describe('Invalid schema rejection', () => {
	it('should return failure for plain object', () => {
		const result = validate({} as any, 'data')
		expect(result.success).toBe(false)
	})

	it('should return failure for null', () => {
		const result = validate(null as any, 'data')
		expect(result.success).toBe(false)
	})
})

describe('ValidationError', () => {
	it('should have issues property', () => {
		const error = new ValidationError([{ message: 'Test error' }])
		expect(error.issues).toEqual([{ message: 'Test error' }])
		expect(error.message).toBe('Test error')
		expect(error.name).toBe('ValidationError')
	})

	it('should combine multiple issue messages', () => {
		const error = new ValidationError([{ message: 'Error 1' }, { message: 'Error 2' }])
		expect(error.message).toBe('Error 1; Error 2')
	})
})
