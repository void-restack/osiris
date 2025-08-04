import React, { useState, useEffect, useCallback, type ChangeEvent, type JSX } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Minus, ChevronDown, ChevronUp, Trash2, CircleMinus } from 'lucide-react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { githubLight } from "@uiw/codemirror-theme-github"
import { Icon } from './ui/icon';

const myFontTheme = EditorView.theme({
  '&': {
    fontFamily: '"Geist Mono", monospace',
    fontSize: '16px',
    lineHeight: '1.6'
  },
  '.cm-content': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-gutters': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-lineNumbers': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-line': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-scroller': {
    fontFamily: '"Geist Mono", monospace'
  },
  '.cm-tooltip': {
    fontFamily: '"Geist Mono", monospace'
  }
});

interface Template {
  name: string;
  method: string;
  fields: Array<{
    property: string;
    constraint: string;
    value: string | number;
  }>;
}

interface ConstraintType {
  label: string;
  valueType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
}

interface Constraint {
  type: string;
  value: string | number | boolean | object | Array<unknown>;
}

interface PolicyField {
  property: string;
  fieldType: 'Number' | 'String' | 'Boolean' | 'Array' | 'Object' | 'BigInt';
  constraints: Constraint[];
  nestedFields?: PolicyField[]; // Only for Object types
  indexedElements?: Record<string, PolicyField>; // Only for Array types - indexed elements like "0", "1", "2"
}



interface PolicyRule {
  id: number;
  type: 'allow' | 'deny';
  name: string;
  method: string;
  chain: string;
  fields: PolicyField[];
  argsField?: PolicyField | null; // Array field for arguments
}

interface PolicyObject {
  allow: Array<Record<string, unknown>>;
  deny: Array<Record<string, unknown>>;
}

const TEMPLATES: Record<string, Template> = {
  'uniswap-v3-swap': {
    name: 'Uniswap V3 Swap (DeFi)',
    method: 'signTransaction',
    fields: [
      { property: 'functionName', constraint: 'const', value: 'exactInputSingle' },
      { property: 'to', constraint: 'addressEq', value: '0xE592427A0AEce92De3Edee1F18E0157C05861564' }
    ]
  },
  'erc20-transfer': {
    name: 'ERC20 Transfer',
    method: 'signTransaction',
    fields: [
      { property: 'functionName', constraint: 'const', value: 'transfer' }
    ]
  },
  'erc20-approve': {
    name: 'ERC20 Approve',
    method: 'signTransaction',
    fields: [
      { property: 'functionName', constraint: 'const', value: 'approve' }
    ]
  },
  'erc20-approve-with-args': {
    name: 'ERC20 Approve with Args Validation',
    method: 'signTransaction',
    fields: [
      { property: 'functionName', constraint: 'const', value: 'approve' }
    ]
  },
  'conditional-transaction': {
    name: 'Conditional Transaction (anyOf Example)',
    method: 'signTransaction',
    fields: [
      { property: 'functionName', constraint: 'const', value: 'transfer' }
    ]
  }
};

const CONSTRAINT_TYPES: Record<string, ConstraintType> = {
  // Basic
  const: { label: 'const', valueType: 'string', description: 'Exact value match' },
  eq: { label: 'eq', valueType: 'string', description: 'Equality (alias for const)' },
  enum: { label: 'enum', valueType: 'array', description: 'One of multiple values' },
  type: { label: 'type', valueType: 'string', description: 'JSON Schema type' },
  required: { label: 'required', valueType: 'boolean', description: 'Field is required' },

  // Logical
  anyOf: { label: 'anyOf', valueType: 'array', description: 'Match any of these schemas' },
  allOf: { label: 'allOf', valueType: 'array', description: 'Match all of these schemas' },
  oneOf: { label: 'oneOf', valueType: 'array', description: 'Match exactly one schema' },
  not: { label: 'not', valueType: 'object', description: 'Must not match this schema' },

  // Numeric (legacy JSON Schema)
  minimum: { label: 'minimum', valueType: 'number', description: 'Minimum value' },
  maximum: { label: 'maximum', valueType: 'number', description: 'Maximum value' },
  min: { label: 'min', valueType: 'number', description: 'Minimum value (alias)' },
  max: { label: 'max', valueType: 'number', description: 'Maximum value (alias)' },
  lt: { label: 'lt', valueType: 'number', description: 'Less than' },
  lte: { label: 'lte', valueType: 'number', description: 'Less than or equal' },
  gt: { label: 'gt', valueType: 'number', description: 'Greater than' },
  gte: { label: 'gte', valueType: 'number', description: 'Greater than or equal' },

  // Custom numeric constraints
  numericMin: { label: 'numericMin', valueType: 'number', description: 'Numeric minimum' },
  numericMax: { label: 'numericMax', valueType: 'number', description: 'Numeric maximum' },
  numericEq: { label: 'numericEq', valueType: 'number', description: 'Numeric equality' },
  numericLt: { label: 'numericLt', valueType: 'number', description: 'Numeric less than' },
  numericLte: { label: 'numericLte', valueType: 'number', description: 'Numeric less than or equal' },
  numericGt: { label: 'numericGt', valueType: 'number', description: 'Numeric greater than' },
  numericGte: { label: 'numericGte', valueType: 'number', description: 'Numeric greater than or equal' },
  '24hLimit': { label: '24hLimit', valueType: 'number', description: '24 hour spending limit' },

  // BigInt constraints
  bigIntMin: { label: 'bigIntMin', valueType: 'string', description: 'BigInt minimum' },
  bigIntMax: { label: 'bigIntMax', valueType: 'string', description: 'BigInt maximum' },
  bigIntEq: { label: 'bigIntEq', valueType: 'string', description: 'BigInt equality' },

  // Address constraints
  addressEq: { label: 'addressEq', valueType: 'string', description: 'Address equality' },
  addressInList: { label: 'addressInList', valueType: 'array', description: 'Address in list' },

  // String constraints
  stringContains: { label: 'stringContains', valueType: 'string', description: 'Contains substring' },
  stringStartsWith: { label: 'stringStartsWith', valueType: 'string', description: 'Starts with' },
  stringEndsWith: { label: 'stringEndsWith', valueType: 'string', description: 'Ends with' },
  contains: { label: 'contains', valueType: 'string', description: 'Contains (alias)' },
  startsWith: { label: 'startsWith', valueType: 'string', description: 'Starts with (alias)' },
  endsWith: { label: 'endsWith', valueType: 'string', description: 'Ends with (alias)' },
  matches: { label: 'matches', valueType: 'string', description: 'Regex pattern match' },
  inList: { label: 'inList', valueType: 'array', description: 'Value in list' },

  // String/Length
  minLength: { label: 'minLength', valueType: 'number', description: 'Minimum string length' },
  maxLength: { label: 'maxLength', valueType: 'number', description: 'Maximum string length' },
  lengthEq: { label: 'lengthEq', valueType: 'number', description: 'Exact length' },
  pattern: { label: 'pattern', valueType: 'string', description: 'Regex pattern' },

  // Boolean constraints
  is: { label: 'is', valueType: 'boolean', description: 'Boolean value check' },

  // Date constraints
  before: { label: 'before', valueType: 'string', description: 'Before date' },
  after: { label: 'after', valueType: 'string', description: 'After date' },

  // Array constraints
  containsItem: { label: 'containsItem', valueType: 'string', description: 'Contains specific item' },
  containsAny: { label: 'containsAny', valueType: 'array', description: 'Contains any of these items' },
  containsAll: { label: 'containsAll', valueType: 'array', description: 'Contains all of these items' },
  equals: { label: 'equals', valueType: 'array', description: 'Array equals exactly' },

  // Object constraints
  shape: { label: 'shape', valueType: 'object', description: 'Object shape validation' },
  hasKeys: { label: 'hasKeys', valueType: 'array', description: 'Has required keys' },
  requiredKeys: { label: 'requiredKeys', valueType: 'array', description: 'Required keys' },

  // Conditional constraints
  if: { label: 'if', valueType: 'object', description: 'If condition' },
  then: { label: 'then', valueType: 'object', description: 'Then clause' },
  else: { label: 'else', valueType: 'object', description: 'Else clause' }
};

// Constraint categories for specialized dropdowns
const CONSTRAINT_CATEGORIES = {
  BASIC: {
    label: 'Basic Constraints',
    constraints: ['const', 'eq', 'enum', 'type', 'required']
  },
  NUMERIC: {
    label: 'Numeric Constraints',
    constraints: ['numericMin', 'numericMax', 'numericEq', 'numericLt', 'numericLte', 'numericGt', 'numericGte', 'minimum', 'maximum', 'min', 'max', 'lt', 'lte', 'gt', 'gte', '24hLimit']
  },
  BIGINT: {
    label: 'BigInt Constraints',
    constraints: ['bigIntMin', 'bigIntMax', 'bigIntEq']
  },
  STRING: {
    label: 'String Constraints',
    constraints: ['stringContains', 'stringStartsWith', 'stringEndsWith', 'contains', 'startsWith', 'endsWith', 'matches', 'pattern', 'minLength', 'maxLength', 'lengthEq', 'inList']
  },
  ADDRESS: {
    label: 'Address Constraints',
    constraints: ['addressEq', 'addressInList']
  },
  BOOLEAN: {
    label: 'Boolean Constraints',
    constraints: ['is']
  },
  DATE: {
    label: 'Date Constraints',
    constraints: ['before', 'after']
  },
  ARRAY: {
    label: 'Array Constraints',
    constraints: ['containsItem', 'containsAny', 'containsAll', 'equals', 'minLength', 'maxLength', 'lengthEq']
  },
  OBJECT: {
    label: 'Object Constraints',
    constraints: ['shape', 'hasKeys', 'requiredKeys']
  },
  LOGICAL: {
    label: 'Logical Constraints',
    constraints: ['anyOf', 'allOf', 'oneOf', 'not']
  },
  CONDITIONAL: {
    label: 'Conditional Constraints',
    constraints: ['if', 'then', 'else']
  }
};

