import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Minus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const TEMPLATES = {
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

const CONSTRAINT_TYPES = {
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
const setNestedProperty = (obj, path, value) => {
  const keys = path.split(/[.\[\]]/).filter(Boolean);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (!(key in current)) {
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = current[key];
  }

  const finalKey = keys[keys.length - 1];
  if (value === undefined) {
    delete current[finalKey];
  } else {
    current[finalKey] = value;
  }
};

const cleanEmptyObjects = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(cleanEmptyObjects).filter(item =>
      item !== null && item !== undefined &&
      (typeof item !== 'object' || Object.keys(item).length > 0)
    );
  }

  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanEmptyObjects(value);
      if (cleanedValue !== null && cleanedValue !== undefined &&
        (typeof cleanedValue !== 'object' || Object.keys(cleanedValue).length > 0)) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
};

// Constraint Input Component
const ConstraintInput = ({ constraint, onChange, onRemove, canRemove = true }) => {
  const constraintType = CONSTRAINT_TYPES[constraint.type] || CONSTRAINT_TYPES.const;

  const handleValueChange = (newValue) => {
    let processedValue = newValue;

    if (constraintType.valueType === 'number') {
      processedValue = newValue === '' ? '' : Number(newValue);
    } else if (constraintType.valueType === 'array') {
      processedValue = typeof newValue === 'string'
        ? newValue.split(',').map(v => v.trim()).filter(Boolean)
        : newValue;
    }

    onChange({ ...constraint, value: processedValue });
  };

  const renderValueInput = () => {
    if (constraintType.valueType === 'array') {
      // Handle complex array constraints like anyOf
      if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
        const displayValue = typeof constraint.value === 'string'
          ? constraint.value
          : JSON.stringify(constraint.value, null, 2);

        return (
          <Textarea
            placeholder="JSON array of constraint objects"
            value={displayValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(parsed);
              } catch {
                handleValueChange(e.target.value);
              }
            }}
            className="min-h-[80px] resize-none font-mono text-sm"
          />
        );
      }

      // Regular array handling
      const displayValue = Array.isArray(constraint.value)
        ? constraint.value.join(', ')
        : constraint.value || '';

      return (
        <Textarea
          placeholder="value1, value2, value3"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
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
          onChange={(e) => {
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
        value={constraint.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
      />
    );
  };

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Select value={constraint.type} onValueChange={(type) =>
          onChange({ type, value: constraintType.valueType === 'number' ? 0 : '' })
        }>
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
        {renderValueInput()}
      </div>

      {canRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-600">
          <Minus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Field Component
const PolicyField = ({ field, onChange, onRemove }) => {
  const addConstraint = () => {
    onChange({
      ...field,
      constraints: [...field.constraints, { type: 'const', value: '' }]
    });
  };

  const updateConstraint = (index, constraint) => {
    const newConstraints = [...field.constraints];
    newConstraints[index] = constraint;
    onChange({ ...field, constraints: newConstraints });
  };

  const removeConstraint = (index) => {
    const newConstraints = [...field.constraints];
    newConstraints.splice(index, 1);
    onChange({ ...field, constraints: newConstraints });
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium">Property Path</Label>
          <Input
            placeholder="e.g., args.0.tokenIn, functionName, to"
            value={field.property || ''}
            onChange={(e) => onChange({ ...field, property: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports nested paths like args.0.fee or decoded.functionName
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

        {field.constraints.map((constraint, index) => (
          <ConstraintInput
            key={index}
            constraint={constraint}
            onChange={(c) => updateConstraint(index, c)}
            onRemove={() => removeConstraint(index)}
            canRemove={field.constraints.length > 1}
          />
        ))}
      </div>
    </div>
  );
};

// Rule Component
const PolicyRule = ({ rule, onChange, onRemove }) => {
  const [isOpen, setIsOpen] = useState(true);

  const applyTemplate = (templateKey) => {
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

  const addField = () => {
    onChange({
      ...rule,
      fields: [...rule.fields, { property: '', constraints: [{ type: 'const', value: '' }] }]
    });
  };

  const updateField = (index, field) => {
    const newFields = [...rule.fields];
    newFields[index] = field;
    onChange({ ...rule, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = [...rule.fields];
    newFields.splice(index, 1);
    onChange({ ...rule, fields: newFields });
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
                <Select value={rule.method || ''} onValueChange={(method) =>
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
                  onChange={(e) => onChange({ ...rule, chain: e.target.value })}
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Property Constraints</Label>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {rule.fields.map((field, index) => (
                <PolicyField
                  key={index}
                  field={field}
                  onChange={(f) => updateField(index, f)}
                  onRemove={() => removeField(index)}
                />
              ))}

              {rule.fields.length === 0 && (
                <div className="text-center p-8 border border-dashed rounded-lg text-gray-500">
                  No constraints added. Click "Add Field" or choose a template to get started.
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Main PolicyBuilder Component
export default function PolicyBuilder() {
  const [rules, setRules] = useState([]);
  const [jsonValue, setJsonValue] = useState('{\n  "allow": [],\n  "deny": []\n}');
  const [activeTab, setActiveTab] = useState('interactive');
  const [isJsonValid, setIsJsonValid] = useState(true);

  // Convert rules to policy object
  const rulesToPolicy = useCallback((rulesArray) => {
    const policy = { allow: [], deny: [] };

    rulesArray.forEach(rule => {
      if (!rule.method && rule.fields.length === 0) return;

      const policyRule = {};

      if (rule.method) policyRule.method = rule.method;
      if (rule.chain) policyRule.chain = rule.chain;

      // Process fields into nested structure
      const section = rule.method === 'signMessage' ? 'payload' : 'decoded';
      const sectionData = {};

      rule.fields.forEach(field => {
        if (!field.property || field.constraints.length === 0) return;

        const validConstraints = field.constraints.filter(c =>
          c.value !== '' && c.value !== null && c.value !== undefined
        );

        if (validConstraints.length === 0) return;

        let constraintValue;
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
        policy[rule.type].push(cleanEmptyObjects(policyRule));
      }
    });

    return policy;
  }, []);

  // Convert policy object back to rules
  const policyToRules = useCallback((policy) => {
    const newRules = [];
    let ruleId = 1;

    ['allow', 'deny'].forEach(type => {
      (policy[type] || []).forEach(policyRule => {
        const rule = {
          id: ruleId++,
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${newRules.filter(r => r.type === type).length + 1}`,
          method: policyRule.method || '',
          chain: policyRule.chain || '',
          fields: []
        };

        // Extract fields from decoded/payload section
        const section = policyRule.decoded || policyRule.payload || {};
        const extractFields = (obj, prefix = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
              const constraintKeys = Object.keys(value);
              const numericKeys = constraintKeys.filter(k => /^\d+$/.test(k));
              const constraintOnlyKeys = constraintKeys.filter(k => CONSTRAINT_TYPES[k]);
              const mixedStructure = numericKeys.length > 0 && constraintOnlyKeys.length > 0;

              if (mixedStructure) {
                // Handle mixed args structure: constraints + indexed elements
                // First, handle array-level constraints
                if (constraintOnlyKeys.length > 0) {
                  const constraints = constraintOnlyKeys.map(k => ({ type: k, value: value[k] }));
                  rule.fields.push({ property: path, constraints });
                }

                // Then handle indexed elements
                numericKeys.forEach(indexKey => {
                  extractFields({ [indexKey]: value[indexKey] }, path);
                });
              } else if (constraintOnlyKeys.length > 0) {
                // Pure constraint object
                const constraints = constraintOnlyKeys.map(k => ({ type: k, value: value[k] }));
                rule.fields.push({ property: path, constraints });
              } else {
                // Regular nested object - recurse
                extractFields(value, path);
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
  const handleJsonChange = (value) => {
    setJsonValue(value);

    try {
      const parsed = JSON.parse(value);
      setIsJsonValid(true);

      if (activeTab === 'json') {
        const newRules = policyToRules(parsed);
        setRules(newRules);
      }
    } catch {
      setIsJsonValid(false);
    }
  };

  const addRule = (type) => {
    const newRule = {
      id: Date.now(),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${rules.filter(r => r.type === type).length + 1}`,
      method: '',
      chain: '',
      fields: []
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id, updatedRule) => {
    setRules(rules.map(rule => rule.id === id ? updatedRule : rule));
  };

  const removeRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 border border-amber-300 h-[768px] overflow-y-scroll hidebar">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6">
          {/* Add Rule Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:bg-green-50 transition-colors"
              onClick={() => addRule('allow')}
            >
              <CardContent className="p-6 text-center">
                <div className="text-green-600 text-2xl mb-2">✓</div>
                <h3 className="font-semibold">Add allow rule</h3>
                <p className="text-sm text-gray-600">Define permitted actions</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-red-50 transition-colors"
              onClick={() => addRule('deny')}
            >
              <CardContent className="p-6 text-center">
                <div className="text-red-600 text-2xl mb-2">⚠</div>
                <h3 className="font-semibold">Add deny rule</h3>
                <p className="text-sm text-gray-600">Define blocked actions</p>
              </CardContent>
            </Card>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            {rules.map(rule => (
              <PolicyRule
                key={rule.id}
                rule={rule}
                onChange={(updatedRule) => updateRule(rule.id, updatedRule)}
                onRemove={() => removeRule(rule.id)}
              />
            ))}
          </div>

          {rules.length === 0 && (
            <div className="text-center p-12 border border-dashed rounded-lg text-gray-500">
              <h3 className="text-lg font-medium mb-2">No rules defined</h3>
              <p>Click "Add allow rule" or "Add deny rule" above to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Policy JSON</Label>
            {!isJsonValid && (
              <span className="text-red-600 text-sm">Invalid JSON</span>
            )}
          </div>

          <Textarea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            className={`min-h-[400px] font-mono text-sm ${!isJsonValid ? 'border-red-500' : ''}`}
            placeholder="Enter your policy JSON..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
