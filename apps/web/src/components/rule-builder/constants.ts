import type {
  Template,
  ConstraintType,
  ConstraintCategory,
  FieldTypeData,
} from "./types";

export const TEMPLATES: Record<string, Template> = {
  "uniswap-v3-swap": {
    name: "Uniswap V3 Swap (DeFi)",
    method: "signTransaction",
    fields: [
      {
        property: "functionName",
        constraint: "const",
        value: "exactInputSingle",
      },
      {
        property: "to",
        constraint: "addressEq",
        value: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      },
    ],
  },
  "erc20-transfer": {
    name: "ERC20 Transfer",
    method: "signTransaction",
    fields: [
      { property: "functionName", constraint: "const", value: "transfer" },
    ],
  },
  "erc20-approve": {
    name: "ERC20 Approve",
    method: "signTransaction",
    fields: [
      { property: "functionName", constraint: "const", value: "approve" },
    ],
  },
  "erc20-approve-with-args": {
    name: "ERC20 Approve with Args Validation",
    method: "signTransaction",
    fields: [
      { property: "functionName", constraint: "const", value: "approve" },
    ],
  },
  "conditional-transaction": {
    name: "Conditional Transaction (anyOf Example)",
    method: "signTransaction",
    fields: [
      { property: "functionName", constraint: "const", value: "transfer" },
    ],
  },
};

export const CONSTRAINT_TYPES: Record<string, ConstraintType> = {
  // Basic
  const: {
    label: "const",
    valueType: "string",
    description: "Exact value match",
  },
  eq: {
    label: "eq",
    valueType: "string",
    description: "Equality (alias for const)",
  },
  enum: {
    label: "enum",
    valueType: "array",
    description: "One of multiple values",
  },
  type: { label: "type", valueType: "string", description: "JSON Schema type" },
  required: {
    label: "required",
    valueType: "boolean",
    description: "Field is required",
  },

  // Logical
  anyOf: {
    label: "anyOf",
    valueType: "array",
    description: "Match any of these schemas",
  },
  allOf: {
    label: "allOf",
    valueType: "array",
    description: "Match all of these schemas",
  },
  oneOf: {
    label: "oneOf",
    valueType: "array",
    description: "Match exactly one schema",
  },
  not: {
    label: "not",
    valueType: "object",
    description: "Must not match this schema",
  },

  // Numeric (legacy JSON Schema)
  minimum: {
    label: "minimum",
    valueType: "number",
    description: "Minimum value",
  },
  maximum: {
    label: "maximum",
    valueType: "number",
    description: "Maximum value",
  },
  min: {
    label: "min",
    valueType: "number",
    description: "Minimum value (alias)",
  },
  max: {
    label: "max",
    valueType: "number",
    description: "Maximum value (alias)",
  },
  lt: { label: "lt", valueType: "number", description: "Less than" },
  lte: { label: "lte", valueType: "number", description: "Less than or equal" },
  gt: { label: "gt", valueType: "number", description: "Greater than" },
  gte: {
    label: "gte",
    valueType: "number",
    description: "Greater than or equal",
  },

  // Custom numeric constraints
  numericMin: {
    label: "numericMin",
    valueType: "number",
    description: "Numeric minimum",
  },
  numericMax: {
    label: "numericMax",
    valueType: "number",
    description: "Numeric maximum",
  },
  numericEq: {
    label: "numericEq",
    valueType: "number",
    description: "Numeric equality",
  },
  numericLt: {
    label: "numericLt",
    valueType: "number",
    description: "Numeric less than",
  },
  numericLte: {
    label: "numericLte",
    valueType: "number",
    description: "Numeric less than or equal",
  },
  numericGt: {
    label: "numericGt",
    valueType: "number",
    description: "Numeric greater than",
  },
  numericGte: {
    label: "numericGte",
    valueType: "number",
    description: "Numeric greater than or equal",
  },
  "24hLimit": {
    label: "24hLimit",
    valueType: "number",
    description: "24 hour spending limit",
  },

  // BigInt constraints
  bigIntMin: {
    label: "bigIntMin",
    valueType: "string",
    description: "BigInt minimum",
  },
  bigIntMax: {
    label: "bigIntMax",
    valueType: "string",
    description: "BigInt maximum",
  },
  bigIntEq: {
    label: "bigIntEq",
    valueType: "string",
    description: "BigInt equality",
  },

  // Address constraints
  addressEq: {
    label: "addressEq",
    valueType: "string",
    description: "Address equality",
  },
  addressInList: {
    label: "addressInList",
    valueType: "array",
    description: "Address in list",
  },

  // String constraints
  stringContains: {
    label: "stringContains",
    valueType: "string",
    description: "Contains substring",
  },
  stringStartsWith: {
    label: "stringStartsWith",
    valueType: "string",
    description: "Starts with",
  },
  stringEndsWith: {
    label: "stringEndsWith",
    valueType: "string",
    description: "Ends with",
  },
  contains: {
    label: "contains",
    valueType: "string",
    description: "Contains (alias)",
  },
  startsWith: {
    label: "startsWith",
    valueType: "string",
    description: "Starts with (alias)",
  },
  endsWith: {
    label: "endsWith",
    valueType: "string",
    description: "Ends with (alias)",
  },
  matches: {
    label: "matches",
    valueType: "string",
    description: "Regex pattern match",
  },
  inList: { label: "inList", valueType: "array", description: "Value in list" },

  // String/Length
  minLength: {
    label: "minLength",
    valueType: "number",
    description: "Minimum string length",
  },
  maxLength: {
    label: "maxLength",
    valueType: "number",
    description: "Maximum string length",
  },
  lengthEq: {
    label: "lengthEq",
    valueType: "number",
    description: "Exact length",
  },
  pattern: {
    label: "pattern",
    valueType: "string",
    description: "Regex pattern",
  },

  // Boolean constraints
  is: { label: "is", valueType: "boolean", description: "Boolean value check" },

  // Date constraints
  before: { label: "before", valueType: "string", description: "Before date" },
  after: { label: "after", valueType: "string", description: "After date" },

  // Array constraints
  containsItem: {
    label: "containsItem",
    valueType: "string",
    description: "Contains specific item",
  },
  containsAny: {
    label: "containsAny",
    valueType: "array",
    description: "Contains any of these items",
  },
  containsAll: {
    label: "containsAll",
    valueType: "array",
    description: "Contains all of these items",
  },
  equals: {
    label: "equals",
    valueType: "array",
    description: "Array equals exactly",
  },

  // Object constraints
  shape: {
    label: "shape",
    valueType: "object",
    description: "Object shape validation",
  },
  hasKeys: {
    label: "hasKeys",
    valueType: "array",
    description: "Has required keys",
  },
  requiredKeys: {
    label: "requiredKeys",
    valueType: "array",
    description: "Required keys",
  },

  // Conditional constraints
  if: { label: "if", valueType: "object", description: "If condition" },
  then: { label: "then", valueType: "object", description: "Then clause" },
  else: { label: "else", valueType: "object", description: "Else clause" },
};

