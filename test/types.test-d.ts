import { type } from 'arktype'
import * as v from 'valibot'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import {
	assert,
	createSchema,
	is,
	parse,
	parseAsync,
	toJsonSchema,
	toJsonSchemaSync,
	validate,
	validateAsync,
} from '../src/index.js'
import type {
	AnySchema,
	AnySchemaV1,
	InferInput,
	InferOutput,
	IsValidSchema,
	JSONSchema,
	StandardSchemaV1,
	ValidationResult,
} from '../src/types.js'

describe('InferOutput type', () => {
	it('should infer Zod output type', () => {
		const schema = z.object({ name: z.string(), age: z.number() })
		type Output = InferOutput<typeof schema>
		expectTypeOf<Output>().toEqualTypeOf<{ name: string; age: number }>()
	})

	it('should infer Valibot output type', () => {
		const schema = v.object({ name: v.string(), age: v.number() })
		type Output = InferOutput<typeof schema>
		expectTypeOf<Output>().toEqualTypeOf<{ name: string; age: number }>()
	})

	it('should infer ArkType output type', () => {
		const schema = type({ name: 'string', age: 'number' })
		type Output = InferOutput<typeof schema>
		expectTypeOf<Output>().toEqualTypeOf<{ name: string; age: number }>()
	})

	it('should return never for invalid schema', () => {
		type Output = InferOutput<{ foo: string }>
		expectTypeOf<Output>().toEqualTypeOf<never>()
	})

	it('should infer AnySchema Protocol output type', () => {
		const schema = createSchema<string>({
			vendor: 'test',
			validate: (d) =>
				typeof d === 'string' ? { success: true, data: d } : { success: false, issues: [{ message: '' }] },
		})
		type Output = InferOutput<typeof schema>
		expectTypeOf<Output>().toEqualTypeOf<string>()
	})
})

describe('InferInput type', () => {
	it('should infer Zod input type', () => {
		const schema = z.object({ name: z.string() })
		type Input = InferInput<typeof schema>
		expectTypeOf<Input>().toEqualTypeOf<{ name: string }>()
	})

	it('should infer Valibot input type', () => {
		const schema = v.object({ name: v.string() })
		type Input = InferInput<typeof schema>
		expectTypeOf<Input>().toEqualTypeOf<{ name: string }>()
	})

	it('should return never for invalid schema', () => {
		type Input = InferInput<{ foo: string }>
		expectTypeOf<Input>().toEqualTypeOf<never>()
	})
})

describe('IsValidSchema type', () => {
	it('should return true for valid schemas', () => {
		const zodSchema = z.string()
		type IsZodValid = IsValidSchema<typeof zodSchema>
		expectTypeOf<IsZodValid>().toEqualTypeOf<true>()

		const valibotSchema = v.string()
		type IsValibotValid = IsValidSchema<typeof valibotSchema>
		expectTypeOf<IsValibotValid>().toEqualTypeOf<true>()

		const arktypeSchema = type('string')
		type IsArkTypeValid = IsValidSchema<typeof arktypeSchema>
		expectTypeOf<IsArkTypeValid>().toEqualTypeOf<true>()
	})

	it('should return false for invalid schemas', () => {
		type IsInvalid = IsValidSchema<{ foo: string }>
		expectTypeOf<IsInvalid>().toEqualTypeOf<false>()
	})
})

describe('toJsonSchema types', () => {
	it('should return Promise<JSONSchema> for async version', () => {
		const schema = z.string()
		expectTypeOf(toJsonSchema(schema)).toEqualTypeOf<Promise<JSONSchema>>()
	})

	it('should return JSONSchema for sync version', () => {
		const schema = z.string()
		expectTypeOf(toJsonSchemaSync(schema)).toEqualTypeOf<JSONSchema>()
	})
})

describe('validate types', () => {
	it('should return ValidationResult with inferred type for Zod', () => {
		const schema = z.object({ name: z.string() })
		const result = validate(schema, {})
		expectTypeOf(result).toEqualTypeOf<ValidationResult<{ name: string }>>()
	})

	it('should return ValidationResult with inferred type for Valibot', () => {
		const schema = v.object({ name: v.string() })
		const result = validate(schema, {})
		expectTypeOf(result).toEqualTypeOf<ValidationResult<{ name: string }>>()
	})

	it('should return ValidationResult with inferred type for ArkType', () => {
		const schema = type({ name: 'string' })
		const result = validate(schema, {})
		expectTypeOf(result).toEqualTypeOf<ValidationResult<{ name: string }>>()
	})
})

describe('validateAsync types', () => {
	it('should return Promise<ValidationResult> for Zod', () => {
		const schema = z.string()
		const result = validateAsync(schema, '')
		expectTypeOf(result).toEqualTypeOf<Promise<ValidationResult<string>>>()
	})

	it('should return Promise<ValidationResult> for Valibot', () => {
		const schema = v.string()
		const result = validateAsync(schema, '')
		expectTypeOf(result).toEqualTypeOf<Promise<ValidationResult<string>>>()
	})

	it('should return Promise<ValidationResult> for ArkType', () => {
		const schema = type('string')
		const result = validateAsync(schema, '')
		expectTypeOf(result).toEqualTypeOf<Promise<ValidationResult<string>>>()
	})
})