// Field type definitions for typed field creation
const FIELD_TYPES = {
  Number: {
    label: 'Number Field',
    icon: 'settings',
    defaultConstraints: ['numericEq'],
    allowedConstraints: [...CONSTRAINT_CATEGORIES.NUMERIC.constraints, ...CONSTRAINT_CATEGORIES.BASIC.constraints],
    hasAdditionalFields: false
  },
  String: {
    label: 'String Field',
    icon: 'doc',
    defaultConstraints: ['const'],
    allowedConstraints: [...CONSTRAINT_CATEGORIES.STRING.constraints, ...CONSTRAINT_CATEGORIES.BASIC.constraints, ...CONSTRAINT_CATEGORIES.ADDRESS.constraints, ...CONSTRAINT_CATEGORIES.DATE.constraints],
    hasAdditionalFields: false
  },
  Boolean: {
    label: 'Boolean Field',
    icon: 'check',
    defaultConstraints: ['const'],
    allowedConstraints: [...CONSTRAINT_CATEGORIES.BOOLEAN.constraints, ...CONSTRAINT_CATEGORIES.BASIC.constraints],
    hasAdditionalFields: false
  },
  BigInt: {
    label: 'BigInt Field',
    icon: 'settings',
    defaultConstraints: ['bigIntEq'],
    allowedConstraints: [...CONSTRAINT_CATEGORIES.BIGINT.constraints, ...CONSTRAINT_CATEGORIES.BASIC.constraints],
    hasAdditionalFields: false
  },
  Array: {
    label: 'Array Field',
    icon: 'file',
    defaultConstraints: ['lengthEq'],
    allowedConstraints: [...CONSTRAINT_CATEGORIES.ARRAY.constraints, ...CONSTRAINT_CATEGORIES.BASIC.constraints],
    hasAdditionalFields: true
  },
  Object: {
    label: 'Object Field',
    icon: 'code',
    defaultConstraints: ['type'],
    allowedConstraints: [...CONSTRAINT_CATEGORIES.OBJECT.constraints, ...CONSTRAINT_CATEGORIES.LOGICAL.constraints, ...CONSTRAINT_CATEGORIES.CONDITIONAL.constraints, ...CONSTRAINT_CATEGORIES.BASIC.constraints],
    hasAdditionalFields: true
  }
};



const setNestedProperty = (obj: Record<string, unknown>, path: string, value: unknown): void => {
  const keys = path.split(/[.\[\]]/).filter(Boolean);
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (!(key in current)) {
      current[key] = {}; // Always create objects, never arrays for nested properties
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

const cleanEmptyObjects = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(cleanEmptyObjects).filter(item =>
      item !== null && item !== undefined &&
      (typeof item !== 'object' || Object.keys(item as object).length > 0)
    );
  }

  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanEmptyObjects(value);
      if (cleanedValue !== null && cleanedValue !== undefined &&
        (typeof cleanedValue !== 'object' || Object.keys(cleanedValue as object).length > 0)) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
};

interface SchemaObject {
  nestedFields: PolicyField[];
}

interface SchemaObjectEditorProps {
  schemaObj: SchemaObject;
  onChange: (obj: SchemaObject) => void;
  onRemove: () => void;
}

interface ConstraintInputProps {
  constraint: Constraint;
  onChange: (constraint: Constraint) => void;
  onRemove: () => void;
  canRemove?: boolean;
}



interface PolicyFieldProps {
  field: PolicyField;
  onChange: (field: PolicyField) => void;
  onRemove: () => void;
}

interface PolicyRuleProps {
  rule: PolicyRule;
  onChange: (rule: PolicyRule) => void;
  onRemove: () => void;
}

interface CategorizedDropdownProps {
  type: 'field' | 'constraint';
  onSelect: (value: string) => void;
  allowedConstraints?: string[];
  availableFieldTypes?: string[];
  buttonText?: string;
  buttonClassName?: string;
}