export const CONSTRAINT_CATEGORIES: Record<string, ConstraintCategory> = {
  BASIC: {
    label: "Basic Constraints",
    constraints: ["const", "eq", "enum", "type", "required"],
  },
  NUMERIC: {
    label: "Numeric Constraints",
    constraints: [
      "numericMin",
      "numericMax",
      "numericEq",
      "numericLt",
      "numericLte",
      "numericGt",
      "numericGte",
      "minimum",
      "maximum",
      "min",
      "max",
      "lt",
      "lte",
      "gt",
      "gte",
      "24hLimit",
    ],
  },
  BIGINT: {
    label: "BigInt Constraints",
    constraints: ["bigIntMin", "bigIntMax", "bigIntEq"],
  },
  STRING: {
    label: "String Constraints",
    constraints: [
      "stringContains",
      "stringStartsWith",
      "stringEndsWith",
      "contains",
      "startsWith",
      "endsWith",
      "matches",
      "pattern",
      "minLength",
      "maxLength",
      "lengthEq",
      "inList",
    ],
  },
  ADDRESS: {
    label: "Address Constraints",
    constraints: ["addressEq", "addressInList"],
  },
  BOOLEAN: {
    label: "Boolean Constraints",
    constraints: ["is"],
  },
  DATE: {
    label: "Date Constraints",
    constraints: ["before", "after"],
  },
  ARRAY: {
    label: "Array Constraints",
    constraints: [
      "containsItem",
      "containsAny",
      "containsAll",
      "equals",
      "minLength",
      "maxLength",
      "lengthEq",
    ],
  },
  OBJECT: {
    label: "Object Constraints",
    constraints: ["shape", "hasKeys", "requiredKeys"],
  },
  LOGICAL: {
    label: "Logical Constraints",
    constraints: ["anyOf", "allOf", "oneOf", "not"],
  },
  CONDITIONAL: {
    label: "Conditional Constraints",
    constraints: ["if", "then", "else"],
  },
};

export const FIELD_TYPES: Record<string, FieldTypeData> = {
  Number: {
    label: "Number Field",
    icon: "settings",
    defaultConstraints: ["numericEq"],
    allowedConstraints: [
      ...CONSTRAINT_CATEGORIES.NUMERIC.constraints,
      ...CONSTRAINT_CATEGORIES.BASIC.constraints,
    ],
    hasAdditionalFields: false,
  },
  String: {
    label: "String Field",
    icon: "doc",
    defaultConstraints: ["const"],
    allowedConstraints: [
      ...CONSTRAINT_CATEGORIES.STRING.constraints,
      ...CONSTRAINT_CATEGORIES.BASIC.constraints,
      ...CONSTRAINT_CATEGORIES.ADDRESS.constraints,
      ...CONSTRAINT_CATEGORIES.DATE.constraints,
    ],
    hasAdditionalFields: false,
  },
  Boolean: {
    label: "Boolean Field",
    icon: "check",
    defaultConstraints: ["const"],
    allowedConstraints: [
      ...CONSTRAINT_CATEGORIES.BOOLEAN.constraints,
      ...CONSTRAINT_CATEGORIES.BASIC.constraints,
    ],
    hasAdditionalFields: false,
  },
  BigInt: {
    label: "BigInt Field",
    icon: "settings",
    defaultConstraints: ["bigIntEq"],
    allowedConstraints: [
      ...CONSTRAINT_CATEGORIES.BIGINT.constraints,
      ...CONSTRAINT_CATEGORIES.BASIC.constraints,
    ],
    hasAdditionalFields: false,
  },
  Array: {
    label: "Array Field",
    icon: "file",
    defaultConstraints: ["lengthEq"],
    allowedConstraints: [
      ...CONSTRAINT_CATEGORIES.ARRAY.constraints,
      ...CONSTRAINT_CATEGORIES.BASIC.constraints,
    ],
    hasAdditionalFields: true,
  },
  Object: {
    label: "Object Field",
    icon: "code",
    defaultConstraints: ["type"],
    allowedConstraints: [
      ...CONSTRAINT_CATEGORIES.OBJECT.constraints,
      ...CONSTRAINT_CATEGORIES.LOGICAL.constraints,
      ...CONSTRAINT_CATEGORIES.CONDITIONAL.constraints,
      ...CONSTRAINT_CATEGORIES.BASIC.constraints,
    ],
    hasAdditionalFields: true,
  },
};
