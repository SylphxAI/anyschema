/**
 * JSON Schema type definitions (Draft 07 compatible)
 */

export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface JSONSchema {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchema>;
  definitions?: Record<string, JSONSchema>;
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  type?: JSONSchemaType | JSONSchemaType[];
  enum?: unknown[];
  const?: unknown;
  // String
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  // Number
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  // Array
  items?: JSONSchema | JSONSchema[];
  additionalItems?: JSONSchema | boolean;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  contains?: JSONSchema;
  // Object
  properties?: Record<string, JSONSchema>;
  patternProperties?: Record<string, JSONSchema>;
  additionalProperties?: JSONSchema | boolean;
  required?: string[];
  propertyNames?: JSONSchema;
  minProperties?: number;
  maxProperties?: number;
  // Composition
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  // Conditional
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;
  // Extensible
  [key: string]: unknown;
}

/**
 * Supported schema vendors
 */
export type SchemaVendor = 'zod' | 'valibot' | 'arktype';
