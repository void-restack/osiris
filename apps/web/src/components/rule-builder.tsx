import React, { useState, useEffect, useCallback, type ChangeEvent, type JSX } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Minus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
  valueType: 'string' | 'number' | 'array' | 'object';
  description: string;
}

interface Constraint {
  type: string;
  value: string | number | object | Array<unknown>;
}

interface PolicyField {
  property: string;
  constraints: Constraint[];
}

interface ArgsField {
  arrayConstraints: Constraint[];
  indexedElements: Record<string, Constraint[]>;
}

interface PolicyRule {
  id: number;
  type: 'allow' | 'deny';
  name: string;
  method: string;
  chain: string;
  fields: PolicyField[];
  argsField?: ArgsField | null;
}

interface PolicyObject {
  allow: Array<Record<string, unknown>>;
  deny: Array<Record<string, unknown>>;
}

// Template definitions
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
      { property: 'functionName', constraint: 'const', value: 'transfer' },
      { property: 'args.length', constraint: 'const', value: 2 }
    ]
  },
  'erc20-approve': {
    name: 'ERC20 Approve',
    method: 'signTransaction',
    fields: [
      { property: 'functionName', constraint: 'const', value: 'approve' },
      { property: 'args.length', constraint: 'const', value: 2 }
    ]
  }
};

const CONSTRAINT_TYPES: Record<string, ConstraintType> = {
  // Basic
  const: { label: 'const', valueType: 'string', description: 'Exact value match' },
  eq: { label: 'eq', valueType: 'string', description: 'Equality (alias for const)' },
  enum: { label: 'enum', valueType: 'array', description: 'One of multiple values' },
  type: { label: 'type', valueType: 'string', description: 'JSON Schema type' },

  // Logical
  anyOf: { label: 'anyOf', valueType: 'array', description: 'Match any of these schemas' },
  allOf: { label: 'allOf', valueType: 'array', description: 'Match all of these schemas' },
  oneOf: { label: 'oneOf', valueType: 'array', description: 'Match exactly one schema' },
  not: { label: 'not', valueType: 'object', description: 'Must not match this schema' },

  // Numeric
  minimum: { label: 'minimum', valueType: 'number', description: 'Minimum value' },
  maximum: { label: 'maximum', valueType: 'number', description: 'Maximum value' },

  // String/Length
  minLength: { label: 'minLength', valueType: 'number', description: 'Minimum string length' },
  maxLength: { label: 'maxLength', valueType: 'number', description: 'Maximum string length' },
  lengthEq: { label: 'lengthEq', valueType: 'number', description: 'Exact length' },
  pattern: { label: 'pattern', valueType: 'string', description: 'Regex pattern' },

  // Custom keywords
  bigIntMin: { label: 'bigIntMin', valueType: 'string', description: 'BigInt minimum' },
  bigIntMax: { label: 'bigIntMax', valueType: 'string', description: 'BigInt maximum' },
  bigIntEq: { label: 'bigIntEq', valueType: 'string', description: 'BigInt equality' },

  addressEq: { label: 'addressEq', valueType: 'string', description: 'Address equality' },
  addressInList: { label: 'addressInList', valueType: 'array', description: 'Address in list' },

  numericMin: { label: 'numericMin', valueType: 'number', description: 'Numeric minimum' },
  numericMax: { label: 'numericMax', valueType: 'number', description: 'Numeric maximum' },
  numericEq: { label: 'numericEq', valueType: 'number', description: 'Numeric equality' },
  numericLt: { label: 'numericLt', valueType: 'number', description: 'Numeric less than' },
  numericLte: { label: 'numericLte', valueType: 'number', description: 'Numeric less than or equal' },
  numericGt: { label: 'numericGt', valueType: 'number', description: 'Numeric greater than' },
  numericGte: { label: 'numericGte', valueType: 'number', description: 'Numeric greater than or equal' },

  stringContains: { label: 'stringContains', valueType: 'string', description: 'Contains substring' },
  stringStartsWith: { label: 'stringStartsWith', valueType: 'string', description: 'Starts with' },
  stringEndsWith: { label: 'stringEndsWith', valueType: 'string', description: 'Ends with' }
};

