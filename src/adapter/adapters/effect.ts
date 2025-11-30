/**
 * Effect Schema Adapter
 *
 * Duck-typed adapter for Effect Schema.
 * Detects via `Type` + `Encoded` + `ast` properties.
 * Effect implements Standard Schema, so validation should go through ~standard.
 */

import { defineAdapter, type SchemaConstraints } from '../types.js'

const isEffect = (s: unknown): boolean => {
	if (!s || typeof s !== 'object') return false
	return 'Type' in s && 'Encoded' in s && 'ast' in s
}

const getAst = (s: unknown): unknown => {
	if (!isEffect(s)) return null
	return (s as { ast?: unknown }).ast
}

const getAstType = (s: unknown): string | null => {
	const ast = getAst(s)
	if (!ast || typeof ast !== 'object') return null
	return (ast as { _tag?: string })._tag ?? null
}

export const effectAdapter = defineAdapter({
	vendor: 'effect',

	match: isEffect,

	// ============ Type Detection ============
	// Effect uses AST nodes with _tag property
	isString: (s) => {
		const astType = getAstType(s)
		return (
			astType === 'StringKeyword' ||
			(astType === 'Refinement' &&
				getAstType({ ast: (getAst(s) as { from?: unknown })?.from }) === 'StringKeyword')
		)
	},
	isNumber: (s) => {
		const astType = getAstType(s)
		return (
			astType === 'NumberKeyword' ||
			(astType === 'Refinement' &&
				getAstType({ ast: (getAst(s) as { from?: unknown })?.from }) === 'NumberKeyword')
		)
	},
	isBoolean: (s) => getAstType(s) === 'BooleanKeyword',
	isNull: (s) => {
		const ast = getAst(s)
		return (
			(ast as { _tag?: string; literal?: unknown })?._tag === 'Literal' &&
			(ast as { literal?: unknown })?.literal === null
		)
	},
	isUndefined: (s) => getAstType(s) === 'UndefinedKeyword',
	isVoid: (s) => getAstType(s) === 'VoidKeyword',
	isAny: (s) => getAstType(s) === 'AnyKeyword',
	isUnknown: (s) => getAstType(s) === 'UnknownKeyword',
	isNever: (s) => getAstType(s) === 'NeverKeyword',
	isObject: (s) => getAstType(s) === 'TypeLiteral',
	isArray: (s) =>
		getAstType(s) === 'TupleType' && (getAst(s) as { rest?: unknown[] })?.rest?.length === 1,
	isUnion: (s) => getAstType(s) === 'Union',
	isLiteral: (s) => getAstType(s) === 'Literal',
	isEnum: (s) => getAstType(s) === 'Enums',
	isOptional: (s) => {
		const ast = getAst(s)
		return (ast as { isOptional?: boolean })?.isOptional === true
	},
	isNullable: () => false, // Effect uses union with null
	isTuple: (s) => {
		const astType = getAstType(s)
		if (astType !== 'TupleType') return false
		const rest = (getAst(s) as { rest?: unknown[] })?.rest
		return !rest || rest.length === 0
	},
	isRecord: (s) => {
		const astType = getAstType(s)
		if (astType !== 'TypeLiteral') return false
		const indexSignatures = (getAst(s) as { indexSignatures?: unknown[] })?.indexSignatures
		return Array.isArray(indexSignatures) && indexSignatures.length > 0
	},
	isMap: () => false,
	isSet: () => false,
	isIntersection: () => false, // Effect flattens intersections
	isLazy: (s) => getAstType(s) === 'Suspend',
	isTransform: (s) => getAstType(s) === 'Transformation',
	isRefine: (s) => getAstType(s) === 'Refinement',
	isDefault: (s) => {
		const ast = getAst(s)
		return (
			(ast as { _tag?: string })._tag === 'Transformation' &&
			(ast as { transformation?: { _tag?: string } })?.transformation?._tag === 'DefaultDeclaration'
		)
	},
	isCatch: () => false,
	isBranded: (s) => {
		const annotations = (getAst(s) as { annotations?: Record<symbol, unknown> })?.annotations
		if (!annotations) return false
		// Check for brand annotation
		const brandSymbol = Symbol.for('@effect/schema/annotation/Brand')
		return brandSymbol in annotations
	},
	isDate: (s) => {
		const annotations = (getAst(s) as { annotations?: Record<symbol, unknown> })?.annotations
		if (!annotations) return false
		const idSymbol = Symbol.for('@effect/schema/annotation/Identifier')
		return annotations[idSymbol] === 'Date' || annotations[idSymbol] === 'DateFromSelf'
	},
	isBigInt: (s) => getAstType(s) === 'BigIntKeyword',
	isSymbol: (s) => getAstType(s) === 'SymbolKeyword',
	isFunction: () => false,
	isPromise: () => false,
	isInstanceOf: (s) => getAstType(s) === 'Declaration',

	// ============ Unwrap ============
	unwrap: (s) => {
		const ast = getAst(s)
		const astType = getAstType(s)

		// Refinement has from
		if (astType === 'Refinement') {
			const from = (ast as { from?: unknown })?.from
			if (from) return { Type: null, Encoded: null, ast: from }
		}

		// Transformation has from
		if (astType === 'Transformation') {
			const from = (ast as { from?: unknown })?.from
			if (from) return { Type: null, Encoded: null, ast: from }
		}

		// Suspend has f (lazy getter)
		if (astType === 'Suspend') {
			const f = (ast as { f?: () => unknown })?.f
			if (typeof f === 'function') {
				return { Type: null, Encoded: null, ast: f() }
			}
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getAstType(s) !== 'TypeLiteral') return []
		const ast = getAst(s) as { propertySignatures?: Array<{ name: string; type: unknown }> }
		const props = ast?.propertySignatures ?? []
		return props.map((p) => [String(p.name), { Type: null, Encoded: null, ast: p.type }])
	},

	getArrayElement: (s) => {
		if (getAstType(s) !== 'TupleType') return null
		const rest = (getAst(s) as { rest?: Array<{ type?: unknown }> })?.rest
		if (rest && rest.length === 1 && rest[0]?.type) {
			return { Type: null, Encoded: null, ast: rest[0].type }
		}
		return null
	},

	getUnionOptions: (s) => {
		if (getAstType(s) !== 'Union') return []
		const types = (getAst(s) as { types?: unknown[] })?.types ?? []
		return types.map((t) => ({ Type: null, Encoded: null, ast: t }))
	},

	getLiteralValue: (s) => {
		if (getAstType(s) !== 'Literal') return undefined
		return (getAst(s) as { literal?: unknown })?.literal
	},

	getEnumValues: (s) => {
		if (getAstType(s) !== 'Enums') return []
		const enums = (getAst(s) as { enums?: Array<[string, unknown]> })?.enums ?? []
		return enums.map((e) => e[1])
	},

	getTupleItems: (s) => {
		if (getAstType(s) !== 'TupleType') return []
		const elements = (getAst(s) as { elements?: Array<{ type?: unknown }> })?.elements ?? []
		return elements.map((e) => ({ Type: null, Encoded: null, ast: e.type }))
	},

	getRecordKeyType: () => null, // Complex in Effect

	getRecordValueType: (s) => {
		if (getAstType(s) !== 'TypeLiteral') return null
		const indexSignatures = (getAst(s) as { indexSignatures?: Array<{ type?: unknown }> })
			?.indexSignatures
		if (indexSignatures && indexSignatures.length > 0 && indexSignatures[0]?.type) {
			return { Type: null, Encoded: null, ast: indexSignatures[0].type }
		}
		return null
	},

	getMapKeyType: () => null,
	getMapValueType: () => null,
	getSetElement: () => null,
	getIntersectionSchemas: () => [],
	getPromiseInner: () => null,
	getInstanceOfClass: () => null,

	// ============ Constraints ============
	getConstraints: (s) => {
		// Effect stores constraints in annotations or refinement predicates
		// Complex to extract, would need to walk the AST
		const ast = getAst(s)
		const annotations = (ast as { annotations?: Record<symbol, unknown> })?.annotations
		if (!annotations) return null

		const result: SchemaConstraints = {}
		const jsonSchemaSymbol = Symbol.for('@effect/schema/annotation/JSONSchema')

		const jsonSchema = annotations[jsonSchemaSymbol] as
			| {
					minLength?: number
					maxLength?: number
					pattern?: string
					format?: string
					minimum?: number
					maximum?: number
			  }
			| undefined
		if (jsonSchema) {
			if (jsonSchema.minLength !== undefined) result.minLength = jsonSchema.minLength
			if (jsonSchema.maxLength !== undefined) result.maxLength = jsonSchema.maxLength
			if (jsonSchema.pattern !== undefined) result.pattern = jsonSchema.pattern
			if (jsonSchema.format !== undefined) result.format = jsonSchema.format
			if (jsonSchema.minimum !== undefined) result.min = jsonSchema.minimum
			if (jsonSchema.maximum !== undefined) result.max = jsonSchema.maximum
		}

		return Object.keys(result).length > 0 ? result : null
	},

	// ============ Metadata ============
	getDescription: (s) => {
		const annotations = (getAst(s) as { annotations?: Record<symbol, unknown> })?.annotations
		if (!annotations) return undefined
		const descSymbol = Symbol.for('@effect/schema/annotation/Description')
		return annotations[descSymbol] as string | undefined
	},

	getTitle: (s) => {
		const annotations = (getAst(s) as { annotations?: Record<symbol, unknown> })?.annotations
		if (!annotations) return undefined
		const titleSymbol = Symbol.for('@effect/schema/annotation/Title')
		return annotations[titleSymbol] as string | undefined
	},

	getDefault: () => undefined, // Complex in Effect

	getExamples: (s) => {
		const annotations = (getAst(s) as { annotations?: Record<symbol, unknown> })?.annotations
		if (!annotations) return undefined
		const examplesSymbol = Symbol.for('@effect/schema/annotation/Examples')
		const examples = annotations[examplesSymbol]
		return Array.isArray(examples) ? examples : undefined
	},

	isDeprecated: () => false,

	// ============ Validation ============
	// Effect implements Standard Schema, should use ~standard.validate
	validate: (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'Effect Schema should be validated via Standard Schema protocol (~standard.validate).',
			},
		],
	}),

	validateAsync: async (_s, _data) => ({
		success: false,
		issues: [
			{
				message:
					'Effect Schema should be validated via Standard Schema protocol (~standard.validate).',
			},
		],
	}),
})
