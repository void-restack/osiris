import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export type ConstraintType =
  | 'bigIntMin' | 'bigIntMax' | 'bigIntEq'
  | 'addressEq' | 'addressInList'
  | 'numericMin' | 'numericMax' | 'numericEq' | 'numericLt' | 'numericLte' | 'numericGt' | 'numericGte'
  | 'stringContains' | 'stringStartsWith' | 'stringEndsWith'
  | 'const' | 'enum' | 'pattern' | 'minimum' | 'maximum' | 'minLength' | 'maxLength' | 'lengthEq'
  | 'min' | 'max' | 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'startsWith' | 'endsWith' | 'inList' | 'matches' | 'is';

export interface ConstraintValue {
  type: ConstraintType;
  value: any;
}

export interface PolicyField {
  property: string;
  constraints: ConstraintValue[];
  section: 'decoded' | 'payload';
}

const CONSTRAINT_OPTIONS: Record<ConstraintType, { label: string; valueType: 'string' | 'number' | 'array' }> = {
  bigIntMin: { label: 'bigIntMin', valueType: 'string' },
  bigIntMax: { label: 'bigIntMax', valueType: 'string' },
  bigIntEq: { label: 'bigIntEq', valueType: 'string' },
  addressEq: { label: 'addressEq', valueType: 'string' },
  addressInList: { label: 'addressInList', valueType: 'array' },
  numericMin: { label: 'numericMin', valueType: 'number' },
  numericMax: { label: 'numericMax', valueType: 'number' },
  numericEq: { label: 'numericEq', valueType: 'number' },
  numericLt: { label: 'numericLt', valueType: 'number' },
  numericLte: { label: 'numericLte', valueType: 'number' },
  numericGt: { label: 'numericGt', valueType: 'number' },
  numericGte: { label: 'numericGte', valueType: 'number' },
  stringContains: { label: 'stringContains', valueType: 'string' },
  stringStartsWith: { label: 'stringStartsWith', valueType: 'string' },
  stringEndsWith: { label: 'stringEndsWith', valueType: 'string' },

  // JSON Schema
  const: { label: 'const', valueType: 'string' },
  enum: { label: 'enum', valueType: 'array' },
  pattern: { label: 'pattern', valueType: 'string' },
  minimum: { label: 'minimum', valueType: 'number' },
  maximum: { label: 'maximum', valueType: 'number' },
  minLength: { label: 'minLength', valueType: 'number' },
  maxLength: { label: 'maxLength', valueType: 'number' },
  lengthEq: { label: 'lengthEq', valueType: 'number' },

  // Aliases
  min: { label: 'min', valueType: 'string' },
  max: { label: 'max', valueType: 'string' },
  eq: { label: 'eq', valueType: 'string' },
  lt: { label: 'lt', valueType: 'number' },
  lte: { label: 'lte', valueType: 'number' },
  gt: { label: 'gt', valueType: 'number' },
  gte: { label: 'gte', valueType: 'number' },
  contains: { label: 'contains', valueType: 'string' },
  startsWith: { label: 'startsWith', valueType: 'string' },
  endsWith: { label: 'endsWith', valueType: 'string' },
  inList: { label: 'inList', valueType: 'array' },
  matches: { label: 'matches', valueType: 'string' },
  is: { label: 'is', valueType: 'string' }
};

// Constraint Input Component
interface ConstraintInputProps {
  constraint: ConstraintValue;
  onChange: (constraint: ConstraintValue) => void;
  onRemove: () => void;
  showRemove?: boolean;
}

