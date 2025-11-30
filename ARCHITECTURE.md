# AnySchema Architecture

## Design Principles

1. **Zero dependencies** - Pure duck typing, no imports from schema libraries
2. **Adapter-first** - Single unified system for all operations
3. **Composable helpers** - Reusable validation/extraction logic
4. **Blind-call native** - Use schema's native methods when available

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Public API                           │
│  validate() / toJsonSchema() / is() / parse() / assert()   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Adapter Registry                        │
│  findAdapter(schema) → adapter                              │
│  - Match by duck typing (priority order)                    │
│  - First match wins                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Adapters                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Zod v4   │ │ Zod v3   │ │ Valibot  │ │ ArkType  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Yup      │ │ Joi      │ │ io-ts    │ │Superstruct│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ TypeBox  │ │ Effect   │ │ Runtypes │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Composable Helpers                        │
│  Validation:                                                │
│  - withSafeParse()    → Zod v3/v4                          │
│  - withValibotRun()   → Valibot                            │
│  - withValidateSync() → Yup                                │
│  - withJoiValidate()  → Joi                                │
│  - withDecode()       → io-ts                              │
│  - withCallable()     → ArkType                            │
│  - withCheck()        → Runtypes                           │
│                                                             │
│  JSON Schema:                                               │
│  - tryNativeToJsonSchema() → ArkType, TypeBox              │
└─────────────────────────────────────────────────────────────┘
```

## Adapter Interface

```typescript
interface SchemaAdapter {
  vendor: string

  // Detection
  match: (schema: unknown) => boolean

  // Validation (uses composable helpers)
  validate: (schema: unknown, data: unknown) => ValidationResult
  validateAsync?: (schema: unknown, data: unknown) => Promise<ValidationResult>

  // Type detection (for JSON Schema conversion)
  isString / isNumber / isBoolean / isNull / ...
  isObject / isArray / isTuple / isUnion / ...
  isOptional / isNullable / isDefault / ...

  // Data extraction (for JSON Schema conversion)
  unwrap: (schema: unknown) => unknown | null
  getObjectEntries / getArrayElement / getUnionOptions / ...
  getConstraints / getDescription / getDefault / ...
}
```

## Validation Flow

```
validate(schema, data)
  │
  ├─ 1. Check AnySchema Protocol (~anyschema)
  │     → schema['~validate'](data)
  │
  ├─ 2. Check Standard Schema (~standard)
  │     → schema['~standard'].validate(data)
  │
  └─ 3. Find adapter
        → adapter = findAdapter(schema)
        → adapter.validate(schema, data)
```

## JSON Schema Flow

```
toJsonSchema(schema)
  │
  ├─ 1. Try native method (blind-call)
  │     → schema.toJsonSchema?.() or schema['~toJsonSchema']?.()
  │
  ├─ 2. Check if schema IS JSON Schema (TypeBox)
  │     → return schema directly
  │
  └─ 3. Build via adapter
        → adapter = findAdapter(schema)
        → transform(schema, adapter) // recursive
```

## Composable Helpers

Validation helpers are pure functions that:
1. Check if schema has the required method
2. Call the method
3. Normalize the result to ValidationResult

```typescript
// Example: withSafeParse
function withSafeParse(schema: unknown, data: unknown): ValidationResult | null {
  if (typeof schema?.safeParse !== 'function') return null

  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    issues: result.error?.issues?.map(i => ({
      message: i.message,
      path: i.path
    })) ?? [{ message: 'Validation failed' }]
  }
}
```

## Adapter Registration Order

Adapters are registered in priority order (most specific first):

1. **Zod v4** - `_zod` property (newer, check first)
2. **Zod v3** - `_def` + `parse` method
3. **Valibot** - `kind === 'schema'`
4. **ArkType** - callable + `internal` + `json`
5. **Yup** - `__isYupSchema__`
6. **Joi** - `$_root` + `type` + `validate`
7. **io-ts** - `_tag` + `decode` + `encode`
8. **Superstruct** - `refiner` + `validator` + `coercer`
9. **TypeBox** - `Symbol.for('TypeBox.Kind')` or `static` + `params`
10. **Effect** - `Type` + `Encoded` + `ast`
11. **Runtypes** - `reflect` + `check` + `guard`

## File Structure

```
src/
├── index.ts              # Public API (thin layer)
├── types.ts              # Type definitions
├── detection.ts          # Schema detection utilities
├── adapter/
│   ├── index.ts          # Registry + exports
│   ├── types.ts          # Adapter interface
│   ├── transformer.ts    # JSON Schema transformer
│   ├── helpers.ts        # Composable validation helpers (NEW)
│   └── adapters/
│       ├── index.ts      # Auto-register all adapters
│       ├── zod-v4.ts
│       ├── zod-v3.ts
│       ├── valibot.ts
│       ├── arktype.ts
│       ├── yup.ts        # NEW
│       ├── joi.ts        # NEW
│       ├── io-ts.ts      # NEW
│       ├── superstruct.ts # NEW
│       ├── typebox.ts    # NEW
│       ├── effect.ts     # NEW
│       └── runtypes.ts   # NEW
```

## Removed (Deprecated)

- `blind-call.ts` - Logic moved to composable helpers
- `validateByVendor()` - Replaced by adapter.validate()
- `toJsonSchemaByVendor()` - Replaced by adapter-based transformer