// Utility functions
const setNestedProperty = (obj: Record<string, unknown>, path: string, value: unknown): void => {
  const keys = path.split(/[.\[\]]/).filter(Boolean);
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (!(key in current)) {
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
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

// Component interfaces
interface SchemaObjectEditorProps {
  schemaObj: Record<string, unknown>;
  onChange: (obj: Record<string, unknown>) => void;
  onRemove: () => void;
}

interface ConstraintInputProps {
  constraint: Constraint;
  onChange: (constraint: Constraint) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

interface ArgsFieldProps {
  argsData: ArgsField;
  onChange: (argsData: ArgsField) => void;
  onRemove: () => void;
}

interface PolicyFieldProps {
  field: PolicyField | ArgsField;
  onChange: (field: PolicyField | ArgsField) => void;
  onRemove: () => void;
  isArgsField?: boolean;
}

interface PolicyRuleProps {
  rule: PolicyRule;
  onChange: (rule: PolicyRule) => void;
  onRemove: () => void;
}

const SchemaObjectEditor: React.FC<SchemaObjectEditorProps> = ({ schemaObj, onChange, onRemove }) => {
  const addProperty = (): void => {
    onChange({ ...schemaObj, '': '' });
  };

  const updateProperty = (oldKey: string, newKey: string, value: unknown): void => {
    const newObj = { ...schemaObj };
    if (oldKey !== newKey) {
      delete newObj[oldKey];
    }
    if (newKey.trim()) {
      newObj[newKey] = value;
    }
    onChange(newObj);
  };

  const removeProperty = (key: string): void => {
    const newObj = { ...schemaObj };
    delete newObj[key];
    onChange(newObj);
  };

  return (
    <div className="space-y-2 p-3 border border-gray-300 rounded-md bg-gray-50">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Schema Object</Label>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600">
          <Minus className="h-3 w-3" />
        </Button>
      </div>

      {Object.entries(schemaObj).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <Input
            placeholder="property"
            value={key}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateProperty(key, e.target.value, value)}
            className="w-32 text-sm"
          />
          <span className="text-gray-400">:</span>
          <Input
            placeholder="value"
            value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              let newValue: unknown = e.target.value;
              try {
                // Try to parse as JSON for objects/arrays
                if (typeof newValue === 'string' && (newValue.startsWith('{') || newValue.startsWith('['))) {
                  newValue = JSON.parse(newValue);
                }
              } catch {
                // Keep as string if not valid JSON
              }
              updateProperty(key, key, newValue);
            }}
            className="flex-1 text-sm"
          />
          <Button variant="ghost" size="sm" onClick={() => removeProperty(key)}>
            <Minus className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={addProperty} className="w-full">
        <Plus className="h-3 w-3 mr-1" />
        Add Property
      </Button>
    </div>
  );
};

// Constraint Input Component
const ConstraintInput: React.FC<ConstraintInputProps> = ({ constraint, onChange, onRemove, canRemove = true }) => {
  const constraintType = CONSTRAINT_TYPES[constraint.type] || CONSTRAINT_TYPES.const;

  const handleValueChange = (newValue: string | number | object | Array<unknown>): void => {
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

  const renderValueInput = (): JSX.Element => {
    if (constraintType.valueType === 'array' && ['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
      const schemaArray = Array.isArray(constraint.value) ? constraint.value as Array<Record<string, unknown>> : [];

      return (
        <div className="space-y-2">
          {schemaArray.map((schemaObj, index) => (
            <SchemaObjectEditor
              key={index}
              schemaObj={schemaObj || {}}
              onChange={(newObj: Record<string, unknown>) => {
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
            onClick={() => handleValueChange([...schemaArray, { type: 'order' }])}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Schema
          </Button>
        </div>
      );
    }

    if (constraintType.valueType === 'array') {
      const displayValue = Array.isArray(constraint.value)
        ? (constraint.value as Array<string>).join(', ')
        : String(constraint.value || '');

      return (
        <Textarea
          placeholder="value1, value2, value3"
          value={displayValue}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleValueChange(e.target.value)}
          className="min-h-[40px] resize-none"
        />
      );
    }

    if (constraintType.valueType === 'object') {
      const displayValue = typeof constraint.value === 'string'
        ? constraint.value
        : JSON.stringify(constraint.value, null, 2);

      return (
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
          className="min-h-[60px] resize-none font-mono text-sm"
        />
      );
    }

    return (
      <Input
        type={constraintType.valueType === 'number' ? 'number' : 'text'}
        placeholder={constraintType.valueType === 'number' ? '0' : 'Enter value'}
        value={String(constraint.value || '')}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
      />
    );
  };

  const handleTypeChange = (type: string): void => {
    const newConstraintType = CONSTRAINT_TYPES[type];
    const initialValue = newConstraintType?.valueType === 'number' ? 0 : '';
    onChange({ type, value: initialValue });
  };

  return (
    <div className="flex items-start gap-2 p-3 border rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Select value={constraint.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
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
            <div className="col-span-1">
              {renderValueInput()}
            </div>
          )}
        </div>

        {['anyOf', 'allOf', 'oneOf'].includes(constraint.type) && (
          <div className="mt-2">
            {renderValueInput()}
          </div>
        )}
      </div>

      {canRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-600 mt-1">
          <Minus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Args Field Component (special handling for args structure)
const ArgsField: React.FC<ArgsFieldProps> = ({ argsData, onChange, onRemove }) => {
  const { arrayConstraints = [], indexedElements = {} } = argsData;

  const addArrayConstraint = (): void => {
    onChange({
      ...argsData,
      arrayConstraints: [...arrayConstraints, { type: 'lengthEq', value: '' }]
    });
  };

  const updateArrayConstraint = (index: number, constraint: Constraint): void => {
    const newConstraints = [...arrayConstraints];
    newConstraints[index] = constraint;
    onChange({ ...argsData, arrayConstraints: newConstraints });
  };

  const removeArrayConstraint = (index: number): void => {
    const newConstraints = [...arrayConstraints];
    newConstraints.splice(index, 1);
    onChange({ ...argsData, arrayConstraints: newConstraints });
  };

  const addIndexedElement = (): void => {
    const nextIndex = Math.max(-1, ...Object.keys(indexedElements).map(Number)) + 1;
    onChange({
      ...argsData,
      indexedElements: {
        ...indexedElements,
        [nextIndex]: [{ type: 'const', value: '' }]
      }
    });
  };

  const updateIndexedElement = (index: string, constraints: Constraint[]): void => {
    onChange({
      ...argsData,
      indexedElements: {
        ...indexedElements,
        [index]: constraints
      }
    });
  };

  const removeIndexedElement = (index: string): void => {
    const newElements = { ...indexedElements };
    delete newElements[index];
    onChange({ ...argsData, indexedElements: newElements });
  };

  return (
    <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-lg font-semibold text-blue-800">Args Configuration</Label>
          <p className="text-sm text-blue-600">Array-level constraints and indexed elements</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Array-level constraints */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Array Constraints</Label>
          <Button variant="outline" size="sm" onClick={addArrayConstraint}>
            <Plus className="h-4 w-4 mr-1" />
            Add Array Constraint
          </Button>
        </div>

        {arrayConstraints.map((constraint, index) => (
          <ConstraintInput
            key={index}
            constraint={constraint}
            onChange={(c: Constraint) => updateArrayConstraint(index, c)}
            onRemove={() => removeArrayConstraint(index)}
            canRemove={arrayConstraints.length > 1}
          />
        ))}
      </div>

      {/* Indexed elements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Indexed Elements</Label>
          <Button variant="outline" size="sm" onClick={addIndexedElement}>
            <Plus className="h-4 w-4 mr-1" />
            Add Element
          </Button>
        </div>

        {Object.entries(indexedElements)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([index, constraints]) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Element [{index}]</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIndexedElement(index)}
                  className="text-red-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>

              {constraints.map((constraint, cIndex) => (
                <ConstraintInput
                  key={cIndex}
                  constraint={constraint}
                  onChange={(c: Constraint) => {
                    const newConstraints = [...constraints];
                    newConstraints[cIndex] = c;
                    updateIndexedElement(index, newConstraints);
                  }}
                  onRemove={() => {
                    const newConstraints = [...constraints];
                    newConstraints.splice(cIndex, 1);
                    updateIndexedElement(index, newConstraints);
                  }}
                  canRemove={constraints.length > 1}
                />
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateIndexedElement(index, [...constraints, { type: 'const', value: '' }]);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Constraint
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
};

// Field Component
const PolicyFieldComponent: React.FC<PolicyFieldProps> = ({ field, onChange, onRemove, isArgsField = false }) => {
  if (isArgsField) {
    return (
      <ArgsField
        argsData={field as ArgsField}
        onChange={(argsData: ArgsField) => onChange(argsData)}
        onRemove={onRemove}
      />
    );
  }

  const policyField = field as PolicyField;

  const addConstraint = (): void => {
    onChange({
      ...policyField,
      constraints: [...policyField.constraints, { type: 'const', value: '' }]
    });
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

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium">Property Path</Label>
          <Input
            placeholder="e.g., functionName, to, decoded.value"
            value={policyField.property || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...policyField, property: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports nested paths like decoded.functionName or payload.message
          </p>
        </div>

        <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-600 mt-6">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Constraints</Label>
          <Button variant="outline" size="sm" onClick={addConstraint}>
            <Plus className="h-4 w-4 mr-1" />
            Add Constraint
          </Button>
        </div>

        {policyField.constraints.map((constraint, index) => (
          <ConstraintInput
            key={index}
            constraint={constraint}
            onChange={(c: Constraint) => updateConstraint(index, c)}
            onRemove={() => removeConstraint(index)}
            canRemove={policyField.constraints.length > 1}
          />
        ))}
      </div>
    </div>
  );
};

// Rule Component
const PolicyRuleComponent: React.FC<PolicyRuleProps> = ({ rule, onChange, onRemove }) => {
  const [isOpen, setIsOpen] = useState(true);

  const applyTemplate = (templateKey: string): void => {
    const template = TEMPLATES[templateKey];
    if (!template) return;

    const newFields = template.fields.map(field => ({
      property: field.property,
      constraints: [{ type: field.constraint, value: field.value }]
    }));

    onChange({
      ...rule,
      method: template.method,
      fields: newFields
    });
  };

  const addField = (): void => {
    onChange({
      ...rule,
      fields: [...rule.fields, { property: '', constraints: [{ type: 'const', value: '' }] }]
    });
  };

  const addArgsField = (): void => {
    onChange({
      ...rule,
      argsField: {
        arrayConstraints: [{ type: 'lengthEq', value: '' }],
        indexedElements: {}
      }
    });
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

  const updateArgsField = (argsField: ArgsField): void => {
    onChange({ ...rule, argsField });
  };

  const removeArgsField = (): void => {
    onChange({ ...rule, argsField: null });
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {rule.type === 'allow' ? '✓' : '⚠'} {rule.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div>
              <Label>Quick Template</Label>
              <Select value="" onValueChange={applyTemplate}>
                <SelectTrigger>
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
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method</Label>
                <Select value={rule.method || ''} onValueChange={(method: string) =>
                  onChange({ ...rule, method })
                }>
                  <SelectTrigger>
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

              <div>
                <Label>Chain</Label>
                <Input
                  placeholder="e.g., evm:eip155:1"
                  value={rule.chain || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...rule, chain: e.target.value })}
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Property Constraints</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                  {!rule.argsField && (
                    <Button variant="outline" size="sm" onClick={addArgsField}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Args
                    </Button>
                  )}
                </div>
              </div>

              {/* Args Field */}
              {rule.argsField && (
                <PolicyFieldComponent
                  field={rule.argsField}
                  onChange={updateArgsField}
                  onRemove={removeArgsField}
                  isArgsField={true}
                />
              )}

              {/* Regular Fields */}
              {rule.fields.map((field, index) => (
                <PolicyFieldComponent
                  key={index}
                  field={field}
                  onChange={(f: PolicyField | ArgsField) => updateField(index, f as PolicyField)}
                  onRemove={() => removeField(index)}
                  isArgsField={false}
                />
              ))}

              {rule.fields.length === 0 && !rule.argsField && (
                <div className="text-center p-8 border border-dashed rounded-lg text-gray-500">
                  No constraints added. Click "Add Field", "Add Args", or choose a template to get started.
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default function PolicyBuilder(): JSX.Element {
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [jsonValue, setJsonValue] = useState<string>('{\n  "allow": [],\n  "deny": []\n}');
  const [activeTab, setActiveTab] = useState<string>('interactive');
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);

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

      // Handle special args field
      if (rule.argsField) {
        const argsData: Record<string, unknown> = {};

        // Add array-level constraints
        rule.argsField.arrayConstraints?.forEach(constraint => {
          if (constraint.value !== '' && constraint.value !== null && constraint.value !== undefined) {
            argsData[constraint.type] = constraint.value;
          }
        });

        // Add indexed elements
        Object.entries(rule.argsField.indexedElements || {}).forEach(([index, constraints]) => {
          const validConstraints = constraints.filter(c =>
            c.value !== '' && c.value !== null && c.value !== undefined
          );

          if (validConstraints.length > 0) {
            if (validConstraints.length === 1) {
              argsData[index] = { [validConstraints[0].type]: validConstraints[0].value };
            } else {
              const constraintObj: Record<string, unknown> = {};
              validConstraints.forEach(c => {
                constraintObj[c.type] = c.value;
              });
              argsData[index] = constraintObj;
            }
          }
        });

        if (Object.keys(argsData).length > 0) {
          sectionData.args = argsData;
        }
      }

      // Handle regular fields
      rule.fields.forEach(field => {
        if (!field.property || field.constraints.length === 0) return;

        const validConstraints = field.constraints.filter(c =>
          c.value !== '' && c.value !== null && c.value !== undefined
        );

        if (validConstraints.length === 0) return;

        let constraintValue: Record<string, unknown>;
        if (validConstraints.length === 1) {
          constraintValue = { [validConstraints[0].type]: validConstraints[0].value };
        } else {
          constraintValue = {};
          validConstraints.forEach(c => {
            constraintValue[c.type] = c.value;
          });
        }

        setNestedProperty(sectionData, field.property, constraintValue);
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
        const extractFields = (obj: Record<string, unknown>, prefix = ''): void => {
          Object.entries(obj).forEach(([key, value]) => {
            // Special handling for args
            if (key === 'args' && !prefix) {
              const argsField: ArgsField = {
                arrayConstraints: [],
                indexedElements: {}
              };

              Object.entries(value as Record<string, unknown>).forEach(([argKey, argValue]) => {
                if (/^\d+$/.test(argKey)) {
                  // Indexed element
                  const constraints: Constraint[] = [];
                  if (argValue && typeof argValue === 'object') {
                    Object.entries(argValue as Record<string, unknown>).forEach(([constraintType, constraintValue]) => {
                      if (CONSTRAINT_TYPES[constraintType]) {
                        constraints.push({ type: constraintType, value: constraintValue });
                      }
                    });
                  }
                  if (constraints.length > 0) {
                    argsField.indexedElements[argKey] = constraints;
                  }
                } else if (CONSTRAINT_TYPES[argKey]) {
                  // Array-level constraint
                  argsField.arrayConstraints.push({ type: argKey, value: argValue });
                }
              });

              if (argsField.arrayConstraints.length > 0 || Object.keys(argsField.indexedElements).length > 0) {
                rule.argsField = argsField;
              }
              return;
            }

            const path = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
              const constraintKeys = Object.keys(value as Record<string, unknown>);
              const numericKeys = constraintKeys.filter(k => /^\d+$/.test(k));
              const constraintOnlyKeys = constraintKeys.filter(k => CONSTRAINT_TYPES[k]);
              const mixedStructure = numericKeys.length > 0 && constraintOnlyKeys.length > 0;

              if (mixedStructure) {
                // Handle mixed structure: constraints + indexed elements
                if (constraintOnlyKeys.length > 0) {
                  const constraints = constraintOnlyKeys.map(k => ({
                    type: k,
                    value: (value as Record<string, unknown>)[k]
                  }));
                  rule.fields.push({ property: path, constraints });
                }

                numericKeys.forEach(indexKey => {
                  extractFields({ [indexKey]: (value as Record<string, unknown>)[indexKey] }, path);
                });
              } else if (constraintOnlyKeys.length > 0) {
                // Pure constraint object
                const constraints = constraintOnlyKeys.map(k => ({
                  type: k,
                  value: (value as Record<string, unknown>)[k]
                }));
                rule.fields.push({ property: path, constraints });
              } else {
                // Regular nested object - recurse
                extractFields(value as Record<string, unknown>, path);
              }
            }
          });
        };

        extractFields(section);
        newRules.push(rule);
      });
    });

    return newRules;
  }, []);

  // Update JSON when rules change
  useEffect(() => {
    if (activeTab === 'interactive') {
      const policy = rulesToPolicy(rules);
      setJsonValue(JSON.stringify(policy, null, 2));
    }
  }, [rules, activeTab, rulesToPolicy]);

  // Handle JSON changes
  const handleJsonChange = (value: string): void => {
    setJsonValue(value);

    try {
      const parsed = JSON.parse(value) as PolicyObject;
      setIsJsonValid(true);

      if (activeTab === 'json') {
        const newRules = policyToRules(parsed);
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full inset-shadow-tabs h-10 p-1">
          <TabsTrigger value="interactive" className='font-normal data-[state=active]:text-primary-800 text-primary-400'>Interactive <Icon name='swipe' /></TabsTrigger>
          <TabsTrigger value="json"><Icon name='code' /> JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6 max-h-[400px] overflow-y-scroll hidebar">
          {/* Add Rule Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="cursor-pointer transition-colors shadow-none inset-shadow-policy-cards rounded-[12px]"
              onClick={() => addRule('allow')}
            >
              <div className="px-[18px] py-6 bg-primary-25 rounded-[12px]">
                <Icon name='check' className='text-primary-800 size-6 mb-4' />
                <div className='flex flex-col'>
                  <h3 className="font-medium">Add allow rule</h3>
                  <p className="text-sm text-primary-400">Define permitted actions</p>
                </div>
              </div>
            </div>

            <div
              className="cursor-pointer transition-colors shadow-none inset-shadow-policy-cards rounded-[12px]"
              onClick={() => addRule('deny')}
            >
              <div className="px-[18px] py-6 bg-primary-25 rounded-[12px]">
                <Icon name='warning' className='text-primary-800 size-6 mb-4' />
                <div className='flex flex-col'>
                  <h3 className="font-medium">Add deny rule</h3>
                  <p className="text-sm text-primary-400">Define blocked actions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            {rules.map(rule => (
              <PolicyRuleComponent
                key={rule.id}
                rule={rule}
                onChange={(updatedRule: PolicyRule) => updateRule(rule.id, updatedRule)}
                onRemove={() => removeRule(rule.id)}
              />
            ))}
          </div>

          {rules.length === 0 && (
            <div className="text-center rounded-lg">
              <h3 className="text-lg font-medium mb-2">No rules defined</h3>
              <p>Click "Add allow rule" or "Add deny rule" above to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="json" className="space-y-4">

          <div className="border rounded-lg overflow-y-scroll max-h-[400px] hidebar">
            <CodeMirror
              value={jsonValue}
              onChange={(value) => handleJsonChange(value)}
              extensions={[json(), myFontTheme]}
              theme={githubLight}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
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
                  const parsed = JSON.parse(jsonValue);
                  const formatted = JSON.stringify(parsed, null, 2);
                  setJsonValue(formatted);
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
