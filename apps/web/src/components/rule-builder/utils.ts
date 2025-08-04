import type { PolicyObject, PolicyRule, PolicyField } from "./types";
import { FIELD_TYPES } from "./constants";

export const setNestedProperty = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const keys = path.split(/[.\[\]]/).filter(Boolean);
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const finalKey = keys[keys.length - 1];
  if (value === undefined) {
    delete current[finalKey];
  } else {
    current[finalKey] = value;
  }
};

export const cleanEmptyObjects = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanEmptyObjects)
      .filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          (typeof item !== "object" || Object.keys(item as object).length > 0),
      );
  }

  if (obj && typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanEmptyObjects(value);
      if (
        cleanedValue !== null &&
        cleanedValue !== undefined &&
        (typeof cleanedValue !== "object" ||
          Object.keys(cleanedValue as object).length > 0)
      ) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
};

export const cleanInvalidProperties = (policy: PolicyObject): PolicyObject => {
  const cleaned: PolicyObject = { allow: [], deny: [] };

  (["allow", "deny"] as const).forEach((type) => {
    cleaned[type] = (policy[type] || []).map((rule) => {
      const cleanedRule = { ...rule };
      const method = String(rule.method || "");

      if (method === "signMessage") {
        if (cleanedRule.decoded) {
          delete cleanedRule.decoded;
        }
      } else {
        if (cleanedRule.payload) {
          delete cleanedRule.payload;
        }
      }

      return cleanedRule;
    });
  });

  return cleaned;
};

export const getDefaultConstraintForFieldType = (
  fieldType: PolicyField["fieldType"],
): string => {
  switch (fieldType) {
    case "Number":
      return "numericEq";
    case "String":
      return "const";
    case "Boolean":
      return "const";
    case "BigInt":
      return "bigIntEq";
    case "Array":
      return "type";
    case "Object":
      return "type";
    default:
      return "const";
  }
};

export const getAvailableFieldTypes = (method: string): string[] => {
  const baseFields = Object.keys(FIELD_TYPES);
  const availableFields = [...baseFields];

  if (method === "signTransaction") {
    availableFields.push("ARGS");
  }

  return availableFields;
};

export const canAddIndexedElement = (field: PolicyField): boolean => {
  if (field.fieldType !== "Array") return false;

  const currentElementCount = Object.keys(field.indexedElements || {}).length;
  const lengthEqConstraint = field.constraints.find(
    (c) => c.type === "lengthEq",
  );
  const maxLengthConstraint = field.constraints.find(
    (c) => c.type === "maxLength",
  );

  if (lengthEqConstraint && typeof lengthEqConstraint.value === "number") {
    return currentElementCount < lengthEqConstraint.value;
  }

  if (maxLengthConstraint && typeof maxLengthConstraint.value === "number") {
    return currentElementCount < maxLengthConstraint.value;
  }

  return true;
};

export const canRemoveIndexedElement = (field: PolicyField): boolean => {
  if (field.fieldType !== "Array") return true;

  const currentElementCount = Object.keys(field.indexedElements || {}).length;
  const lengthEqConstraint = field.constraints.find(
    (c) => c.type === "lengthEq",
  );
  const minLengthConstraint = field.constraints.find(
    (c) => c.type === "minLength",
  );

  if (lengthEqConstraint && typeof lengthEqConstraint.value === "number") {
    return currentElementCount > lengthEqConstraint.value;
  }

  if (minLengthConstraint && typeof minLengthConstraint.value === "number") {
    return currentElementCount > minLengthConstraint.value;
  }

  return true;
};

export const getLengthValidationMessage = (
  field: PolicyField,
): string | null => {
  if (field.fieldType !== "Array") return null;

  const currentElementCount = Object.keys(field.indexedElements || {}).length;
  const lengthEqConstraint = field.constraints.find(
    (c) => c.type === "lengthEq",
  );
  const maxLengthConstraint = field.constraints.find(
    (c) => c.type === "maxLength",
  );

  if (lengthEqConstraint && typeof lengthEqConstraint.value === "number") {
    if (currentElementCount >= lengthEqConstraint.value) {
      return `Array length is fixed at ${lengthEqConstraint.value} elements. Cannot add more.`;
    }
  }

  if (maxLengthConstraint && typeof maxLengthConstraint.value === "number") {
    if (currentElementCount >= maxLengthConstraint.value) {
      return `Maximum array length is ${maxLengthConstraint.value} elements. Cannot add more.`;
    }
  }

  return null;
};

export const createNewField = (fieldType: string): PolicyField => {
  return {
    property: "",
    fieldType: fieldType as PolicyField["fieldType"],
    constraints: fieldType === "Array" ? [{ type: "lengthEq", value: 1 }] : [],
    nestedFields: fieldType === "Object" ? [] : undefined,
    indexedElements: fieldType === "Array" ? {} : undefined,
  };
};

export const createNewRule = (
  type: "allow" | "deny",
  existingRules: PolicyRule[],
): PolicyRule => {
  return {
    id: Date.now(),
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${existingRules.filter((r) => r.type === type).length + 1}`,
    method: "",
    chain: "",
    fields: [],
  };
};
