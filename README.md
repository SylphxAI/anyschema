# AnySchema

> Universal schema utilities for TypeScript. Zero dependencies. Works with any validation library.

[![npm version](https://badge.fury.io/js/anyschema.svg)](https://www.npmjs.com/package/anyschema)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why AnySchema?

The JavaScript ecosystem has **dozens of schema validation libraries**. Each has its own API, type inference, and (maybe) JSON Schema support. This fragmentation causes:

- **Lock-in** — Hard to switch libraries
- **Incompatibility** — Can't use schemas from different libs together
- **Duplication** — Every tool rebuilds support for each library
- **Confusion** — Which library should I use?

**AnySchema solves this** by providing a universal layer that works with ALL schema libraries:

```typescript
import { validate, toJsonSchema, type InferOutput } from 'anyschema';

// Works with ANY supported schema library
validate(zodSchema, data);      // ✓
validate(valibotSchema, data);  // ✓
validate(yupSchema, data);      // ✓
validate(arktypeSchema, data);  // ✓
// ... and more

// Universal type inference
type Output = InferOutput<typeof anySchema>;
```

## Features

- **🎯 Zero Dependencies** — No runtime deps, only peer deps for converters
- **🔍 Auto-Detection** — Automatically detects which library you're using
- **📦 Universal API** — Same API for all schema libraries
- **🔒 Type-Safe** — Full TypeScript support with type inference
- **🚫 Compile-Time Errors** — Unsupported operations fail at compile time, not runtime
- **🌳 Tree-Shakable** — Only loads what you use
- **📋 Protocol Support** — Supports Standard Schema + our own AnySchema Protocol
- **🔮 Future-Proof** — New libraries just implement the protocol

## Installation

```bash
npm install anyschema
```

No peer dependencies required! AnySchema works with whatever schema libraries you already have installed.

## Quick Start

```typescript
import { validate, toJsonSchema, is, parse, type InferOutput } from 'anyschema';
import { z } from 'zod';

// Define a schema (using any supported library)
const userSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
});

// Type inference
type User = InferOutput<typeof userSchema>;
// { name: string; age: number }

// Validation
const result = validate(userSchema, { name: 'John', age: 30 });
if (result.success) {
  console.log(result.data); // Typed as User
} else {
  console.log(result.issues);
}

// Type guard
if (is(userSchema, unknownData)) {
  unknownData.name; // Typed!
}

// Parse (throws on error)
const user = parse(userSchema, data);

// JSON Schema conversion
const jsonSchema = await toJsonSchema(userSchema);
```

## Supported Libraries

| Library | Validate | Type Inference | JSON Schema | Detection |
|---------|----------|----------------|-------------|-----------|
| **AnySchema Protocol** | ✅ | ✅ | ✅ | `~anyschema` |
| **Standard Schema** | ✅ | ✅ | ❌* | `~standard` |
| [Zod](https://zod.dev) | ✅ | ✅ | ✅ | Duck typing |
| [Valibot](https://valibot.dev) | ✅ | ✅ | ✅ | Duck typing |
| [ArkType](https://arktype.io) | ✅ | ✅ | ✅ | Duck typing |
| [Yup](https://github.com/jquense/yup) | ✅ | ✅ | ❌ | Duck typing |
| [Joi](https://joi.dev) | ✅ | ❌ | ❌ | Duck typing |
| [io-ts](https://gcanti.github.io/io-ts/) | ✅ | ✅ | ❌ | Duck typing |
| [Superstruct](https://docs.superstructjs.org) | ✅ | ✅ | ❌ | Duck typing |
| [TypeBox](https://github.com/sinclairzx81/typebox) | ✅ | ✅ | ✅ | Duck typing |
| [Effect Schema](https://effect.website) | ✅ | ✅ | ✅ | Duck typing |

*Standard Schema doesn't define JSON Schema conversion. AnySchema adds it via duck typing fallback.

### Type-Safe Operations

Operations that aren't supported by a library result in **compile-time errors**, not runtime errors:

```typescript
import Joi from 'joi';

const joiSchema = Joi.string();

// ❌ Compile-time error! Joi doesn't support type inference
validate(joiSchema, data);
// Error: Argument of type 'StringSchema' is not assignable to 'InferCapable'

// ❌ Compile-time error! Joi doesn't support JSON Schema
toJsonSchema(joiSchema);
// Error: Argument of type 'StringSchema' is not assignable to 'JsonSchemaCapable'

// ✅ Use the untyped version if you really need it
validateAny(joiSchema, data); // Returns ValidationResult<unknown>
```

## API Reference

### Validation

#### `validate(schema, data)`

Validate data against a schema with full type inference.

```typescript
function validate<T extends InferCapable>(
  schema: T,
  data: unknown
): ValidationResult<InferOutput<T>>;
```

```typescript
const result = validate(schema, { name: 'John' });
if (result.success) {
  result.data; // Fully typed
} else {
  result.issues; // Array of { message, path? }
}
```

#### `validateAsync(schema, data)`

Async validation for schemas that support it.

```typescript
const result = await validateAsync(asyncSchema, data);
```

#### `validateAny(schema, data)`

Validate without type inference (escape hatch).

```typescript
const result = validateAny(anySchema, data);
// Returns ValidationResult<unknown>
```

### Type Guards

#### `is(schema, data)`

Type guard that narrows the type of data.

```typescript
function is<T extends InferCapable>(
  schema: T,
  data: unknown
): data is InferOutput<T>;
```

```typescript
if (is(userSchema, data)) {
  data.name; // TypeScript knows data is User
}
```

#### `assert(schema, data)`

Assert that data matches schema, throws if not.

```typescript
function assert<T extends InferCapable>(
  schema: T,
  data: unknown
): asserts data is InferOutput<T>;
```

```typescript
assert(userSchema, data);
data.name; // TypeScript knows data is User
```

### Parsing

#### `parse(schema, data)`

Parse data, throwing on validation errors.

```typescript
function parse<T extends InferCapable>(
  schema: T,
  data: unknown
): InferOutput<T>;
```

```typescript
try {
  const user = parse(userSchema, data);
} catch (error) {
  // ValidationError with issues
}
```

#### `parseAsync(schema, data)`

Async version of parse.

```typescript
const user = await parseAsync(asyncSchema, data);
```

### JSON Schema

#### `toJsonSchema(schema)`

Convert a schema to JSON Schema (async, tree-shakable).

```typescript
function toJsonSchema<T extends JsonSchemaCapable>(
  schema: T
): Promise<JSONSchema>;
```

```typescript
const jsonSchema = await toJsonSchema(zodSchema);
// { type: 'object', properties: { ... } }
```

#### `toJsonSchemaSync(schema)`

Sync version (uses `require()`).

```typescript
const jsonSchema = toJsonSchemaSync(zodSchema);
```

### Metadata

#### `getMetadata(schema)`

Extract metadata from a schema.

```typescript
function getMetadata<T extends MetadataCapable>(
  schema: T
): SchemaMetadata;
```

```typescript
const meta = getMetadata(schema);
// { title?, description?, examples?, default?, deprecated? }
```

### Detection

#### `detectVendor(schema)`

Detect which library a schema is from.

```typescript
detectVendor(zodSchema);    // 'zod'
detectVendor(yupSchema);    // 'yup'
detectVendor(customSchema); // 'anyschema' or 'standard-schema' or null
```

#### Type Guards

```typescript
isZodSchema(schema);        // schema is ZodLike
isValibotSchema(schema);    // schema is ValibotLike
isArkTypeSchema(schema);    // schema is ArkTypeLike
isYupSchema(schema);        // schema is YupLike
// ... etc
```

## Type Inference

### `InferOutput<T>`

Infer the output type from any supported schema.

```typescript
import { z } from 'zod';
import * as v from 'valibot';
import { type } from 'arktype';

const zodSchema = z.object({ name: z.string() });
type A = InferOutput<typeof zodSchema>; // { name: string }

const valibotSchema = v.object({ name: v.string() });
type B = InferOutput<typeof valibotSchema>; // { name: string }

const arktypeSchema = type({ name: 'string' });
type C = InferOutput<typeof arktypeSchema>; // { name: string }
```

### `InferInput<T>`

Infer the input type (before transforms).

```typescript
const schema = z.string().transform(s => s.length);
type Input = InferInput<typeof schema>;   // string
type Output = InferOutput<typeof schema>; // number
```

### `IsValidSchema<T>`

Check if a type is a valid schema.

```typescript
type A = IsValidSchema<z.ZodString>;  // true
type B = IsValidSchema<{ foo: string }>; // false
```

## Capability Types

AnySchema uses capability types to enforce type safety at compile time:

```typescript
// Only schemas that support JSON Schema conversion
type JsonSchemaCapable = ...;

// Only schemas that support type inference
type InferCapable = ...;

// Only schemas that support async validation
type AsyncCapable = ...;

// Only schemas that have metadata
type MetadataCapable = ...;
```

Functions use these as constraints:

```typescript
// This function ONLY accepts JsonSchemaCapable schemas
function toJsonSchema<T extends JsonSchemaCapable>(schema: T): Promise<JSONSchema>;

// Passing a non-capable schema results in a compile-time error!
```

## AnySchema Protocol

For library authors who want first-class AnySchema support.

### Specification

```typescript
interface AnySchemaV1<Output = unknown, Input = unknown> {
  // Required: Identity marker
  readonly '~anyschema': {
    readonly version: 1;
    readonly vendor: string;
  };

  // Required: Type carriers (compile-time only)
  readonly '~types': {
    readonly input: Input;
    readonly output: Output;
  };

  // Required: Validation
  readonly '~validate': (data: unknown) => ValidationResult<Output>;

  // Optional: Async validation
  readonly '~validateAsync'?: (data: unknown) => Promise<ValidationResult<Output>>;

  // Optional: JSON Schema conversion
  readonly '~toJsonSchema'?: () => JSONSchema;

  // Optional: Coercion
  readonly '~coerce'?: (data: unknown) => unknown;

  // Optional: Metadata
  readonly '~meta'?: {
    readonly title?: string;
    readonly description?: string;
    readonly examples?: readonly unknown[];
    readonly default?: Output;
    readonly deprecated?: boolean;
  };
}
```

### Creating a Protocol-Compliant Schema

```typescript
import { createSchema } from 'anyschema';

const myStringSchema = createSchema<string>({
  vendor: 'my-library',
  validate: (data) => {
    if (typeof data === 'string') {
      return { success: true, data };
    }
    return {
      success: false,
      issues: [{ message: 'Expected string' }]
    };
  },
  toJsonSchema: () => ({ type: 'string' }),
  meta: {
    title: 'String',
    description: 'A string value',
  },
});

// Now works with all AnySchema functions
validate(myStringSchema, 'hello');  // ✓
toJsonSchema(myStringSchema);       // ✓
type Output = InferOutput<typeof myStringSchema>; // string
```

## Standard Schema Compatibility

AnySchema is a **superset** of [Standard Schema](https://github.com/standard-schema/standard-schema). Any library implementing Standard Schema automatically works with AnySchema:

```typescript
// If a library implements Standard Schema...
const schema = {
  '~standard': {
    version: 1,
    vendor: 'my-lib',
    validate: (data) => ({ value: data }),
  }
};

// ...it works with AnySchema!
validate(schema, data); // ✓
```

AnySchema extends Standard Schema with:
- JSON Schema conversion
- Metadata extraction
- Coercion support
- More type utilities

## Detection Priority

AnySchema detects schemas in this order:

1. **AnySchema Protocol** (`~anyschema`) — Our protocol, highest priority
2. **Standard Schema** (`~standard`) — Community standard
3. **Duck Typing** — Fallback for all other libraries

```typescript
function detectSchema(schema: unknown) {
  // 1. AnySchema Protocol
  if ('~anyschema' in schema) return 'anyschema';

  // 2. Standard Schema
  if ('~standard' in schema) return 'standard-schema';

  // 3. Duck typing
  if (isZodLike(schema)) return 'zod';
  if (isValibotLike(schema)) return 'valibot';
  // ... etc
}
```

## Tree Shaking

AnySchema uses dynamic imports for JSON Schema converters:

```typescript
// Only loads zod-to-json-schema when you actually use it
const jsonSchema = await toJsonSchema(zodSchema);
```

This means your bundle only includes the code you use.

## Error Handling

### ValidationResult

```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

interface ValidationIssue {
  message: string;
  path?: (string | number)[];
}
```

### ValidationError

Thrown by `parse()` and `assert()`:

```typescript
class ValidationError extends Error {
  issues: ValidationIssue[];
}
```

## Comparison

### vs Standard Schema

| Feature | Standard Schema | AnySchema |
|---------|-----------------|-----------|
| Validation | ✅ | ✅ |
| Type inference | ✅ | ✅ |
| JSON Schema | ❌ | ✅ |
| Metadata | ❌ | ✅ |
| Coercion | ❌ | ✅ |
| Duck typing fallback | ❌ | ✅ |
| Compile-time capability checks | ❌ | ✅ |
| Adoption | Growing | — |

### vs Direct Library Usage

| Feature | Direct | AnySchema |
|---------|--------|-----------|
| Type safety | ✅ | ✅ |
| Library lock-in | ✅ | ❌ |
| Universal API | ❌ | ✅ |
| Mix libraries | ❌ | ✅ |
| JSON Schema (universal) | ❌ | ✅ |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © AnySchema Contributors