const CategorizedDropdown: React.FC<CategorizedDropdownProps> = ({
  type,
  onSelect,
  allowedConstraints,
  availableFieldTypes,
  buttonText = "Add",
  buttonClassName = ""
}) => {
  const renderFieldTypeOptions = () => {
    const fieldsToShow = availableFieldTypes || Object.keys(FIELD_TYPES);

    return fieldsToShow.map((key) => {
      if (key === 'ARGS') {
        return (
          <DropdownMenuItem key={key} onClick={() => onSelect(key)}>
            <Icon name="file" className="h-4 w-4 mr-2" />
            Add Args
          </DropdownMenuItem>
        );
      }

      const fieldType = FIELD_TYPES[key as keyof typeof FIELD_TYPES];
      if (!fieldType) return null;

      return (
        <DropdownMenuItem key={key} onClick={() => onSelect(key)}>
          <Icon name={fieldType.icon as any} className="h-4 w-4 mr-2" />
          {fieldType.label}
        </DropdownMenuItem>
      );
    }).filter(Boolean);
  };

  const renderConstraintCategoryOptions = () => {
    if (allowedConstraints && allowedConstraints.length > 0) {
      // Show only allowed constraints for typed fields (flat list of specific constraints)
      return allowedConstraints.map(constraintKey => (
        <DropdownMenuItem key={constraintKey} onClick={() => onSelect(constraintKey)}>
          <Plus className="h-4 w-4 mr-2" />
          {CONSTRAINT_TYPES[constraintKey]?.label || constraintKey}
        </DropdownMenuItem>
      ));
    }

    // Show categorized constraint menu for generic fields
    return Object.entries(CONSTRAINT_CATEGORIES).map(([categoryKey, category]) => (
      <DropdownMenuItem key={categoryKey} onClick={() => onSelect(categoryKey)}>
        <Plus className="h-4 w-4 mr-2" />
        {category.label}
      </DropdownMenuItem>
    ));
  };



  const getButtonContent = () => {
    if (type === 'field') {
      return (
        <>
          <div className='flex w-full items-center font-normal text-sm'>
            <Plus className="size-4 mr-1" />
            {buttonText}
          </div>
          <ChevronDown className="h-4 w-4 ml-1 text-primary-300" />
        </>
      );
    }

    return (
      <>
        <Plus className="h-4 w-4 mr-1" />
        {buttonText}
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={type === 'field' ? "outline2" : "outline2"}
          size={type === 'field' ? "sm" : "xs"}
          className={`${type === 'field' ? 'w-full h-10 justify-between' : 'text-xs text-primary-400'} ${buttonClassName}`}
        >
          {getButtonContent()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={type === 'field' ? "center" : "end"} className={type === 'field' ? 'w-full min-w-[var(--radix-dropdown-menu-trigger-width)]' : ''}>
        {type === 'field' && renderFieldTypeOptions()}
        {type === 'constraint' && renderConstraintCategoryOptions()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SchemaObjectEditor: React.FC<SchemaObjectEditorProps> = ({ schemaObj, onChange, onRemove }) => {
  const { nestedFields = [] } = schemaObj;

  // Nested field management
  const addNestedField = (fieldType: string): void => {
    const fieldTypeKey = fieldType as keyof typeof FIELD_TYPES;
    const fieldTypeData = FIELD_TYPES[fieldTypeKey];

    const newField: PolicyField = {
      property: '',
      fieldType: fieldType as PolicyField['fieldType'],
      constraints: fieldType === 'Array' ? [{ type: 'lengthEq', value: 1 }] : [],
      nestedFields: fieldType === 'Object' ? [] : undefined,
      indexedElements: fieldType === 'Array' ? {} : undefined
    };

    onChange({
      ...schemaObj,
      nestedFields: [...nestedFields, newField]
    });
  };

  const updateNestedField = (index: number, field: PolicyField): void => {
    const newNestedFields = [...nestedFields];
    newNestedFields[index] = field;
    onChange({ ...schemaObj, nestedFields: newNestedFields });
  };

  const removeNestedField = (index: number): void => {
    const newNestedFields = [...nestedFields];
    newNestedFields.splice(index, 1);
    onChange({ ...schemaObj, nestedFields: newNestedFields });
  };

  return (
    <div className="space-y-4 p-4 border-2 border-primary-200 rounded-lg bg-primary-25 animate-in slide-in-from-top-2 fade-in-0 duration-300 ease-out">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon name="code" className="h-4 w-4 text-primary-600" />
          <Label className="text-sm font-medium text-primary-800">Schema Option</Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:bg-red-100">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Schema Fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-primary-700">Schema Fields</Label>
          <CategorizedDropdown
            type="field"
            onSelect={addNestedField}
            buttonText="Add Field"
            buttonClassName="text-xs"
          />
        </div>

        {nestedFields.length > 0 ? (
          <div className="space-y-3">
            {nestedFields.map((field, index) => (
              <PolicyFieldComponent
                key={index}
                field={field}
                onChange={(updatedField) => updateNestedField(index, updatedField as PolicyField)}
                onRemove={() => removeNestedField(index)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-4 border-2 border-dashed border-primary-300 rounded-md bg-white">
            <Icon name="file" className="h-6 w-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-primary-500">
              No fields defined for this schema option
            </p>
            <p className="text-xs text-primary-400 mt-1">
              Add fields to define what this schema should validate
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ConstraintInput: React.FC<ConstraintInputProps> = ({ constraint, onChange, onRemove, canRemove = true }) => {
  const constraintType = CONSTRAINT_TYPES[constraint.type] || CONSTRAINT_TYPES.const;

  const handleValueChange = (newValue: string | number | boolean | object | Array<unknown>): void => {
    let processedValue = newValue;

    if (constraintType.valueType === 'number') {
      processedValue = newValue === '' ? '' : Number(newValue);
    } else if (constraintType.valueType === 'array') {
      if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
        // Keep as-is for schema arrays
        processedValue = newValue;
      } else {
        // Regular array handling
        processedValue = typeof newValue === 'string'
          ? newValue.split(',').map(v => v.trim()).filter(Boolean)
          : newValue;
      }
    }

    onChange({ ...constraint, value: processedValue });
  };

  const renderValueInput = (withCombinedLayout = false): JSX.Element => {
    if (constraintType.valueType === 'array' && ['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
      // Convert existing JSON to SchemaObject format with nested fields
      const rawArray = Array.isArray(constraint.value) ? constraint.value : [];
      const schemaArray: SchemaObject[] = rawArray.map(item => {
        if (item && typeof item === 'object' && 'nestedFields' in item) {
          // Already in new format
          return item as SchemaObject;
        } else {
          // Convert from JSON object to nested fields
          const nestedFields: PolicyField[] = [];
          const obj = (item as Record<string, unknown>) || {};

          Object.entries(obj).forEach(([key, value]) => {
            if (key && value !== undefined && value !== null && value !== '') {
              // Determine field type based on value
              let fieldType: PolicyField['fieldType'] = 'String';
              let constraints: Constraint[] = [];

              if (typeof value === 'object' && !Array.isArray(value)) {
                // Value has constraints
                const constraintObj = value as Record<string, unknown>;
                const constraintKeys = Object.keys(constraintObj);

                constraints = constraintKeys
                  .filter(k => CONSTRAINT_TYPES[k])
                  .map(k => ({
                    type: k,
                    value: constraintObj[k] as string | number | boolean | object | Array<unknown>
                  }));

                // Infer field type from constraint type
                if (constraints.some(c => c.type.includes('numeric') || c.type.includes('Min') || c.type.includes('Max') || ['min', 'max', 'lt', 'lte', 'gt', 'gte', 'minimum', 'maximum', '24hLimit'].includes(c.type))) {
                  fieldType = 'Number';
                } else if (constraints.some(c => c.type.includes('bigInt'))) {
                  fieldType = 'BigInt';
                } else if (constraints.some(c => c.type.includes('address'))) {
                  fieldType = 'String';
                } else if (constraints.some(c => c.type.includes('string') || ['contains', 'startsWith', 'endsWith', 'matches', 'pattern', 'inList', 'before', 'after'].includes(c.type))) {
                  fieldType = 'String';
                } else if (constraints.some(c => ['is'].includes(c.type))) {
                  fieldType = 'Boolean';
                } else if (constraints.some(c => ['containsItem', 'containsAny', 'containsAll', 'equals'].includes(c.type))) {
                  fieldType = 'Array';
                } else if (constraints.some(c => ['lengthEq', 'minLength', 'maxLength'].includes(c.type))) {
                  // Length constraints could be for strings or arrays - default to Array for backward compatibility
                  fieldType = 'Array';
                } else if (constraints.some(c => ['shape', 'hasKeys', 'requiredKeys'].includes(c.type))) {
                  fieldType = 'Object';
                } else if (constraints.some(c => ['anyOf', 'allOf', 'oneOf', 'not', 'if', 'then', 'else', 'type'].includes(c.type))) {
                  fieldType = 'Object';
                }
              } else {
                // Direct value
                if (typeof value === 'number') {
                  fieldType = 'Number';
                  constraints = [{ type: 'const', value }];
                } else if (typeof value === 'boolean') {
                  fieldType = 'Boolean';
                  constraints = [{ type: 'const', value }];
                } else {
                  fieldType = 'String';
                  constraints = [{ type: 'const', value }];
                }
              }

              nestedFields.push({
                property: key,
                fieldType,
                constraints,
                nestedFields: fieldType === 'Object' ? [] : undefined,
                indexedElements: fieldType === 'Array' ? {} : undefined
              });
            }
          });

          return { nestedFields };
        }
      });

      return (
        <div className="space-y-3">
          {schemaArray.map((schemaObj, index) => (
            <SchemaObjectEditor
              key={index}
              schemaObj={schemaObj}
              onChange={(newObj: SchemaObject) => {
                const newArray = [...schemaArray];
                newArray[index] = newObj;
                handleValueChange(newArray);
              }}
              onRemove={() => {
                const newArray = [...schemaArray];
                newArray.splice(index, 1);
                handleValueChange(newArray);
              }}
            />
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleValueChange([...schemaArray, { nestedFields: [] }])}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Schema Option
          </Button>
        </div>
      );
    }

    if (constraintType.valueType === 'array') {
      const displayValue = Array.isArray(constraint.value)
        ? (constraint.value as Array<string>).join(', ')
        : String(constraint.value || '');

      const textareaElement = (
        <Textarea
          placeholder="value1, value2, value3"
          value={displayValue}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleValueChange(e.target.value)}
          className={withCombinedLayout ? "min-h-[40px] resize-none -me-px flex-1 rounded-e-none shadow-none focus-visible:z-10" : "min-h-[40px] resize-none"}
        />
      );

      if (withCombinedLayout && canRemove) {
        return (
          <div className="flex rounded-md shadow-xs">
            {textareaElement}
            <button
              className="border-primary-100 bg-red-50 text-danger-600 focus-visible:border-danger-200 focus-visible:ring-danger-200 inline-flex w-9 items-center justify-center rounded-e-md border text-sm outline-none focus:z-10 focus-visible:ring-[2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-100 transition-all duration-200"
              aria-label="Remove constraint"
              onClick={onRemove}
            >
              <CircleMinus size={16} aria-hidden="true" />
            </button>
          </div>
        );
      }

      return textareaElement;
    }

    if (constraintType.valueType === 'object') {
      const displayValue = typeof constraint.value === 'string'
        ? constraint.value
        : JSON.stringify(constraint.value, null, 2);

      const textareaElement = (
        <Textarea
          placeholder="JSON object"
          value={displayValue}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleValueChange(parsed);
            } catch {
              handleValueChange(e.target.value);
            }
          }}
          className={withCombinedLayout ? "min-h-[60px] resize-none font-mono text-sm -me-px flex-1 rounded-e-none shadow-none focus-visible:z-10" : "min-h-[60px] resize-none font-mono text-sm"}
        />
      );

      if (withCombinedLayout && canRemove) {
        return (
          <div className="flex rounded-md shadow-xs">
            {textareaElement}
            <button
              className="border-primary-100 bg-red-50 text-danger-600 focus-visible:border-danger-200 focus-visible:ring-danger-200 inline-flex w-9 items-center justify-center rounded-e-md border text-sm outline-none focus:z-10 focus-visible:ring-[2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-100 transition-all duration-200"
              aria-label="Remove constraint"
              onClick={onRemove}
            >
              <CircleMinus size={16} aria-hidden="true" />
            </button>
          </div>
        );
      }

      return textareaElement;
    }

    const inputElement = (
      <Input
        type={constraintType.valueType === 'number' ? 'number' : 'text'}
        placeholder={constraintType.valueType === 'number' ? '0' : 'Enter value'}
        value={String(constraint.value || '')}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
        className={withCombinedLayout ? "-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10" : ""}
      />
    );

    if (withCombinedLayout && canRemove) {
      return (
        <div className="flex rounded-md shadow-xs">
          {inputElement}
          <button
            className="border-primary-100 bg-red-50 text-danger-600 focus-visible:border-danger-200 focus-visible:ring-danger-200 inline-flex w-9 items-center justify-center rounded-e-md border text-sm outline-none focus:z-10 focus-visible:ring-[2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-100 transition-all duration-200"
            aria-label="Remove constraint"
            onClick={onRemove}
          >
            <CircleMinus size={16} aria-hidden="true" />
          </button>
        </div>
      );
    }

    return inputElement;
  };

  const handleTypeChange = (type: string): void => {
    const newConstraintType = CONSTRAINT_TYPES[type];
    const initialValue = newConstraintType?.valueType === 'number' ? 0 : '';
    onChange({ type, value: initialValue });
  };

  return (
    <div className="space-y-2 animate-in slide-in-from-top-1 fade-in-0 duration-200 ease-out">
      <div className="grid grid-cols-2 gap-2">
        <Select value={constraint.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="transition-all duration-200 hover:border-primary-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONSTRAINT_TYPES).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!['anyOf', 'allOf', 'oneOf'].includes(constraint.type) && (
          <div className="col-span-1 animate-in slide-in-from-right-1 fade-in-0 duration-200 ease-out">
            {renderValueInput(true)}
          </div>
        )}
      </div>

      {['anyOf', 'allOf', 'oneOf'].includes(constraint.type) && (
        <div className="mt-2 animate-in slide-in-from-top-1 fade-in-0 duration-300 ease-out">
          {renderValueInput(false)}
        </div>
      )}
    </div>
  );
};



const PolicyFieldComponent: React.FC<PolicyFieldProps> = ({ field, onChange, onRemove }) => {

  const policyField = field as PolicyField;
  const fieldTypeData = FIELD_TYPES[policyField.fieldType];
  const hasAdditionalFields = fieldTypeData?.hasAdditionalFields || false;

  const addConstraint = (constraintType?: string): void => {
    // Choose a sensible default constraint type based on field type
    const defaultConstraintType = constraintType || getDefaultConstraintForFieldType(policyField.fieldType);
    const initialValue = CONSTRAINT_TYPES[defaultConstraintType]?.valueType === 'number' ? 0 : '';

    onChange({
      ...policyField,
      constraints: [...policyField.constraints, { type: defaultConstraintType, value: initialValue }]
    });
  };

  const getDefaultConstraintForFieldType = (fieldType: PolicyField['fieldType']): string => {
    switch (fieldType) {
      case 'Number': return 'numericEq';
      case 'String': return 'const';
      case 'Boolean': return 'const';
      case 'BigInt': return 'bigIntEq';
      case 'Array': return 'type';
      case 'Object': return 'type';
      default: return 'const';
    }
  };

  const handleConstraintSelection = (selection: string): void => {
    // For typed fields, we get specific constraint types directly
    if (fieldTypeData?.allowedConstraints.includes(selection)) {
      addConstraint(selection);
    }
    // For generic fields, we might get category selections
    else if (CONSTRAINT_CATEGORIES[selection as keyof typeof CONSTRAINT_CATEGORIES]) {
      // If it's a category, add the first constraint from that category
      const category = CONSTRAINT_CATEGORIES[selection as keyof typeof CONSTRAINT_CATEGORIES];
      const firstConstraint = category.constraints[0];
      addConstraint(firstConstraint);
    } else {
      // It's a specific constraint type (fallback)
      addConstraint(selection);
    }
  };

  const updateConstraint = (index: number, constraint: Constraint): void => {
    const newConstraints = [...policyField.constraints];
    newConstraints[index] = constraint;
    onChange({ ...policyField, constraints: newConstraints });
  };

  const removeConstraint = (index: number): void => {
    const newConstraints = [...policyField.constraints];
    newConstraints.splice(index, 1);
    onChange({ ...policyField, constraints: newConstraints });
  };

  // Nested field management (for Object fields)
  const addNestedField = (fieldType: string): void => {
    if (policyField.fieldType !== 'Object') return;

    const fieldTypeKey = fieldType as keyof typeof FIELD_TYPES;
    const nestedFieldType = FIELD_TYPES[fieldTypeKey];

    const newField: PolicyField = {
      property: '',
      fieldType: fieldType as PolicyField['fieldType'],
      constraints: fieldType === 'Array' ? [{ type: 'lengthEq', value: 1 }] : [],
      nestedFields: fieldType === 'Object' ? [] : undefined,
      indexedElements: fieldType === 'Array' ? {} : undefined
    };

    onChange({
      ...policyField,
      nestedFields: [...(policyField.nestedFields || []), newField]
    });
  };

  // Helper function to check if we can add more indexed elements
  const canAddIndexedElement = (): boolean => {
    if (policyField.fieldType !== 'Array') return false;

    const currentElementCount = Object.keys(policyField.indexedElements || {}).length;

    // Check length constraints
    const lengthEqConstraint = policyField.constraints.find(c => c.type === 'lengthEq');
    const maxLengthConstraint = policyField.constraints.find(c => c.type === 'maxLength');

    if (lengthEqConstraint && typeof lengthEqConstraint.value === 'number') {
      return currentElementCount < lengthEqConstraint.value;
    }

    if (maxLengthConstraint && typeof maxLengthConstraint.value === 'number') {
      return currentElementCount < maxLengthConstraint.value;
    }

    return true; // No length constraints, allow adding
  };

  const getLengthValidationMessage = (): string | null => {
    if (policyField.fieldType !== 'Array') return null;

    const currentElementCount = Object.keys(policyField.indexedElements || {}).length;

    const lengthEqConstraint = policyField.constraints.find(c => c.type === 'lengthEq');
    const maxLengthConstraint = policyField.constraints.find(c => c.type === 'maxLength');

    if (lengthEqConstraint && typeof lengthEqConstraint.value === 'number') {
      if (currentElementCount >= lengthEqConstraint.value) {
        return `Array length is fixed at ${lengthEqConstraint.value} elements. Cannot add more.`;
      }
    }

    if (maxLengthConstraint && typeof maxLengthConstraint.value === 'number') {
      if (currentElementCount >= maxLengthConstraint.value) {
        return `Maximum array length is ${maxLengthConstraint.value} elements. Cannot add more.`;
      }
    }

    return null;
  };

  // Indexed element management (for Array fields)
  const addIndexedElement = (fieldType: string): void => {
    if (policyField.fieldType !== 'Array' || !canAddIndexedElement()) return;

    const fieldTypeKey = fieldType as keyof typeof FIELD_TYPES;
    const fieldTypeData = FIELD_TYPES[fieldTypeKey];

    // Find next available index
    const existingIndexes = Object.keys(policyField.indexedElements || {}).map(Number);
    const nextIndex = existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 0;

    const newIndexedElement: PolicyField = {
      property: nextIndex.toString(),
      fieldType: fieldType as PolicyField['fieldType'],
      constraints: fieldType === 'Array' ? [{ type: 'lengthEq', value: 1 }] : [],
      nestedFields: fieldType === 'Object' ? [] : undefined,
      indexedElements: fieldType === 'Array' ? {} : undefined
    };

    onChange({
      ...policyField,
      indexedElements: {
        ...(policyField.indexedElements || {}),
        [nextIndex]: newIndexedElement
      }
    });
  };

  const updateNestedField = (index: number, nestedField: PolicyField): void => {
    const newNestedFields = [...(policyField.nestedFields || [])];
    newNestedFields[index] = nestedField;
    onChange({ ...policyField, nestedFields: newNestedFields });
  };

  const removeNestedField = (index: number): void => {
    const newNestedFields = [...(policyField.nestedFields || [])];
    newNestedFields.splice(index, 1);
    onChange({ ...policyField, nestedFields: newNestedFields });
  };

  const updateIndexedElement = (index: string, element: PolicyField): void => {
    onChange({
      ...policyField,
      indexedElements: {
        ...(policyField.indexedElements || {}),
        [index]: element
      }
    });
  };

  const canRemoveIndexedElement = (): boolean => {
    if (policyField.fieldType !== 'Array') return true;

    const currentElementCount = Object.keys(policyField.indexedElements || {}).length;

    // Check minimum length constraints
    const lengthEqConstraint = policyField.constraints.find(c => c.type === 'lengthEq');
    const minLengthConstraint = policyField.constraints.find(c => c.type === 'minLength');

    if (lengthEqConstraint && typeof lengthEqConstraint.value === 'number') {
      return currentElementCount > lengthEqConstraint.value;
    }

    if (minLengthConstraint && typeof minLengthConstraint.value === 'number') {
      return currentElementCount > minLengthConstraint.value;
    }

    return true; // No minimum length constraints, allow removal
  };

  const removeIndexedElement = (index: string): void => {
    if (!canRemoveIndexedElement()) return;

    const newIndexedElements = { ...(policyField.indexedElements || {}) };
    delete newIndexedElements[index];
    onChange({ ...policyField, indexedElements: newIndexedElements });
  };

  return (
    <div className="space-y-3 p-4 border border-primary-200 rounded-lg bg-white animate-in slide-in-from-top-2 fade-in-0 duration-300 ease-out">
      {/* Field Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={(fieldTypeData?.icon as any) || 'settings'} className="h-4 w-4 text-primary-600" />
          <Label className="text-sm font-medium text-primary-800">
            {fieldTypeData?.label || policyField.fieldType}
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:bg-red-100">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Property Path */}
      <div className="space-y-1">
        {/^\d+$/.test(policyField.property || '') ? (
          // Indexed element - show read-only index
          <>
            <Label className="text-[13px] text-primary-300">Array index</Label>
            <Input
              value={`[${policyField.property}]`}
              readOnly
              className="text-sm bg-blue-25 text-blue-700 border-blue-200"
            />
          </>
        ) : (
          // Regular field - show editable property path
          <>
            <Label className="text-[13px] text-primary-300">Property path</Label>
            <Input
              placeholder="e.g., functionName, to, value, tokenIn"
              value={policyField.property || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...policyField, property: e.target.value })}
              className="text-sm"
            />
          </>
        )}
      </div>

      {/* Field-level Constraints */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Field Constraints</Label>
          <CategorizedDropdown
            type="constraint"
            onSelect={handleConstraintSelection}
            buttonText="Add Constraint"
            allowedConstraints={fieldTypeData?.allowedConstraints}
          />
        </div>

        {policyField.constraints.length > 0 ? (
          policyField.constraints.map((constraint, index) => (
            <ConstraintInput
              key={index}
              constraint={constraint}
              onChange={(c: Constraint) => updateConstraint(index, c)}
              onRemove={() => removeConstraint(index)}
              canRemove={true} // Always allow removing constraints
            />
          ))
        ) : (
          <div className="text-center p-3 border-2 border-dashed border-primary-200 rounded-md bg-primary-25">
            <p className="text-sm text-primary-400">
              No constraints defined. Add constraints only if you need to validate this field.
            </p>
          </div>
        )}
      </div>

      {/* Object Nested Fields */}
      {policyField.fieldType === 'Object' && (
        <div className="space-y-3 pt-3 border-t border-primary-100">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Object Properties</Label>
            <CategorizedDropdown
              type="field"
              onSelect={addNestedField}
              buttonText="Add Property"
              buttonClassName="text-xs"
            />
          </div>

          {policyField.nestedFields && policyField.nestedFields.length > 0 ? (
            <div className="space-y-3 pl-4 border-l-2 border-green-200">
              {policyField.nestedFields.map((nestedField, index) => (
                <PolicyFieldComponent
                  key={index}
                  field={nestedField}
                  onChange={(updatedField) => updateNestedField(index, updatedField as PolicyField)}
                  onRemove={() => removeNestedField(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-4 border-2 border-dashed border-primary-200 rounded-md bg-primary-25">
              <p className="text-sm text-primary-400">
                No properties defined for this object
              </p>
            </div>
          )}
        </div>
      )}

      {/* Array Indexed Elements */}
      {policyField.fieldType === 'Array' && (
        <div className="space-y-3 pt-3 border-t border-primary-100">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Array Elements</Label>
            {canAddIndexedElement() ? (
              <CategorizedDropdown
                type="field"
                onSelect={addIndexedElement}
                buttonText="Add Element"
                buttonClassName="text-xs"
              />
            ) : (
              <div className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-xs opacity-50 cursor-not-allowed"
                >
                  Add Element
                </Button>
                {getLengthValidationMessage() && (
                  <p className="text-xs text-red-600 mt-1 max-w-48">
                    {getLengthValidationMessage()}
                  </p>
                )}
              </div>
            )}
          </div>

          {policyField.indexedElements && Object.keys(policyField.indexedElements).length > 0 ? (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              {Object.entries(policyField.indexedElements)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([index, element]) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg bg-blue-25">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-blue-800">Element [{index}]</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndexedElement(index)}
                        disabled={!canRemoveIndexedElement()}
                        className={canRemoveIndexedElement()
                          ? "text-red-600 hover:bg-red-100"
                          : "text-gray-400 cursor-not-allowed opacity-50"
                        }
                        title={!canRemoveIndexedElement()
                          ? "Cannot remove: would violate length constraints"
                          : "Remove element"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <PolicyFieldComponent
                      field={element}
                      onChange={(updatedField) => updateIndexedElement(index, updatedField as PolicyField)}
                      onRemove={() => removeIndexedElement(index)}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center p-4 border-2 border-dashed border-primary-200 rounded-md bg-primary-25">
              <p className="text-sm text-primary-400">
                No elements defined for this array
              </p>
              <p className="text-xs text-primary-400 mt-1">
                Add indexed elements like [0], [1], [2] to validate array contents
              </p>
            </div>
          )}

          {/* Show validation message when remove is disabled */}
          {!canRemoveIndexedElement() && Object.keys(policyField.indexedElements || {}).length > 0 && (
            <div className="p-2 border border-amber-200 rounded-md bg-amber-25">
              <p className="text-xs text-amber-700">
                ⚠️ Cannot remove elements: would violate length constraints
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PolicyRuleComponent: React.FC<PolicyRuleProps> = ({ rule, onChange, onRemove }) => {
  const [isOpen, setIsOpen] = useState(true);

  const applyTemplate = (templateKey: string): void => {
    const template = TEMPLATES[templateKey];
    if (!template) return;

    const newFields: PolicyField[] = template.fields.map(field => ({
      property: field.property,
      fieldType: 'String', // Templates default to String fields
      constraints: [{ type: field.constraint, value: field.value }],
      nestedFields: undefined,
      indexedElements: undefined
    }));

    onChange({
      ...rule,
      method: template.method,
      fields: newFields
    });
  };

  const addField = (fieldType?: string): void => {
    const fieldTypeKey = fieldType as keyof typeof FIELD_TYPES;
    const fieldTypeData = FIELD_TYPES[fieldTypeKey];

    if (!fieldTypeData) return;

    // Don't add default constraints automatically
    // Let users add constraints only when they need them
    const newField: PolicyField = {
      property: '',
      fieldType: fieldType as PolicyField['fieldType'],
      constraints: fieldType === 'Array' ? [{ type: 'lengthEq', value: 1 }] : [], // Arrays get lengthEq by default
      nestedFields: fieldType === 'Object' ? [] : undefined,
      indexedElements: fieldType === 'Array' ? {} : undefined
    };

    onChange({
      ...rule,
      fields: [...rule.fields, newField]
    });
  };

  const addArgsField = (): void => {
    const argsField: PolicyField = {
      property: 'args',
      fieldType: 'Array',
      constraints: [{ type: 'lengthEq', value: 1 }], // Default array constraint
      nestedFields: undefined,
      indexedElements: {}
    };
    onChange({ ...rule, argsField });
  };

  const updateField = (index: number, field: PolicyField): void => {
    const newFields = [...rule.fields];
    newFields[index] = field;
    onChange({ ...rule, fields: newFields });
  };

  const removeField = (index: number): void => {
    const newFields = [...rule.fields];
    newFields.splice(index, 1);
    onChange({ ...rule, fields: newFields });
  };

  const updateArgsField = (argsField: PolicyField): void => {
    onChange({ ...rule, argsField });
  };

  const removeArgsField = (): void => {
    onChange({ ...rule, argsField: null });
  };

  const handleFieldSelection = (selection: string): void => {
    if (selection === 'ARGS') {
      addArgsField();
    } else {
      addField(selection);
    }
  };

  // Method-specific field availability
  const getAvailableFieldTypes = (): string[] => {
    const baseFields = Object.keys(FIELD_TYPES);

    // All methods can use basic field types (Number, String, Boolean, BigInt, Array, Object)
    const availableFields = [...baseFields];

    // Method-specific special fields:
    // - Args field: only for signTransaction (validates transaction arguments)
    // - VerifiedOrder field: only for signTypedData (validates typed data structures)
    if (rule.method === 'signTransaction') {
      availableFields.push('ARGS');
    }

    if (rule.method === 'signTypedData') {
      // Future: Add verifiedOrder support
      // availableFields.push('VERIFIED_ORDER');
    }

    return availableFields;
  };

  // Clean up incompatible fields when method changes
  const handleMethodChange = (newMethod: string): void => {
    let updatedRule = { ...rule, method: newMethod };

    // Clean up method-specific fields that are no longer valid:

    // 1. Args field: only valid for signTransaction
    if (newMethod !== 'signTransaction' && rule.argsField) {
      updatedRule = { ...updatedRule, argsField: null };
    }

    // 2. VerifiedOrder fields: only valid for signTypedData
    if (newMethod !== 'signTypedData') {
      // Future: Remove verifiedOrder fields when implemented
      // updatedRule.fields = updatedRule.fields.filter(field => 
      //   !field.property.startsWith('verifiedOrder')
      // );
    }

    onChange(updatedRule);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className='border border-primary-100 rounded-lg p-4'>
      <CollapsibleTrigger asChild>
        <div className="flex-col">
          <div className='flex items-center justify-between'>
            <h4>
              {rule.name}
            </h4>
            <div className="flex items-center gap-4">
              <Button className='bg-danger-50 border border-danger-100 rounded-md hover:bg-danger-100 transition-all duration-200' variant="ghost" size="icon" onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}>
                <Icon name='trash' className='size-4 transition-transform duration-200 hover:scale-110' />
              </Button>
              <div className='h-8 bg-primary-100 w-[1px]' />
              {isOpen ? <ChevronUp className="h-4 w-4 text-primary-300 transition-transform duration-300" /> : <ChevronDown className="h-4 w-4 text-primary-300 transition-transform duration-300" />}
            </div>
          </div>
          {isOpen && <div className='w-full border-t border-primary-100 border-dashed my-4' />}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-4 w-full">
          {/* Template Selection */}
          <Select onValueChange={applyTemplate}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <SelectItem key={key} value={key}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Basic Fields */}
          <div className="grid gap-4 w-full">
            <div className='flex flex-col gap-1.5 w-full'>
              <Label className='text-[13px] text-primary-300'>Method</Label>
              <Select value={rule.method || ''} onValueChange={handleMethodChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signMessage">signMessage</SelectItem>
                  <SelectItem value="signTypedData">signTypedData</SelectItem>
                  <SelectItem value="signTransaction">signTransaction</SelectItem>
                  <SelectItem value="signRawPayloads">signRawPayloads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5 w-full'>
              <Label className='text-[13px] text-primary-300'>Chain</Label>
              <Input
                placeholder="evm:eip155:1"
                value={rule.chain || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...rule, chain: e.target.value })}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            {/* Args Field */}
            {rule.argsField && (
              <PolicyFieldComponent
                field={rule.argsField}
                onChange={(field) => updateArgsField(field as PolicyField)}
                onRemove={removeArgsField}
              />
            )}

            {/* Method-specific field availability notice */}
            {rule.method && rule.method !== 'signTransaction' && (
              <div className="text-center p-3 border border-blue-200 rounded-md bg-blue-25">
                <p className="text-sm text-blue-600">
                  <Icon name="warning" className="inline h-4 w-4 mr-1" />
                  Args field is only available for <code className="bg-blue-100 px-1 rounded">signTransaction</code> method
                </p>
              </div>
            )}

            {/* Regular Fields */}
            <div className="space-y-3">
              {rule.fields.map((field, index) => (
                <div key={index} className="animate-in slide-in-from-top-2 fade-in-0 duration-300 ease-out">
                  <PolicyFieldComponent
                    field={field}
                    onChange={(f: PolicyField) => updateField(index, f)}
                    onRemove={() => removeField(index)}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <CategorizedDropdown
                type="field"
                onSelect={handleFieldSelection}
                availableFieldTypes={getAvailableFieldTypes()}
                buttonText="Add another field"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface PolicyBuilderProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function PolicyBuilder({ value, onChange }: PolicyBuilderProps): JSX.Element {
  const [internalJson, setInternalJson] = useState<string>(
    value || '{\n  "allow": [],\n  "deny": []\n}'
  );

  // Sync internal state with external value if it changes
  useEffect(() => {
    if (value !== undefined && value !== internalJson) {
      setInternalJson(value);
    }
  }, [value, internalJson]);

  // Clean invalid properties from policy based on method
  const cleanInvalidProperties = (policy: PolicyObject): PolicyObject => {
    const cleaned: PolicyObject = { allow: [], deny: [] };

    (['allow', 'deny'] as const).forEach(type => {
      cleaned[type] = (policy[type] || []).map(rule => {
        const cleanedRule = { ...rule };
        const method = String(rule.method || '');

        if (method === 'signMessage') {
          // signMessage can only have payload, remove decoded if present
          if (cleanedRule.decoded) {
            delete cleanedRule.decoded;
          }
        } else {
          // Other methods can only have decoded, remove payload if present
          if (cleanedRule.payload) {
            delete cleanedRule.payload;
          }
        }

        return cleanedRule;
      });
    });

    return cleaned;
  };

  const handleJsonChange = (newValue: string): void => {
    try {
      const parsed = JSON.parse(newValue) as PolicyObject;
      const cleaned = cleanInvalidProperties(parsed);
      const cleanedJson = JSON.stringify(cleaned, null, 2);

      setInternalJson(cleanedJson);
      onChange?.(cleanedJson);
    } catch {
      // If invalid JSON, just set as-is
      setInternalJson(newValue);
      onChange?.(newValue);
    }
  };

  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [activeTab, setActiveTab] = useState<string>('interactive');
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);

  // Helper function to recursively convert logical constraints
  const convertLogicalConstraintValue = useCallback((constraintType: string, constraintValue: unknown): unknown => {
    if (['anyOf', 'allOf', 'oneOf'].includes(constraintType) && Array.isArray(constraintValue)) {
      const rawArray = constraintValue as Array<unknown>;
      return rawArray.map(item => {
        // Check if item is a SchemaObject with nestedFields
        if (item && typeof item === 'object' && 'nestedFields' in item) {
          const schemaObj = item as SchemaObject;
          const converted: Record<string, unknown> = {};

          // Convert nested fields to flat properties
          if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
            schemaObj.nestedFields.forEach(nestedField => {
              if (!nestedField.property) return;

              const fieldPath = nestedField.property;

              // Add constraints for this nested field
              if (nestedField.constraints.length > 0) {
                const nestedConstraints = nestedField.constraints.filter(c =>
                  c.value !== '' && c.value !== null && c.value !== undefined
                );

                if (nestedConstraints.length > 0) {
                  // Special case: single const constraint
                  if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                    converted[fieldPath] = nestedConstraints[0].value;
                  } else if (nestedConstraints.length === 1) {
                    // RECURSIVE CALL: Handle nested logical constraints
                    const nc = nestedConstraints[0];
                    if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                      converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                    } else {
                      converted[fieldPath] = { [nc.type]: nc.value };
                    }
                  } else {
                    const nestedConstraintObj: Record<string, unknown> = {};
                    nestedConstraints.forEach(nc => {
                      // RECURSIVE CALL: Handle nested logical constraints
                      if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                        nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                      } else {
                        nestedConstraintObj[nc.type] = nc.value;
                      }
                    });
                    converted[fieldPath] = nestedConstraintObj;
                  }
                }
              }
            });
          }

          return converted;
        } else {
          // Already in flat JSON format or other type
          return item as Record<string, unknown>;
        }
      });
    } else {
      // Not a logical constraint, return as-is
      return constraintValue;
    }
  }, []);

  const rulesToPolicy = useCallback((rulesArray: PolicyRule[]): PolicyObject => {
    const policy: PolicyObject = { allow: [], deny: [] };

    rulesArray.forEach(rule => {
      if (!rule.method && rule.fields.length === 0 && !rule.argsField) return;

      const policyRule: Record<string, unknown> = {};

      if (rule.method) policyRule.method = rule.method;
      if (rule.chain) policyRule.chain = rule.chain;

      // Process fields into nested structure
      const section = rule.method === 'signMessage' ? 'payload' : 'decoded';
      const sectionData: Record<string, unknown> = {};

      // Create all field data first, then add in logical order
      const allFieldData: Array<{ key: string; value: unknown }> = [];

      // Collect regular fields (recursively handle nested fields)
      const processField = (field: PolicyField, basePath = ''): void => {
        if (!field.property) return;

        const fullPath = basePath ? `${basePath}.${field.property}` : field.property;

        // Check if field has valid constraints
        const validConstraints = field.constraints.filter(c =>
          c.value !== '' && c.value !== null && c.value !== undefined
        );

        // Add field constraints if any exist
        if (validConstraints.length > 0) {
          let constraintValue: unknown;

          // Special case: single const constraint should be flattened to direct value
          if (validConstraints.length === 1 && validConstraints[0].type === 'const') {
            constraintValue = validConstraints[0].value;
          } else if (validConstraints.length === 1) {
            const constraint = validConstraints[0];
            // Handle logical constraints with schema objects
            if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type) && Array.isArray(constraint.value)) {
              const schemaObjects = constraint.value as SchemaObject[];
              const convertedSchemas = schemaObjects.map(schemaObj => {
                const converted: Record<string, unknown> = {};

                // Convert nested fields to flat properties (recursively)
                const convertNestedFields = (fields: PolicyField[], basePath = ''): void => {
                  fields.forEach(nestedField => {
                    if (!nestedField.property) return;

                    const fieldPath = basePath ? `${basePath}.${nestedField.property}` : nestedField.property;

                    // Add constraints for this nested field
                    if (nestedField.constraints.length > 0) {
                      const nestedConstraints = nestedField.constraints.filter(c =>
                        c.value !== '' && c.value !== null && c.value !== undefined
                      );

                      if (nestedConstraints.length > 0) {
                        // Special case: single const constraint
                        if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                          converted[fieldPath] = nestedConstraints[0].value;
                        } else if (nestedConstraints.length === 1) {
                          // RECURSIVE CALL: Handle nested logical constraints
                          const nc = nestedConstraints[0];
                          if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                            converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                          } else {
                            converted[fieldPath] = { [nc.type]: nc.value };
                          }
                        } else {
                          const nestedConstraintObj: Record<string, unknown> = {};
                          nestedConstraints.forEach(nc => {
                            // RECURSIVE CALL: Handle nested logical constraints
                            if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                              nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                            } else {
                              nestedConstraintObj[nc.type] = nc.value;
                            }
                          });
                          converted[fieldPath] = nestedConstraintObj;
                        }
                      }
                    }

                    // Recursively process deeper nested fields (Object types)
                    if (nestedField.nestedFields && nestedField.nestedFields.length > 0) {
                      convertNestedFields(nestedField.nestedFields, fieldPath);
                    }

                    // Process indexed elements (Array types)
                    if (nestedField.indexedElements && Object.keys(nestedField.indexedElements).length > 0) {
                      Object.entries(nestedField.indexedElements).forEach(([index, indexedField]) => {
                        const indexPath = `${fieldPath}.${index}`;
                        if (indexedField.constraints.length > 0) {
                          const indexConstraints = indexedField.constraints.filter(c =>
                            c.value !== '' && c.value !== null && c.value !== undefined
                          );

                          if (indexConstraints.length > 0) {
                            if (indexConstraints.length === 1 && indexConstraints[0].type === 'const') {
                              setNestedProperty(converted, indexPath, indexConstraints[0].value);
                            } else if (indexConstraints.length === 1) {
                              setNestedProperty(converted, indexPath, { [indexConstraints[0].type]: indexConstraints[0].value });
                            } else {
                              const indexConstraintObj: Record<string, unknown> = {};
                              indexConstraints.forEach(ic => {
                                indexConstraintObj[ic.type] = ic.value;
                              });
                              setNestedProperty(converted, indexPath, indexConstraintObj);
                            }
                          }
                        }
                      });
                    }
                  });
                };

                if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                  convertNestedFields(schemaObj.nestedFields);
                }

                return converted;
              });
              constraintValue = { [constraint.type]: convertedSchemas };
            } else {
              constraintValue = { [constraint.type]: constraint.value };
            }
          } else {
            const constraintObj: Record<string, unknown> = {};
            validConstraints.forEach(c => {
              // Handle logical constraints individually  
              if (['anyOf', 'allOf', 'oneOf'].includes(c.type) && Array.isArray(c.value)) {
                const schemaObjects = c.value as SchemaObject[];
                const convertedSchemas = schemaObjects.map(schemaObj => {
                  const converted: Record<string, unknown> = {};

                  // Convert nested fields to flat properties
                  const convertNestedFields = (fields: PolicyField[], basePath = ''): void => {
                    fields.forEach(nestedField => {
                      if (!nestedField.property) return;

                      const fieldPath = basePath ? `${basePath}.${nestedField.property}` : nestedField.property;

                      if (nestedField.constraints.length > 0) {
                        const nestedConstraints = nestedField.constraints.filter(nc =>
                          nc.value !== '' && nc.value !== null && nc.value !== undefined
                        );

                        if (nestedConstraints.length > 0) {
                          if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                            converted[fieldPath] = nestedConstraints[0].value;
                          } else if (nestedConstraints.length === 1) {
                            // RECURSIVE CALL: Handle nested logical constraints
                            const nc = nestedConstraints[0];
                            if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                              converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                            } else {
                              converted[fieldPath] = { [nc.type]: nc.value };
                            }
                          } else {
                            const nestedConstraintObj: Record<string, unknown> = {};
                            nestedConstraints.forEach(nc => {
                              // RECURSIVE CALL: Handle nested logical constraints
                              if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                              } else {
                                nestedConstraintObj[nc.type] = nc.value;
                              }
                            });
                            converted[fieldPath] = nestedConstraintObj;
                          }
                        }
                      }

                      if (nestedField.nestedFields && nestedField.nestedFields.length > 0) {
                        convertNestedFields(nestedField.nestedFields, fieldPath);
                      }
                    });
                  };

                  if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                    convertNestedFields(schemaObj.nestedFields);
                  }

                  return converted;
                });
                constraintObj[c.type] = convertedSchemas;
              } else {
                constraintObj[c.type] = c.value;
              }
            });
            constraintValue = constraintObj;
          }

          allFieldData.push({ key: fullPath, value: constraintValue });
        }

        // Process nested fields (Object types - even if parent has no constraints)
        if (field.nestedFields && field.nestedFields.length > 0) {
          field.nestedFields.forEach(nestedField => {
            processField(nestedField, fullPath);
          });
        }

        // Process indexed elements (Array types - even if parent has no constraints)
        if (field.indexedElements && Object.keys(field.indexedElements).length > 0) {
          Object.entries(field.indexedElements).forEach(([index, indexedField]) => {
            const indexPath = `${fullPath}.${index}`;

            // Process constraints for this indexed element directly (don't use processField recursively)
            const validConstraints = indexedField.constraints.filter(c =>
              c.value !== '' && c.value !== null && c.value !== undefined
            );

            if (validConstraints.length > 0) {
              let constraintValue: unknown;

              // Special case: single const constraint should be flattened to direct value
              if (validConstraints.length === 1 && validConstraints[0].type === 'const') {
                constraintValue = validConstraints[0].value;
              } else if (validConstraints.length === 1) {
                const constraint = validConstraints[0];
                // Handle logical constraints with schema objects
                if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type) && Array.isArray(constraint.value)) {
                  const rawArray = constraint.value as Array<unknown>;
                  const convertedSchemas = rawArray.map(item => {
                    // Check if item is a SchemaObject with nestedFields
                    if (item && typeof item === 'object' && 'nestedFields' in item) {
                      const schemaObj = item as SchemaObject;
                      const converted: Record<string, unknown> = {};

                      // Convert nested fields to flat properties
                      if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                        schemaObj.nestedFields.forEach(nestedField => {
                          if (!nestedField.property) return;

                          const fieldPath = nestedField.property;

                          // Add constraints for this nested field
                          if (nestedField.constraints.length > 0) {
                            const nestedConstraints = nestedField.constraints.filter(c =>
                              c.value !== '' && c.value !== null && c.value !== undefined
                            );

                            if (nestedConstraints.length > 0) {
                              // Special case: single const constraint
                              if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                                converted[fieldPath] = nestedConstraints[0].value;
                              } else if (nestedConstraints.length === 1) {
                                // RECURSIVE CALL: Handle nested logical constraints
                                const nc = nestedConstraints[0];
                                if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                  converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                                } else {
                                  converted[fieldPath] = { [nc.type]: nc.value };
                                }
                              } else {
                                const nestedConstraintObj: Record<string, unknown> = {};
                                nestedConstraints.forEach(nc => {
                                  // RECURSIVE CALL: Handle nested logical constraints
                                  if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                    nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                                  } else {
                                    nestedConstraintObj[nc.type] = nc.value;
                                  }
                                });
                                converted[fieldPath] = nestedConstraintObj;
                              }
                            }
                          }
                        });
                      }

                      return converted;
                    } else {
                      // Already in flat JSON format or other type
                      return item as Record<string, unknown>;
                    }
                  });
                  constraintValue = { [constraint.type]: convertedSchemas };
                } else {
                  constraintValue = { [constraint.type]: constraint.value };
                }
              } else {
                const constraintObj: Record<string, unknown> = {};
                validConstraints.forEach(c => {
                  // Handle logical constraints individually  
                  if (['anyOf', 'allOf', 'oneOf'].includes(c.type) && Array.isArray(c.value)) {
                    const rawArray = c.value as Array<unknown>;
                    const convertedSchemas = rawArray.map(item => {
                      // Check if item is a SchemaObject with nestedFields
                      if (item && typeof item === 'object' && 'nestedFields' in item) {
                        const schemaObj = item as SchemaObject;
                        const converted: Record<string, unknown> = {};

                        // Convert nested fields to flat properties
                        if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                          schemaObj.nestedFields.forEach(nestedField => {
                            if (!nestedField.property) return;

                            const fieldPath = nestedField.property;

                            // Add constraints for this nested field
                            if (nestedField.constraints.length > 0) {
                              const nestedConstraints = nestedField.constraints.filter(nc =>
                                nc.value !== '' && nc.value !== null && nc.value !== undefined
                              );

                              if (nestedConstraints.length > 0) {
                                if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                                  converted[fieldPath] = nestedConstraints[0].value;
                                } else if (nestedConstraints.length === 1) {
                                  // RECURSIVE CALL: Handle nested logical constraints
                                  const nc = nestedConstraints[0];
                                  if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                    converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                                  } else {
                                    converted[fieldPath] = { [nc.type]: nc.value };
                                  }
                                } else {
                                  const nestedConstraintObj: Record<string, unknown> = {};
                                  nestedConstraints.forEach(nc => {
                                    // RECURSIVE CALL: Handle nested logical constraints
                                    if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                      nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                                    } else {
                                      nestedConstraintObj[nc.type] = nc.value;
                                    }
                                  });
                                  converted[fieldPath] = nestedConstraintObj;
                                }
                              }
                            }
                          });
                        }

                        return converted;
                      } else {
                        // Already in flat JSON format or other type
                        return item as Record<string, unknown>;
                      }
                    });
                    constraintObj[c.type] = convertedSchemas;
                  } else {
                    constraintObj[c.type] = c.value;
                  }
                });
                constraintValue = constraintObj;
              }

              allFieldData.push({ key: indexPath, value: constraintValue });
            }

            // If this indexed element has nested fields (for Object type indexed elements), process them recursively
            if (indexedField.nestedFields && indexedField.nestedFields.length > 0) {
              indexedField.nestedFields.forEach(nestedField => {
                processField(nestedField, indexPath);
              });
            }

            // If this indexed element has its own indexed elements (for Array type indexed elements), process them recursively
            if (indexedField.indexedElements && Object.keys(indexedField.indexedElements).length > 0) {
              Object.entries(indexedField.indexedElements).forEach(([subIndex, subIndexedField]) => {
                const subIndexPath = `${indexPath}.${subIndex}`;

                const subValidConstraints = subIndexedField.constraints.filter(c =>
                  c.value !== '' && c.value !== null && c.value !== undefined
                );

                if (subValidConstraints.length > 0) {
                  let subConstraintValue: unknown;

                  if (subValidConstraints.length === 1 && subValidConstraints[0].type === 'const') {
                    subConstraintValue = subValidConstraints[0].value;
                  } else if (subValidConstraints.length === 1) {
                    const constraint = subValidConstraints[0];
                    // Handle logical constraints with schema objects
                    if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type) && Array.isArray(constraint.value)) {
                      const rawArray = constraint.value as Array<unknown>;
                      const convertedSchemas = rawArray.map(item => {
                        // Check if item is a SchemaObject with nestedFields
                        if (item && typeof item === 'object' && 'nestedFields' in item) {
                          const schemaObj = item as SchemaObject;
                          const converted: Record<string, unknown> = {};

                          // Convert nested fields to flat properties
                          if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                            schemaObj.nestedFields.forEach(nestedField => {
                              if (!nestedField.property) return;

                              const fieldPath = nestedField.property;

                              // Add constraints for this nested field
                              if (nestedField.constraints.length > 0) {
                                const nestedConstraints = nestedField.constraints.filter(c =>
                                  c.value !== '' && c.value !== null && c.value !== undefined
                                );

                                if (nestedConstraints.length > 0) {
                                  // Special case: single const constraint
                                  if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                                    converted[fieldPath] = nestedConstraints[0].value;
                                  } else if (nestedConstraints.length === 1) {
                                    // RECURSIVE CALL: Handle nested logical constraints
                                    const nc = nestedConstraints[0];
                                    if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                      converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                                    } else {
                                      converted[fieldPath] = { [nc.type]: nc.value };
                                    }
                                  } else {
                                    const nestedConstraintObj: Record<string, unknown> = {};
                                    nestedConstraints.forEach(nc => {
                                      // RECURSIVE CALL: Handle nested logical constraints
                                      if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                        nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                                      } else {
                                        nestedConstraintObj[nc.type] = nc.value;
                                      }
                                    });
                                    converted[fieldPath] = nestedConstraintObj;
                                  }
                                }
                              }
                            });
                          }

                          return converted;
                        } else {
                          // Already in flat JSON format or other type
                          return item as Record<string, unknown>;
                        }
                      });
                      subConstraintValue = { [constraint.type]: convertedSchemas };
                    } else {
                      subConstraintValue = { [constraint.type]: constraint.value };
                    }
                  } else {
                    const subConstraintObj: Record<string, unknown> = {};
                    subValidConstraints.forEach(c => {
                      // Handle logical constraints individually  
                      if (['anyOf', 'allOf', 'oneOf'].includes(c.type) && Array.isArray(c.value)) {
                        const rawArray = c.value as Array<unknown>;
                        const convertedSchemas = rawArray.map(item => {
                          // Check if item is a SchemaObject with nestedFields
                          if (item && typeof item === 'object' && 'nestedFields' in item) {
                            const schemaObj = item as SchemaObject;
                            const converted: Record<string, unknown> = {};

                            // Convert nested fields to flat properties
                            if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                              schemaObj.nestedFields.forEach(nestedField => {
                                if (!nestedField.property) return;

                                const fieldPath = nestedField.property;

                                // Add constraints for this nested field
                                if (nestedField.constraints.length > 0) {
                                  const nestedConstraints = nestedField.constraints.filter(nc =>
                                    nc.value !== '' && nc.value !== null && nc.value !== undefined
                                  );

                                  if (nestedConstraints.length > 0) {
                                    if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                                      converted[fieldPath] = nestedConstraints[0].value;
                                    } else if (nestedConstraints.length === 1) {
                                      // RECURSIVE CALL: Handle nested logical constraints
                                      const nc = nestedConstraints[0];
                                      if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                        converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                                      } else {
                                        converted[fieldPath] = { [nc.type]: nc.value };
                                      }
                                    } else {
                                      const nestedConstraintObj: Record<string, unknown> = {};
                                      nestedConstraints.forEach(nc => {
                                        // RECURSIVE CALL: Handle nested logical constraints
                                        if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                          nestedConstraintObj[nc.type] = convertLogicalConstraintValue(nc.type, nc.value);
                                        } else {
                                          nestedConstraintObj[nc.type] = nc.value;
                                        }
                                      });
                                      converted[fieldPath] = nestedConstraintObj;
                                    }
                                  }
                                }
                              });
                            }

                            return converted;
                          } else {
                            // Already in flat JSON format or other type
                            return item as Record<string, unknown>;
                          }
                        });
                        subConstraintObj[c.type] = convertedSchemas;
                      } else {
                        subConstraintObj[c.type] = c.value;
                      }
                    });
                    subConstraintValue = subConstraintObj;
                  }

                  allFieldData.push({ key: subIndexPath, value: subConstraintValue });
                }
              });
            }
          });
        }
      };

      rule.fields.forEach(field => processField(field));

      // Collect args field data (now just a regular Array field)
      if (rule.argsField) {
        processField(rule.argsField);
      }

      // Fields are already in logical order (args will appear after regular fields when processed)

      // Apply all fields to section data in the correct order
      allFieldData.forEach(({ key, value }) => {
        setNestedProperty(sectionData, key, value);
      });

      if (Object.keys(sectionData).length > 0) {
        policyRule[section] = sectionData;
      }

      if (Object.keys(policyRule).length > 0) {
        policy[rule.type].push(cleanEmptyObjects(policyRule) as Record<string, unknown>);
      }
    });

    return policy;
  }, []);

  // Convert policy object back to rules
  const policyToRules = useCallback((policy: PolicyObject): PolicyRule[] => {
    const newRules: PolicyRule[] = [];
    let ruleId = 1;

    (['allow', 'deny'] as const).forEach(type => {
      (policy[type] || []).forEach(policyRule => {
        const rule: PolicyRule = {
          id: ruleId++,
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${newRules.filter(r => r.type === type).length + 1}`,
          method: String(policyRule.method || ''),
          chain: String(policyRule.chain || ''),
          fields: [],
          argsField: null
        };

        // Extract fields from decoded/payload section
        const section = (policyRule.decoded || policyRule.payload || {}) as Record<string, unknown>;

        // Build a tree structure from flat paths
        const buildFieldTree = (flatPaths: Array<{ path: string; constraints: Constraint[] }>): PolicyField[] => {
          const pathGroups: Record<string, Array<{ path: string; constraints: Constraint[] }>> = {};
          const directFields: Array<{ path: string; constraints: Constraint[] }> = [];

          // Group paths by their root property
          flatPaths.forEach(item => {
            const pathParts = item.path.split('.');
            if (pathParts.length === 1) {
              directFields.push(item);
            } else {
              const rootPath = pathParts[0];
              if (!pathGroups[rootPath]) {
                pathGroups[rootPath] = [];
              }
              pathGroups[rootPath].push({
                path: pathParts.slice(1).join('.'),
                constraints: item.constraints
              });
            }
          });

          const fields: PolicyField[] = [];

          // Create direct fields
          directFields.forEach(item => {
            fields.push({
              property: item.path,
              fieldType: 'String', // Default to String, user can change
              constraints: item.constraints,
              nestedFields: undefined,
              indexedElements: undefined
            });
          });

          // Create nested field structures
          Object.entries(pathGroups).forEach(([rootPath, nestedPaths]) => {
            const nestedFields = buildFieldTree(nestedPaths);

            // Check if this looks like an array (has numeric keys)
            const hasNumericKeys = nestedPaths.some(item => /^\d+/.test(item.path));
            const fieldType = hasNumericKeys ? 'Array' : 'Object';

            if (fieldType === 'Array') {
              // Convert to indexed elements for arrays
              const indexedElements: Record<string, PolicyField> = {};
              nestedPaths.forEach(item => {
                const pathParts = item.path.split('.');
                const indexKey = pathParts[0];
                if (/^\d+$/.test(indexKey)) {
                  indexedElements[indexKey] = {
                    property: indexKey,
                    fieldType: 'String', // Default type
                    constraints: item.constraints,
                    nestedFields: undefined,
                    indexedElements: undefined
                  };
                }
              });

              fields.push({
                property: rootPath,
                fieldType: 'Array',
                constraints: [],
                nestedFields: undefined,
                indexedElements
              });
            } else {
              fields.push({
                property: rootPath,
                fieldType: 'Object',
                constraints: [],
                nestedFields: nestedFields.length > 0 ? nestedFields : undefined,
                indexedElements: undefined
              });
            }
          });

          return fields;
        };

        const extractFields = (obj: Record<string, unknown>, prefix = ''): Array<{ path: string; constraints: Constraint[] }> => {
          const flatFields: Array<{ path: string; constraints: Constraint[] }> = [];

          Object.entries(obj).forEach(([key, value]) => {
            // Args field is now handled like any other field (no special case needed)

            const path = prefix ? `${prefix}.${key}` : key;

            // Handle direct values
            if (typeof value === 'string' || typeof value === 'number') {
              flatFields.push({ path, constraints: [{ type: 'const', value }] });
              return;
            }

            // Handle arrays as enum constraints
            if (Array.isArray(value)) {
              flatFields.push({ path, constraints: [{ type: 'enum', value }] });
              return;
            }

            if (value && typeof value === 'object') {
              const constraintKeys = Object.keys(value as Record<string, unknown>);
              const constraintOnlyKeys = constraintKeys.filter(k => CONSTRAINT_TYPES[k]);

              if (constraintOnlyKeys.length > 0) {
                // Has constraints
                const constraints = constraintOnlyKeys.map(k => {
                  const constraintValue = (value as Record<string, unknown>)[k];

                  // Handle logical constraints - convert back to SchemaObject format
                  if (['anyOf', 'allOf', 'oneOf'].includes(k) && Array.isArray(constraintValue)) {
                    const schemaObjects: SchemaObject[] = (constraintValue as Array<Record<string, unknown>>).map(schema => {
                      const nestedFields: PolicyField[] = [];

                      // Convert schema properties to nested fields
                      Object.entries(schema).forEach(([propKey, propValue]) => {
                        if (propKey && propValue !== undefined && propValue !== null && propValue !== '') {
                          // Determine field type and constraints
                          let fieldType: PolicyField['fieldType'] = 'String';
                          let constraints: Constraint[] = [];

                          if (typeof propValue === 'object' && !Array.isArray(propValue)) {
                            // Property has constraints
                            const constraintObj = propValue as Record<string, unknown>;
                            const constraintKeys = Object.keys(constraintObj);

                            constraints = constraintKeys
                              .filter(ck => CONSTRAINT_TYPES[ck])
                              .map(ck => ({
                                type: ck,
                                value: constraintObj[ck] as string | number | boolean | object | Array<unknown>
                              }));

                            // Infer field type from constraint type
                            if (constraints.some(c => c.type.includes('numeric') || c.type.includes('Min') || c.type.includes('Max') || ['min', 'max', 'lt', 'lte', 'gt', 'gte', 'minimum', 'maximum', '24hLimit'].includes(c.type))) {
                              fieldType = 'Number';
                            } else if (constraints.some(c => c.type.includes('bigInt'))) {
                              fieldType = 'BigInt';
                            } else if (constraints.some(c => c.type.includes('address'))) {
                              fieldType = 'String';
                            } else if (constraints.some(c => c.type.includes('string') || ['contains', 'startsWith', 'endsWith', 'matches', 'pattern', 'inList', 'before', 'after'].includes(c.type))) {
                              fieldType = 'String';
                            } else if (constraints.some(c => ['is'].includes(c.type))) {
                              fieldType = 'Boolean';
                            } else if (constraints.some(c => ['containsItem', 'containsAny', 'containsAll', 'equals'].includes(c.type))) {
                              fieldType = 'Array';
                            } else if (constraints.some(c => ['lengthEq', 'minLength', 'maxLength'].includes(c.type))) {
                              // Length constraints could be for strings or arrays - default to Array for backward compatibility
                              fieldType = 'Array';
                            } else if (constraints.some(c => ['shape', 'hasKeys', 'requiredKeys'].includes(c.type))) {
                              fieldType = 'Object';
                            } else if (constraints.some(c => ['anyOf', 'allOf', 'oneOf', 'not', 'if', 'then', 'else', 'type'].includes(c.type))) {
                              fieldType = 'Object';
                            }
                          } else {
                            // Direct value
                            if (typeof propValue === 'number') {
                              fieldType = 'Number';
                              constraints = [{ type: 'const', value: propValue }];
                            } else if (typeof propValue === 'boolean') {
                              fieldType = 'Boolean';
                              constraints = [{ type: 'const', value: propValue }];
                            } else {
                              fieldType = 'String';
                              constraints = [{ type: 'const', value: propValue }];
                            }
                          }

                          nestedFields.push({
                            property: propKey,
                            fieldType,
                            constraints,
                            nestedFields: fieldType === 'Object' ? [] : undefined,
                            indexedElements: fieldType === 'Array' ? {} : undefined
                          });
                        }
                      });

                      return { nestedFields };
                    });

                    return {
                      type: k,
                      value: schemaObjects
                    };
                  }

                  return {
                    type: k,
                    value: constraintValue as string | number | boolean | object | Array<unknown>
                  };
                });
                flatFields.push({ path, constraints });
              }

              // Process remaining non-constraint properties
              const nonConstraintKeys = constraintKeys.filter(k => !CONSTRAINT_TYPES[k]);
              nonConstraintKeys.forEach(nestedKey => {
                const nestedValue = (value as Record<string, unknown>)[nestedKey];
                const nestedFields = extractFields({ [nestedKey]: nestedValue }, path);
                flatFields.push(...nestedFields);
              });
            }
          });

          return flatFields;
        };

        const flatFields = extractFields(section);
        const treeFields = buildFieldTree(flatFields);

        // Check if there's an args field and move it to argsField property
        const argsFieldIndex = treeFields.findIndex(field => field.property === 'args');
        if (argsFieldIndex !== -1) {
          rule.argsField = treeFields[argsFieldIndex];
          treeFields.splice(argsFieldIndex, 1); // Remove from regular fields
        }

        rule.fields = treeFields;
        newRules.push(rule);
      });
    });

    return newRules;
  }, []);

  // Update JSON when rules change
  useEffect(() => {
    if (activeTab === 'interactive') {
      const policy = rulesToPolicy(rules);
      setInternalJson(JSON.stringify(policy, null, 2));
    }
  }, [rules, activeTab, rulesToPolicy]);

  // Handle JSON changes
  const handleJsonValueChange = (value: string): void => {
    setInternalJson(value);

    try {
      const parsed = JSON.parse(value) as PolicyObject;
      setIsJsonValid(true);

      if (activeTab === 'json') {
        // Clean invalid properties and update JSON if needed
        const cleaned = cleanInvalidProperties(parsed);
        const cleanedJson = JSON.stringify(cleaned, null, 2);

        if (cleanedJson !== value) {
          // Auto-update JSON to remove invalid properties
          setTimeout(() => setInternalJson(cleanedJson), 0);
        }

        const newRules = policyToRules(cleaned);
        setRules(newRules);
      }
    } catch {
      setIsJsonValid(false);
    }
  };

  const addRule = (type: 'allow' | 'deny'): void => {
    const newRule: PolicyRule = {
      id: Date.now(),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${rules.filter(r => r.type === type).length + 1}`,
      method: '',
      chain: '',
      fields: []
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: number, updatedRule: PolicyRule): void => {
    setRules(rules.map(rule => rule.id === id ? updatedRule : rule));
  };

  const removeRule = (id: number): void => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 rounded-md">
      <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-6'>
        <TabsList className="w-full inset-shadow-tabs h-10 p-1 max-w-[416px]">
          <TabsTrigger value="interactive" className='font-normal data-[state=active]:text-primary-800 text-primary-400'>Interactive <Icon name='swipe' /></TabsTrigger>
          <TabsTrigger value="json"><Icon name='code' /> JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6 max-h-[400px] overflow-y-scroll hidebar">
          {/* Add Rule Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="cursor-pointer transition-all duration-300 ease-out inset-shadow-policy-cards bg-primary-25 rounded-xl hover:bg-primary-50 hover:scale-[1.02] hover:shadow-lg"
              onClick={() => addRule('allow')}
            >
              <div className="px-[18px] py-6 rounded-xl">
                <Icon name='check' className='text-primary-800 size-6 mb-4 transition-transform duration-300 hover:scale-110' />
                <div className='flex flex-col'>
                  <h3 className="font-medium transition-colors duration-200">Add allow rule</h3>
                  <p className="text-sm text-primary-400 transition-colors duration-200">Define permitted actions</p>
                </div>
              </div>
            </div>

            <div
              className="cursor-pointer transition-all duration-300 ease-out inset-shadow-policy-cards bg-primary-25 rounded-xl hover:bg-primary-50 hover:scale-[1.02] hover:shadow-lg"
              onClick={() => addRule('deny')}
            >
              <div className="px-[18px] py-6 rounded-xl">
                <Icon name='warning' className='text-primary-800 size-6 mb-4 transition-transform duration-300 hover:scale-110' />
                <div className='flex flex-col'>
                  <h3 className="font-medium transition-colors duration-200">Add deny rule</h3>
                  <p className="text-sm text-primary-400 transition-colors duration-200">Define blocked actions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            {rules.map(rule => (
              <div key={rule.id} className="animate-in slide-in-from-top-4 fade-in-0 duration-500 ease-out">
                <PolicyRuleComponent
                  rule={rule}
                  onChange={(updatedRule: PolicyRule) => updateRule(rule.id, updatedRule)}
                  onRemove={() => removeRule(rule.id)}
                />
              </div>
            ))}
          </div>

          {rules.length === 0 && (
            <div className="text-center rounded-xl p-4 flex items-center gap-2 border-2 border-warning-600/20 bg-warning-25 text-sm text-warning-600">
              <Icon name='wallet' className='size-4' />
              <span className=''>Pick a rule and start building up your wallet sharing</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <div className="border rounded-lg overflow-y-scroll max-h-[400px] hidebar">
            <CodeMirror
              value={internalJson}
              onChange={(value) => handleJsonValueChange(value)}
              extensions={[json(), myFontTheme]}
              theme={githubLight}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: false,
                tabSize: 2,
                autocompletion: true,
              }}
              style={{
                fontSize: '14px',
                // minHeight: '97px',
                maxHeight: '400px'
              }}
            />
          </div>

          <div className="flex items-center w-full justify-between gap-2">
            {!isJsonValid && (
              <span className="text-red-600 text-sm">Invalid JSON</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className='rounded-[6px]'
              onClick={() => {
                try {
                  const parsed = JSON.parse(internalJson);
                  const formatted = JSON.stringify(parsed, null, 2);
                  setInternalJson(formatted);
                } catch {
                  // Invalid JSON, can't format
                }
              }}
            >
              Format
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
