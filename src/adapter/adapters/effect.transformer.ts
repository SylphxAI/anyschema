/**
 * Effect Schema Transformer Adapter
 *
 * Full introspection for JSON Schema conversion.
 * Use this when you need to convert schemas to JSON Schema.
 */

import { defineTransformerAdapter, type SchemaConstraints } from '../types.js'

// ============================================================================
// Schema Type
// ============================================================================

/** Effect schema shape for type inference */
export interface EffectSchema {
	Type: unknown
	Encoded: unknown
	ast: EffectAst
}

interface EffectAst {
	_tag?: string
	from?: EffectAst
	types?: EffectAst[]
	literal?: unknown
	enums?: Array<[string, unknown]>
	elements?: Array<{ type?: EffectAst }>
	rest?: Array<{ type?: EffectAst }>
	propertySignatures?: Array<{ name: string | symbol; type: EffectAst; isOptional?: boolean }>
	indexSignatures?: Array<{ type?: EffectAst }>
	transformation?: { _tag?: string }
	f?: () => EffectAst
	annotations?: Record<symbol, unknown>
}

// Type guard - Effect schemas can be functions with ast property
const isEffectSchema = (s: unknown): s is EffectSchema => {
	if (!s) return false
	// Effect schemas can be functions or objects
	if (typeof s !== 'object' && typeof s !== 'function') return false
	return 'Type' in s && 'Encoded' in s && 'ast' in s
}

// Helpers
const getAst = (s: EffectSchema): EffectAst => s.ast
const getAstType = (s: EffectSchema): string | null => s.ast?._tag ?? null

// ============================================================================
// Transformer Adapter
// ============================================================================

export const effectTransformer = defineTransformerAdapter<EffectSchema>({
	vendor: 'effect',
	match: isEffectSchema,

	// ============ Type Detection ============
	// Effect uses AST nodes with _tag property
	isString: (s) => {
		const astType = getAstType(s)
		return (
			astType === 'StringKeyword' ||
			(astType === 'Refinement' && getAst(s)?.from?._tag === 'StringKeyword')
		)
	},
	isNumber: (s) => {
		const astType = getAstType(s)
		return (
			astType === 'NumberKeyword' ||
			(astType === 'Refinement' && getAst(s)?.from?._tag === 'NumberKeyword')
		)
	},
	isBoolean: (s) => getAstType(s) === 'BooleanKeyword',
	isNull: (s) => {
		const ast = getAst(s)
		return ast?._tag === 'Literal' && ast?.literal === null
	},
	isUndefined: (s) => getAstType(s) === 'UndefinedKeyword',
	isVoid: (s) => getAstType(s) === 'VoidKeyword',
	isAny: (s) => getAstType(s) === 'AnyKeyword',
	isUnknown: (s) => getAstType(s) === 'UnknownKeyword',
	isNever: (s) => getAstType(s) === 'NeverKeyword',
	isObject: (s) => getAstType(s) === 'TypeLiteral',
	isArray: (s) => getAstType(s) === 'TupleType' && getAst(s)?.rest?.length === 1,
	isUnion: (s) => getAstType(s) === 'Union',
	isLiteral: (s) => getAstType(s) === 'Literal',
	isEnum: (s) => getAstType(s) === 'Enums',
	isOptional: () => false, // Effect handles optionality at property level
	isNullable: () => false, // Effect uses union with null
	isTuple: (s) => {
		if (getAstType(s) !== 'TupleType') return false
		const rest = getAst(s)?.rest
		return !rest || rest.length === 0
	},
	isRecord: (s) => {
		if (getAstType(s) !== 'TypeLiteral') return false
		const indexSignatures = getAst(s)?.indexSignatures
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
		return ast?._tag === 'Transformation' && ast?.transformation?._tag === 'DefaultDeclaration'
	},
	isCatch: () => false,
	isBranded: (s) => {
		const annotations = getAst(s)?.annotations
		if (!annotations) return false
		const brandSymbol = Symbol.for('@effect/schema/annotation/Brand')
		return brandSymbol in annotations
	},
	isDate: (s) => {
		const annotations = getAst(s)?.annotations
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
		if (astType === 'Refinement' && ast?.from) {
			return { Type: null, Encoded: null, ast: ast.from } as EffectSchema
		}

		// Transformation has from
		if (astType === 'Transformation' && ast?.from) {
			return { Type: null, Encoded: null, ast: ast.from } as EffectSchema
		}

		// Suspend has f (lazy getter)
		if (astType === 'Suspend' && typeof ast?.f === 'function') {
			return { Type: null, Encoded: null, ast: ast.f() } as EffectSchema
		}

		return null
	},

	// ============ Extract ============
	getObjectEntries: (s) => {
		if (getAstType(s) !== 'TypeLiteral') return []
		const props = getAst(s)?.propertySignatures ?? []
		return props.map(
			(p) => [String(p.name), { Type: null, Encoded: null, ast: p.type }] as [string, unknown]
		)
	},

	getArrayElement: (s) => {
		if (getAstType(s) !== 'TupleType') return null
		const rest = getAst(s)?.rest
		if (rest && rest.length === 1 && rest[0]?.type) {
			return { Type: null, Encoded: null, ast: rest[0].type }
		}
		return null
	},

	getUnionOptions: (s) => {
		if (getAstType(s) !== 'Union') return []
		const types = getAst(s)?.types ?? []
		return types.map((t) => ({ Type: null, Encoded: null, ast: t }))
	},

	getLiteralValue: (s) => {
		if (getAstType(s) !== 'Literal') return undefined
		return getAst(s)?.literal
	},

	getEnumValues: (s) => {
		if (getAstType(s) !== 'Enums') return []
		const enums = getAst(s)?.enums ?? []
		return enums.map((e) => e[1])
	},

	getTupleItems: (s) => {
		if (getAstType(s) !== 'TupleType') return []
		const elements = getAst(s)?.elements ?? []
		return elements.map((e) => ({ Type: null, Encoded: null, ast: e.type }))
	},

	getRecordKeyType: () => null, // Complex in Effect

	getRecordValueType: (s) => {
		if (getAstType(s) !== 'TypeLiteral') return null
		const indexSignatures = getAst(s)?.indexSignatures
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
		// Effect stores constraints in annotations
		const annotations = getAst(s)?.annotations
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
		const annotations = getAst(s)?.annotations
		if (!annotations) return undefined
		const descSymbol = Symbol.for('@effect/schema/annotation/Description')
		return annotations[descSymbol] as string | undefined
	},

	getTitle: (s) => {
		const annotations = getAst(s)?.annotations
		if (!annotations) return undefined
		const titleSymbol = Symbol.for('@effect/schema/annotation/Title')
		return annotations[titleSymbol] as string | undefined
	},

	getDefault: () => undefined, // Complex in Effect

	getExamples: (s) => {
		const annotations = getAst(s)?.annotations
		if (!annotations) return undefined
		const examplesSymbol = Symbol.for('@effect/schema/annotation/Examples')
		const examples = annotations[examplesSymbol]
		return Array.isArray(examples) ? examples : undefined
	},

	isDeprecated: () => false,
})
