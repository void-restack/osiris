export interface Template {
  name: string;
  method: string;
  fields: Array<{
    property: string;
    constraint: string;
    value: string | number;
  }>;
}

export interface ConstraintType {
  label: string;
  valueType: "string" | "number" | "boolean" | "array" | "object";
  description: string;
}

export interface Constraint {
  type: string;
  value: string | number | boolean | object | Array<unknown>;
}

export interface PolicyField {
  property: string;
  fieldType: "Number" | "String" | "Boolean" | "Array" | "Object" | "BigInt";
  constraints: Constraint[];
  nestedFields?: PolicyField[];
  indexedElements?: Record<string, PolicyField>;
}

export interface PolicyRule {
  id: number;
  type: "allow" | "deny";
  name: string;
  method: string;
  chain: string;
  fields: PolicyField[];
  argsField?: PolicyField | null;
}

export interface PolicyObject {
  allow: Array<Record<string, unknown>>;
  deny: Array<Record<string, unknown>>;
}

export interface SchemaObject {
  nestedFields: PolicyField[];
}

export interface FieldTypeData {
  label: string;
  icon: string;
  defaultConstraints: string[];
  allowedConstraints: string[];
  hasAdditionalFields: boolean;
}

export interface ConstraintCategory {
  label: string;
  constraints: string[];
}