describe('is() type guard', () => {
	it('should narrow type for Zod', () => {
		const schema = z.object({ name: z.string() })
		const data: unknown = { name: 'test' }

		if (is(schema, data)) {
			expectTypeOf(data).toEqualTypeOf<{ name: string }>()
		}
	})

	it('should narrow type for Valibot', () => {
		const schema = v.object({ name: v.string() })
		const data: unknown = { name: 'test' }

		if (is(schema, data)) {
			expectTypeOf(data).toEqualTypeOf<{ name: string }>()
		}
	})

	it('should narrow type for ArkType', () => {
		const schema = type({ name: 'string' })
		const data: unknown = { name: 'test' }

		if (is(schema, data)) {
			expectTypeOf(data).toEqualTypeOf<{ name: string }>()
		}
	})
})

describe('parse() types', () => {
	it('should return inferred type for Zod', () => {
		const schema = z.object({ name: z.string() })
		const result = parse(schema, { name: 'test' })
		expectTypeOf(result).toEqualTypeOf<{ name: string }>()
	})

	it('should return inferred type for Valibot', () => {
		const schema = v.object({ name: v.string() })
		const result = parse(schema, { name: 'test' })
		expectTypeOf(result).toEqualTypeOf<{ name: string }>()
	})

	it('should return inferred type for ArkType', () => {
		const schema = type({ name: 'string' })
		const result = parse(schema, { name: 'test' })
		expectTypeOf(result).toEqualTypeOf<{ name: string }>()
	})
})

describe('parseAsync() types', () => {
	it('should return Promise with inferred type', () => {
		const schema = z.string()
		const result = parseAsync(schema, 'test')
		expectTypeOf(result).toEqualTypeOf<Promise<string>>()
	})
})

describe('assert() types', () => {
	it('should narrow type after assertion for Zod', () => {
		const schema = z.object({ name: z.string() })
		const data: unknown = { name: 'test' }

		assert(schema, data)
		expectTypeOf(data).toEqualTypeOf<{ name: string }>()
	})

	it('should narrow type after assertion for Valibot', () => {
		const schema = v.object({ name: v.string() })
		const data: unknown = { name: 'test' }

		assert(schema, data)
		expectTypeOf(data).toEqualTypeOf<{ name: string }>()
	})
})

describe('createSchema() types', () => {
	it('should create typed AnySchemaV1', () => {
		const schema = createSchema<string>({
			vendor: 'test',
			validate: (d) =>
				typeof d === 'string' ? { success: true, data: d } : { success: false, issues: [{ message: '' }] },
		})

		expectTypeOf(schema).toMatchTypeOf<AnySchemaV1<string, string>>()
	})

	it('should support different input/output types', () => {
		const schema = createSchema<number, string>({
			vendor: 'test',
			validate: (d) => {
				const num = Number(d)
				if (!Number.isNaN(num)) {
					return { success: true, data: num }
				}
				return { success: false, issues: [{ message: '' }] }
			},
		})

		type Input = InferInput<typeof schema>
		type Output = InferOutput<typeof schema>

		expectTypeOf<Input>().toEqualTypeOf<string>()
		expectTypeOf<Output>().toEqualTypeOf<number>()
	})
})

describe('AnySchema type', () => {
	it('should accept Zod schemas structurally', () => {
		const schema = z.string()
		// Zod schemas match ZodLike structure
		expectTypeOf(schema).toMatchTypeOf<AnySchema>()
	})

	it('should accept Valibot schemas structurally', () => {
		const schema = v.string()
		// Valibot schemas match ValibotLike structure
		expectTypeOf(schema).toMatchTypeOf<AnySchema>()
	})

	it('should accept ArkType schemas structurally', () => {
		const schema = type('string')
		// ArkType schemas match ArkTypeLike structure
		expectTypeOf(schema).toMatchTypeOf<AnySchema>()
	})

	it('should accept AnySchema Protocol', () => {
		const schema = createSchema<string>({
			vendor: 'test',
			validate: (d) =>
				typeof d === 'string' ? { success: true, data: d } : { success: false, issues: [{ message: '' }] },
		})
		expectTypeOf(schema).toMatchTypeOf<AnySchema>()
	})
})

describe('Protocol types', () => {
	it('AnySchemaV1 should have correct structure', () => {
		type Schema = AnySchemaV1<string>

		expectTypeOf<Schema['~anyschema']>().toMatchTypeOf<{
			version: 1
			vendor: string
		}>()

		expectTypeOf<Schema['~types']>().toMatchTypeOf<{
			input: string
			output: string
		}>()

		expectTypeOf<Schema['~validate']>().toMatchTypeOf<
			(data: unknown) => { success: true; data: string } | { success: false; issues: readonly { message: string }[] }
		>()
	})

	it('StandardSchemaV1 should have correct structure', () => {
		type Schema = StandardSchemaV1<string>

		expectTypeOf<Schema['~standard']>().toMatchTypeOf<{
			version: 1
			vendor: string
			validate: (data: unknown) => unknown
		}>()
	})
})