function ConstraintInput({ constraint, onChange, onRemove, showRemove = true }: ConstraintInputProps) {
  const id = useId();
  const metadata = CONSTRAINT_OPTIONS[constraint.type];

  const handleValueChange = (value: any) => {
    onChange({ ...constraint, value });
  };

  const handleTypeChange = (newType: ConstraintType) => {
    const newMetadata = CONSTRAINT_OPTIONS[newType];
    let newValue = '';

    // Reset value based on new type
    if (newMetadata.valueType === 'number') {
      newValue = 0;
    } else if (newMetadata.valueType === 'array') {
      newValue = [];
    }

    onChange({ type: newType, value: newValue });
  };

  const renderValueInput = () => {
    if (metadata.valueType === 'array') {
      return (
        <Textarea
          id={id}
          className="-ms-px rounded-s-none shadow-none focus-visible:z-10 min-h-[38px] resize-none"
          placeholder="value1, value2, value3"
          value={Array.isArray(constraint.value) ? constraint.value.join(', ') : constraint.value || ''}
          onChange={(e) => {
            const arrayValue = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
            handleValueChange(arrayValue);
          }}
        />
      );
    }

    if (metadata.valueType === 'number') {
      return (
        <Input
          id={id}
          type="number"
          className="-ms-px rounded-s-none shadow-none focus-visible:z-10"
          placeholder="0"
          value={constraint.value || ''}
          onChange={(e) => {
            const numValue = e.target.value === '' ? '' : parseFloat(e.target.value);
            handleValueChange(isNaN(numValue as number) ? '' : numValue);
          }}
        />
      );
    }

    return (
      <Input
        id={id}
        type="text"
        className="-ms-px rounded-s-none shadow-none focus-visible:z-10"
        placeholder="Enter value"
        value={constraint.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
      />
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-md shadow-xs flex-1">
        <SelectNative
          className="text-muted-foreground hover:text-foreground w-fit rounded-e-none shadow-none min-w-[140px]"
          value={constraint.type}
          onChange={(e) => handleTypeChange(e.target.value as ConstraintType)}
        >
          {Object.entries(CONSTRAINT_OPTIONS).map(([key, option]) => (
            <option key={key} value={key}>
              {option.label}
            </option>
          ))}
        </SelectNative>
        {renderValueInput()}
      </div>

      {showRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 px-2"
        >
          <Minus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Field Component
interface PolicyFieldProps {
  field: PolicyField;
  onChange: (field: PolicyField) => void;
  onRemove: () => void;
}

function PolicyFieldComponent({ field, onChange, onRemove }: PolicyFieldProps) {
  const addConstraint = () => {
    const newConstraint: ConstraintValue = {
      type: 'const',
      value: ''
    };

    onChange({
      ...field,
      constraints: [...field.constraints, newConstraint]
    });
  };

  const updateConstraint = (index: number, constraint: ConstraintValue) => {
    const newConstraints = [...field.constraints];
    newConstraints[index] = constraint;
    onChange({ ...field, constraints: newConstraints });
  };

  const removeConstraint = (index: number) => {
    const newConstraints = [...field.constraints];
    newConstraints.splice(index, 1);
    onChange({ ...field, constraints: newConstraints });
  };

  return (
    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Property</Label>
          <Input
            placeholder={field.section === 'decoded' ? "e.g., to, functionName, args.0" : "e.g., message, data"}
            value={field.property}
            onChange={(e) => onChange({ ...field, property: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 mt-7">
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
            {field.section}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Constraints</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addConstraint}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Constraint
          </Button>
        </div>

        {field.constraints.map((constraint, index) => (
          <ConstraintInput
            key={index}
            constraint={constraint}
            onChange={(c) => updateConstraint(index, c)}
            onRemove={() => removeConstraint(index)}
            showRemove={field.constraints.length > 1}
          />
        ))}

        {field.constraints.length === 0 && (
          <div className="text-sm text-gray-500 p-3 border border-dashed rounded-md text-center">
            No constraints added. Click "Add Constraint" to add validation rules.
          </div>
        )}
      </div>
    </div>
  );
}

// Main Policy Rule Form
interface PolicyRuleFormProps {
  ruleType: 'allow' | 'deny';
  onUpdate: (rule: any) => void;
}

export function PolicyRuleForm({ ruleType, onUpdate }: PolicyRuleFormProps) {
  const [method, setMethod] = useState('');
  const [chain, setChain] = useState('');
  const [fields, setFields] = useState<PolicyField[]>([]);

  // Auto-update policy when form changes
  const updatePolicy = () => {
    const policy = generatePolicy();
    onUpdate(policy);
  };

  const addField = (section: 'decoded' | 'payload') => {
    const newField: PolicyField = {
      property: '',
      constraints: [{ type: 'const', value: '' }],
      section
    };

    setFields(prev => {
      const newFields = [...prev, newField];
      setTimeout(() => updatePolicy(), 0);
      return newFields;
    });
  };

  const updateField = (index: number, field: PolicyField) => {
    setFields(prev => {
      const newFields = [...prev];
      newFields[index] = field;
      setTimeout(() => updatePolicy(), 0);
      return newFields;
    });
  };

  const removeField = (index: number) => {
    setFields(prev => {
      const newFields = [...prev];
      newFields.splice(index, 1);
      setTimeout(() => updatePolicy(), 0);
      return newFields;
    });
  };

  const generatePolicy = () => {
    const rule: any = {};

    if (method) rule.method = method;
    if (chain) rule.chain = chain;

    // Transform fields to policy format
    const transformFields = (sectionFields: PolicyField[]) => {
      const result: any = {};

      sectionFields.forEach(field => {
        if (field.property && field.constraints.length > 0) {
          // Filter out empty constraints
          const validConstraints = field.constraints.filter(c =>
            c.value !== '' && c.value !== null && c.value !== undefined
          );

          if (validConstraints.length === 0) return;

          if (validConstraints.length === 1) {
            result[field.property] = {
              [validConstraints[0].type]: validConstraints[0].value
            };
          } else {
            const constraintObj: any = {};
            validConstraints.forEach(constraint => {
              constraintObj[constraint.type] = constraint.value;
            });
            result[field.property] = constraintObj;
          }
        }
      });

      return result;
    };

    const decodedFields = fields.filter(f => f.section === 'decoded');
    const payloadFields = fields.filter(f => f.section === 'payload');

    const decodedResult = transformFields(decodedFields);
    if (Object.keys(decodedResult).length > 0) {
      rule.decoded = decodedResult;
    }

    if (method === 'signMessage') {
      const payloadResult = transformFields(payloadFields);
      if (Object.keys(payloadResult).length > 0) {
        rule.payload = payloadResult;
      }
    }

    return rule;
  };

  const handleSubmit = () => {
    const policy = generatePolicy();
    onUpdate(policy);
  };

  const decodedFields = fields.filter(f => f.section === 'decoded');
  const payloadFields = fields.filter(f => f.section === 'payload');

  return (
    <div className="space-y-6">
      {/* Basic Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Method</Label>
          <Select value={method} onValueChange={(value) => {
            setMethod(value);
            setTimeout(() => updatePolicy(), 0);
          }}>
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
            placeholder="e.g., evm:eip155:137"
            value={chain}
            onChange={(e) => {
              setChain(e.target.value);
              setTimeout(() => updatePolicy(), 0);
            }}
          />
        </div>
      </div>

      {/* Fields Section */}
      <div className="space-y-4">
        {/* Decoded Fields */}
        {decodedFields.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Decoded Properties</h3>
            <div className="space-y-4">
              {decodedFields.map((field, index) => (
                <PolicyFieldComponent
                  key={fields.indexOf(field)}
                  field={field}
                  onChange={(f) => updateField(fields.indexOf(field), f)}
                  onRemove={() => removeField(fields.indexOf(field))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payload Fields - Only for signMessage */}
        {method === 'signMessage' && payloadFields.length > 0 && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-medium mb-4">Payload Properties</h3>
            <div className="space-y-4">
              {payloadFields.map((field, index) => (
                <PolicyFieldComponent
                  key={fields.indexOf(field)}
                  field={field}
                  onChange={(f) => updateField(fields.indexOf(field), f)}
                  onRemove={() => removeField(fields.indexOf(field))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {fields.length === 0 && (
          <div className="text-sm text-gray-500 p-8 border border-dashed rounded-md text-center">
            No fields added. Use the buttons below to add constraints.
          </div>
        )}
      </div>

      {/* Add Field Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => addField('decoded')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Decoded Field
        </Button>

        {method === 'signMessage' && (
          <Button
            variant="outline"
            onClick={() => addField('payload')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payload Field
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const policy = generatePolicy();
            console.log('Generated Policy:', JSON.stringify(policy, null, 2));
          }}
        >
          Preview JSON
        </Button>
        <Button onClick={handleSubmit}>
          {ruleType === 'allow' ? 'Add Allow Rule' : 'Add Deny Rule'}
        </Button>
      </div>
    </div>
  );
}
