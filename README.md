# AnySchema

> Universal schema utilities for TypeScript. Zero dependencies. Plugin-based adapter system.

[![npm version](https://badge.fury.io/js/@sylphx/anyschema.svg)](https://www.npmjs.com/package/@sylphx/anyschema)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why AnySchema?

The JavaScript ecosystem has **dozens of schema validation libraries**. Each has its own API, type inference, and JSON Schema support. This causes:

- **Lock-in** — Hard to switch libraries
- **Incompatibility** — Can't use schemas from different libs together
- **Duplication** — Every tool rebuilds support for each library

**AnySchema solves this** with a **thin adapter system**:

```typescript
import { validate, toJsonSchema, type Infer } from '@sylphx/anyschema'

// Works with ANY supported schema library - zero config
validate(zodSchema, data)
validate(valibotSchema, data)
validate(arktypeSchema, data)

// Universal type inference
type Output = Infer<typeof anySchema>

// JSON Schema conversion - no external deps
const jsonSchema = toJsonSchema(zodV4Schema)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Core Functions                        │
│  validate() · toJsonSchema() · parse() · is() · infer   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Adapter Interface                      │
│  match · isString · isObject · getShape · validate ...  │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐     ┌──────────┐
   │ Zod v4  │      │ Valibot  │     │ ArkType  │
   │ Adapter │      │ Adapter  │     │ Adapter  │
   └─────────┘      └──────────┘     └──────────┘
```

**Each adapter is ~50 lines** — just duck-type detection and property access.

## Installation

```bash
npm install @sylphx/anyschema
```

No peer dependencies! Works with whatever schema libraries you have installed.

## Quick Start

```typescript
import { validate, toJsonSchema, parse, is, type Infer } from '@sylphx/anyschema'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
})

// Type inference
type User = Infer<typeof userSchema>

// Validation
const result = validate(userSchema, data)
if (result.success) {
  console.log(result.data) // typed as User
}

// Type guard
if (is(userSchema, data)) {
  data.name // typed!
}

// Parse (throws on error)
const user = parse(userSchema, data)

// JSON Schema (sync, no deps!)
const jsonSchema = toJsonSchema(userSchema)
```

## Supported Libraries

| Library | Validate | Type Infer | JSON Schema | Adapter |
|---------|:--------:|:----------:|:-----------:|:-------:|
| [Zod v4](https://zod.dev) | ✅ | ✅ | ✅ | Built-in |
| [Zod v3](https://zod.dev) | ✅ | ✅ | ✅ | Built-in |
| [Valibot](https://valibot.dev) | ✅ | ✅ | ✅ | Built-in |
| [ArkType](https://arktype.io) | ✅ | ✅ | ✅ | Built-in |
| [TypeBox](https://github.com/sinclairzx81/typebox) | ✅ | ✅ | ✅ | Built-in |
| [Yup](https://github.com/jquense/yup) | ✅ | ✅ | 🚧 | Built-in |
| [Effect Schema](https://effect.website) | ✅ | ✅ | 🚧 | Built-in |
| Custom | ✅ | ✅ | ✅ | You write |

## API Reference

### Validation

#### `validate(schema, data)`

```typescript
const result = validate(schema, data)
if (result.success) {
  result.data // fully typed
} else {
  result.issues // [{ message, path? }]
}
```

#### `validateAsync(schema, data)`

```typescript
const result = await validateAsync(asyncSchema, data)
```

#### `parse(schema, data)`

Parse and return typed data. Throws `ValidationError` on failure.

```typescript
const user = parse(userSchema, data)
```

#### `parseAsync(schema, data)`

```typescript
const user = await parseAsync(asyncSchema, data)
```

### Type Guards

#### `is(schema, data)`

```typescript
if (is(userSchema, data)) {
  data.name // TypeScript knows it's User
}
```

#### `assert(schema, data)`

```typescript
assert(userSchema, data)
data.name // TypeScript knows it's User
```

### JSON Schema

#### `toJsonSchema(schema)`

Convert any supported schema to JSON Schema. **Sync, zero deps.**

```typescript
const jsonSchema = toJsonSchema(zodSchema)
// { type: 'object', properties: { ... } }
```

**Supported conversions:**

| Feature | Support |
|---------|:-------:|
| Primitives (string, number, boolean, null) | ✅ |
| Objects | ✅ |
| Arrays | ✅ |
| Unions | ✅ |
| Literals | ✅ |
| Enums | ✅ |
| Optional / Nullable | ✅ |
| Tuples | ✅ |
| Records | ✅ |
| Intersections | ✅ |
| Recursive / Lazy | ✅ (`$ref`) |
| Constraints (min, max, pattern) | ✅ |
| Description / Title | ✅ |
| Transform / Refine | ⏭️ Skipped |

### Metadata

#### `getMetadata(schema)`

```typescript
const meta = getMetadata(schema)
// { title?, description?, examples?, default?, deprecated? }
```

### Detection

#### `detectVendor(schema)`

```typescript
detectVendor(zodSchema)    // 'zod'
detectVendor(valibotSchema) // 'valibot'
```

### Type Inference

#### `Infer<T>`

```typescript
const schema = z.object({ name: z.string() })
type User = Infer<typeof schema> // { name: string }
```

#### `InferInput<T>`

```typescript
const schema = z.string().transform(s => s.length)
type Input = InferInput<typeof schema>  // string
type Output = Infer<typeof schema>      // number
```

## Adapter System

### Interface

Every adapter implements this interface:

```typescript
interface SchemaAdapter {
  /** Unique identifier */
  vendor: string

  /** Check if this adapter handles the schema */
  match(schema: unknown): boolean

  // ============ Type Detection ============
  isString(schema: unknown): boolean
  isNumber(schema: unknown): boolean
  isBoolean(schema: unknown): boolean
  isNull(schema: unknown): boolean
  isUndefined(schema: unknown): boolean
  isObject(schema: unknown): boolean
  isArray(schema: unknown): boolean
  isUnion(schema: unknown): boolean
  isLiteral(schema: unknown): boolean
  isEnum(schema: unknown): boolean
  isOptional(schema: unknown): boolean
  isNullable(schema: unknown): boolean
  isTuple(schema: unknown): boolean
  isRecord(schema: unknown): boolean
  isIntersection(schema: unknown): boolean
  isLazy(schema: unknown): boolean

  // ============ Unwrap ============
  /** For optional/nullable/lazy - get inner schema */
  unwrap(schema: unknown): unknown

  // ============ Extract ============
  getObjectEntries(schema: unknown): [string, unknown][]
  getArrayElement(schema: unknown): unknown
  getUnionOptions(schema: unknown): unknown[]
  getLiteralValue(schema: unknown): unknown
  getEnumValues(schema: unknown): unknown[]
  getTupleItems(schema: unknown): unknown[]
  getRecordValue(schema: unknown): unknown
  getIntersectionSchemas(schema: unknown): unknown[]

  // ============ Constraints ============
  getConstraints(schema: unknown): {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    format?: string
  } | undefined

  // ============ Metadata ============
  getDescription(schema: unknown): string | undefined
  getTitle(schema: unknown): string | undefined
  getDefault(schema: unknown): unknown
  getExamples(schema: unknown): unknown[] | undefined

  // ============ Validation ============
  validate(schema: unknown, data: unknown): ValidationResult
  validateAsync?(schema: unknown, data: unknown): Promise<ValidationResult>

  // ============ Type Inference (compile-time) ============
  /** Type-level output inference */
  _output: unknown
  /** Type-level input inference */
  _input: unknown
}
```

### Writing an Adapter

Example: Zod v4 adapter (~50 lines)

```typescript
import { defineAdapter } from '@sylphx/anyschema'

export const zodV4Adapter = defineAdapter({
  vendor: 'zod',

  match: (s) => s != null && typeof s === 'object' && '_zod' in s,

  // Type detection - just check _zod.def.type
  isString: (s) => s._zod.def.type === 'string',
  isNumber: (s) => s._zod.def.type === 'number',
  isBoolean: (s) => s._zod.def.type === 'boolean',
  isNull: (s) => s._zod.def.type === 'null',
  isUndefined: (s) => s._zod.def.type === 'undefined',
  isObject: (s) => s._zod.def.type === 'object',
  isArray: (s) => s._zod.def.type === 'array',
  isUnion: (s) => s._zod.def.type === 'union',
  isLiteral: (s) => s._zod.def.type === 'literal',
  isEnum: (s) => s._zod.def.type === 'enum',
  isOptional: (s) => s._zod.def.type === 'optional',
  isNullable: (s) => s._zod.def.type === 'nullable',
  isTuple: (s) => s._zod.def.type === 'tuple',
  isRecord: (s) => s._zod.def.type === 'record',
  isIntersection: (s) => s._zod.def.type === 'intersection',
  isLazy: (s) => s._zod.def.type === 'lazy',

  // Unwrap
  unwrap: (s) => s._zod.def.innerType ?? s._zod.def.schema?.(),

  // Extract
  getObjectEntries: (s) => Object.entries(s._zod.def.shape ?? {}),
  getArrayElement: (s) => s._zod.def.element,
  getUnionOptions: (s) => s._zod.def.options ?? [],
  getLiteralValue: (s) => s._zod.def.value,
  getEnumValues: (s) => s._zod.def.values ?? [],
  getTupleItems: (s) => s._zod.def.items ?? [],
  getRecordValue: (s) => s._zod.def.valueType,
  getIntersectionSchemas: (s) => [s._zod.def.left, s._zod.def.right],

  // Constraints
  getConstraints: (s) => {
    const checks = s._zod.def.checks ?? []
    const result: any = {}
    for (const c of checks) {
      if (c.kind === 'min') result.min = c.value
      if (c.kind === 'max') result.max = c.value
      // ...
    }
    return Object.keys(result).length ? result : undefined
  },

  // Metadata
  getDescription: (s) => s.description,
  getTitle: (s) => undefined, // Zod doesn't have title
  getDefault: (s) => s._zod.def.defaultValue?.(),
  getExamples: (s) => undefined,

  // Validation
  validate: (s, data) => {
    const result = s.safeParse(data)
    if (result.success) return { success: true, data: result.data }
    return {
      success: false,
      issues: result.error.issues.map(i => ({
        message: i.message,
        path: i.path,
      }))
    }
  },
})
```

### Registering Custom Adapters

```typescript
import { registerAdapter } from '@sylphx/anyschema'
import { myAdapter } from './my-adapter'

registerAdapter(myAdapter)

// Now works with all AnySchema functions
validate(mySchema, data)
toJsonSchema(mySchema)
```

## How It Works

### JSON Schema Generation (Zero Deps)

```typescript
// Core transformer - uses adapters
function toJsonSchema(schema: unknown): JSONSchema {
  const adapter = findAdapter(schema)

  if (adapter.isString(schema)) {
    return {
      type: 'string',
      description: adapter.getDescription(schema),
      ...adapter.getConstraints(schema),
    }
  }

  if (adapter.isObject(schema)) {
    const entries = adapter.getObjectEntries(schema)
    return {
      type: 'object',
      properties: Object.fromEntries(
        entries.map(([k, v]) => [k, toJsonSchema(v)])
      ),
      required: entries
        .filter(([_, v]) => !adapter.isOptional(v))
        .map(([k]) => k),
    }
  }

  if (adapter.isArray(schema)) {
    return {
      type: 'array',
      items: toJsonSchema(adapter.getArrayElement(schema)),
    }
  }

  // ... etc
}
```

### Validation

```typescript
function validate(schema: unknown, data: unknown) {
  const adapter = findAdapter(schema)
  return adapter.validate(schema, data)
}
```

### Type Inference

```typescript
// Compile-time only - uses conditional types
type Infer<T> =
  T extends { _zod: any } ? T['_zod']['~output'] :
  T extends { types: { output: infer O } } ? O :  // Valibot
  T extends { infer: infer O } ? O :              // ArkType
  never
```

## Comparison

### vs Direct Library Usage

| | Direct | AnySchema |
|--|--------|-----------|
| Type safety | ✅ | ✅ |
| Library lock-in | ✅ | ❌ |
| Mix libraries | ❌ | ✅ |
| JSON Schema | Library-specific | Universal |
| Bundle size | Varies | ~5KB + adapters |

### vs Standard Schema

| | Standard Schema | AnySchema |
|--|-----------------|-----------|
| Validation | ✅ | ✅ |
| Type inference | ✅ | ✅ |
| JSON Schema | ❌ | ✅ |
| Duck typing | ❌ | ✅ |
| Extensible | ❌ | ✅ (adapters) |

## Contributing

Want to add support for a new library? Just write an adapter!

1. Implement the `SchemaAdapter` interface
2. Add tests
3. Submit PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT © AnySchema Contributors
