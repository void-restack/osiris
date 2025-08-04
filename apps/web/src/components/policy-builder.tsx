import React, { useState, useEffect, useCallback } from 'react';
import Form from '@rjsf/core';
import type { RJSFSchema, UiSchema, WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { customizeValidator } from '@rjsf/validator-ajv8';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { githubLight } from "@uiw/codemirror-theme-github";
import { EditorView } from '@uiw/react-codemirror';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, ChevronDown } from 'lucide-react';

// Font theme for CodeMirror
const myFontTheme = EditorView.theme({
    '&': {
        fontFamily: '"Geist Mono", monospace',
        fontSize: '16px',
        lineHeight: '1.6'
    },
    '.cm-content': {
        fontFamily: '"Geist Mono", monospace'
    }
});

// Create custom AJV validator with policy-specific keywords
const customValidator = customizeValidator({}, (ajv) => {
    // Address keywords
    ajv.addKeyword({
        keyword: 'addressEq',
        type: 'string',
        compile: function (schema) {
            return function validate(data) {
                return data.toLowerCase() === schema.toLowerCase();
            };
        }
    });

    ajv.addKeyword({
        keyword: 'addressInList',
        type: 'string',
        compile: function (schema) {
            const addresses = schema.map(addr => addr.toLowerCase());
            return function validate(data) {
                return addresses.includes(data.toLowerCase());
            };
        }
    });

    // BigInt keywords
    ajv.addKeyword({
        keyword: 'bigIntMin',
        type: ['string', 'number'],
        compile: function (schema) {
            const min = BigInt(schema);
            return function validate(data) {
                try {
                    return BigInt(data) >= min;
                } catch {
                    return false;
                }
            };
        }
    });

    ajv.addKeyword({
        keyword: 'bigIntMax',
        type: ['string', 'number'],
        compile: function (schema) {
            const max = BigInt(schema);
            return function validate(data) {
                try {
                    return BigInt(data) <= max;
                } catch {
                    return false;
                }
            };
        }
    });

    ajv.addKeyword({
        keyword: 'bigIntEq',
        type: ['string', 'number'],
        compile: function (schema) {
            const eq = BigInt(schema);
            return function validate(data) {
                try {
                    return BigInt(data) === eq;
                } catch {
                    return false;
                }
            };
        }
    });

    // Numeric keywords
    ['numericMin', 'numericMax', 'numericEq', 'numericLt', 'numericLte', 'numericGt', 'numericGte'].forEach(keyword => {
        const op = keyword.replace('numeric', '').toLowerCase();
        ajv.addKeyword({
            keyword,
            type: ['string', 'number'],
            compile: function (schema) {
                return function validate(data) {
                    const num = Number(data);
                    if (isNaN(num)) return false;
                    switch (op) {
                        case 'min': return num >= schema;
                        case 'max': return num <= schema;
                        case 'eq': return num === schema;
                        case 'lt': return num < schema;
                        case 'lte': return num <= schema;
                        case 'gt': return num > schema;
                        case 'gte': return num >= schema;
                        default: return false;
                    }
                };
            }
        });
    });

    // String keywords
    ajv.addKeyword({
        keyword: 'stringContains',
        type: 'string',
        compile: function (schema) {
            return function validate(data) {
                return data.includes(schema);
            };
        }
    });

    ajv.addKeyword({
        keyword: 'stringStartsWith',
        type: 'string',
        compile: function (schema) {
            return function validate(data) {
                return data.startsWith(schema);
            };
        }
    });

    ajv.addKeyword({
        keyword: 'stringEndsWith',
        type: 'string',
        compile: function (schema) {
            return function validate(data) {
                return data.endsWith(schema);
            };
        }
    });

    // Length keywords
    ajv.addKeyword({
        keyword: 'lengthEq',
        type: ['string', 'array'],
        compile: function (schema) {
            return function validate(data) {
                return data.length === schema;
            };
        }
    });
});

// Custom widgets
const AddressWidget: React.FC<WidgetProps> = (props) => {
    const { value, onChange, required, disabled, readonly, options } = props;

    return (
        <div className="space-y-1">
            <Input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled || readonly}
                placeholder="0x..."
                className="font-mono"
            />
            {options.description && (
                <p className="text-xs text-gray-500">{options.description}</p>
            )}
        </div>
    );
};

const BigIntWidget: React.FC<WidgetProps> = (props) => {
    const { value, onChange, required, disabled, readonly, options } = props;

    return (
        <div className="space-y-1">
            <Input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled || readonly}
                placeholder="Enter large number..."
                className="font-mono"
            />
            {options.description && (
                <p className="text-xs text-gray-500">{options.description}</p>
            )}
        </div>
    );
};

const ConstraintWidget: React.FC<WidgetProps> = (props) => {
    const { schema, formData, onChange, options } = props;
    const constraintType = options.constraintType || 'const';

    const handleValueChange = (value: any) => {
        onChange({ [constraintType]: value });
    };

    const currentValue = formData?.[constraintType] || '';

    return (
        <div className="space-y-2">
            <Label className="text-sm">{options.title || constraintType}</Label>
            {['addressInList', 'enum'].includes(constraintType) ? (
                <Textarea
                    value={Array.isArray(currentValue) ? currentValue.join(', ') : currentValue}
                    onChange={(e) => {
                        const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                        handleValueChange(values);
                    }}
                    placeholder="value1, value2, value3"
                    className="min-h-[60px]"
                />
            ) : (
                <Input
                    type={['bigIntMin', 'bigIntMax', 'numericMin', 'numericMax'].includes(constraintType) ? 'text' : 'text'}
                    value={currentValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder="Enter value..."
                />
            )}
        </div>
    );
};

// Convert policy rule to JSON Schema
const policyRuleToSchema = (rule: any): { schema: RJSFSchema; uiSchema: UiSchema } => {
    const schema: RJSFSchema = {
        type: 'object',
        properties: {
            method: {
                type: 'string',
                title: 'Method',
                enum: ['signTransaction', 'signMessage', 'signTypedData', 'signRawPayloads']
            },
            chain: {
                type: 'string',
                title: 'Chain',
                description: 'e.g., evm:eip155:1'
            }
        },
        required: ['method']
    };

    const uiSchema: UiSchema = {
        'ui:order': ['method', 'chain', 'fields'],
        method: {
            'ui:widget': 'select'
        }
    };

    // Add decoded/payload based on method
    const section = rule.method === 'signMessage' ? 'payload' : 'decoded';

    if (rule.method) {
        schema.properties![section] = {
            type: 'object',
            title: section === 'payload' ? 'Payload Configuration' : 'Decoded Transaction',
            properties: {}
        };

        // Convert fields to schema properties
        if (rule[section]) {
            Object.entries(rule[section]).forEach(([fieldName, constraints]: [string, any]) => {
                if (fieldName === 'args') {
                    // Special handling for args
                    schema.properties![section].properties![fieldName] = {
                        type: 'object',
                        title: 'Arguments',
                        properties: {}
                    };

                    Object.entries(constraints).forEach(([key, value]: [string, any]) => {
                        if (!isNaN(Number(key))) {
                            // Indexed argument
                            schema.properties![section].properties![fieldName].properties![key] = {
                                type: 'object',
                                title: `Argument [${key}]`
                            };
                        } else {
                            // Array constraint
                            schema.properties![section].properties![fieldName][key] = value;
                        }
                    });
                } else {
                    // Regular field
                    schema.properties![section].properties![fieldName] = {
                        type: 'object',
                        title: fieldName
                    };
                }
            });
        }
    }

    return { schema, uiSchema };
};

// Convert JSON Schema form data back to policy format
const formDataToPolicy = (formData: any): any => {
    const policy: any = {
        method: formData.method,
        chain: formData.chain
    };

    const section = formData.method === 'signMessage' ? 'payload' : 'decoded';

    if (formData[section]) {
        policy[section] = formData[section];
    }

    // Clean empty values
    Object.keys(policy).forEach(key => {
        if (policy[key] === undefined || policy[key] === '') {
            delete policy[key];
        }
    });

    return policy;
};

// Field template for custom styling
const CustomFieldTemplate = (props: any) => {
    const { id, label, children, errors, help, description, hidden, required } = props;

    if (hidden) {
        return <div className="hidden">{children}</div>;
    }

    return (
        <div className="mb-4">
            {label && (
                <Label htmlFor={id} className="mb-1 block text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            {description && (
                <p className="text-xs text-gray-500 mb-1">{description}</p>
            )}
            {children}
            {errors && (
                <div className="text-red-500 text-sm mt-1">{errors}</div>
            )}
            {help && (
                <div className="text-gray-500 text-sm mt-1">{help}</div>
            )}
        </div>
    );
};

// Main PolicyBuilder component
export default function PolicyBuilder({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
    const [activeTab, setActiveTab] = useState('interactive');
    const [rules, setRules] = useState<any[]>([]);
    const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [internalJson, setInternalJson] = useState(value || '{\n  "allow": [],\n  "deny": []\n}');

    // Parse initial value
    useEffect(() => {
        if (value) {
            try {
                const policy = JSON.parse(value);
                const allRules: any[] = [];

                ['allow', 'deny'].forEach(type => {
                    (policy[type] || []).forEach((rule: any) => {
                        allRules.push({ ...rule, _type: type });
                    });
                });

                setRules(allRules);
                if (allRules.length > 0) {
                    setSelectedRuleIndex(0);
                    setFormData(allRules[0]);
                }
            } catch (e) {
                console.error('Failed to parse policy:', e);
            }
        }
    }, [value]);

    // Update JSON when rules change
    useEffect(() => {
        const policy: any = { allow: [], deny: [] };

        rules.forEach(rule => {
            const { _type, ...ruleData } = rule;
            policy[_type].push(ruleData);
        });

        const jsonStr = JSON.stringify(policy, null, 2);
        setInternalJson(jsonStr);
        onChange?.(jsonStr);
    }, [rules, onChange]);

    const addRule = (type: 'allow' | 'deny') => {
        const newRule = {
            _type: type,
            method: 'signTransaction',
            chain: '',
            decoded: {}
        };

        setRules([...rules, newRule]);
        setSelectedRuleIndex(rules.length);
        setFormData(newRule);
    };

    const updateRule = (index: number, data: any) => {
        const newRules = [...rules];
        newRules[index] = { ...data, _type: rules[index]._type };
        setRules(newRules);
    };

    const removeRule = (index: number) => {
        const newRules = rules.filter((_, i) => i !== index);
        setRules(newRules);

        if (selectedRuleIndex === index) {
            setSelectedRuleIndex(newRules.length > 0 ? 0 : null);
            setFormData(newRules.length > 0 ? newRules[0] : {});
        }
    };

    const handleFormChange = (data: any) => {
        setFormData(data.formData);
        if (selectedRuleIndex !== null) {
            updateRule(selectedRuleIndex, data.formData);
        }
    };

    const { schema, uiSchema } = selectedRuleIndex !== null && rules[selectedRuleIndex]
        ? policyRuleToSchema(rules[selectedRuleIndex])
        : { schema: {}, uiSchema: {} };

    const widgets: RegistryWidgetsType = {
        address: AddressWidget,
        bigint: BigIntWidget,
        constraint: ConstraintWidget
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                    <TabsTrigger value="interactive">Interactive</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="interactive" className="space-y-4">
                    {/* Rule Management */}
                    <div className="flex gap-4">
                        <Button onClick={() => addRule('allow')} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Allow Rule
                        </Button>
                        <Button onClick={() => addRule('deny')} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Deny Rule
                        </Button>
                    </div>

                    {/* Rule List */}
                    {rules.length > 0 && (
                        <div className="space-y-2">
                            <Label>Rules</Label>
                            <div className="space-y-2">
                                {rules.map((rule, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedRuleIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => {
                                            setSelectedRuleIndex(index);
                                            setFormData(rule);
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className={`font-medium ${rule._type === 'allow' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {rule._type.toUpperCase()}
                                                </span>
                                                <span className="ml-2 text-gray-600">{rule.method || 'No method'}</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeRule(index);
                                                }}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rule Editor */}
                    {selectedRuleIndex !== null && (
                        <div className="border rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-4">Edit Rule</h3>
                            <Form
                                schema={schema}
                                uiSchema={uiSchema}
                                formData={formData}
                                onChange={handleFormChange}
                                validator={customValidator}
                                widgets={widgets}
                                templates={{ FieldTemplate: CustomFieldTemplate }}
                            />
                        </div>
                    )}

                    {rules.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed rounded-lg">
                            <p className="text-gray-500">No rules defined. Add an allow or deny rule to get started.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="json">
                    <div className="border rounded-lg overflow-hidden">
                        <CodeMirror
                            value={internalJson}
                            onChange={(val) => {
                                setInternalJson(val);
                                try {
                                    const policy = JSON.parse(val);
                                    const allRules: any[] = [];

                                    ['allow', 'deny'].forEach(type => {
                                        (policy[type] || []).forEach((rule: any) => {
                                            allRules.push({ ...rule, _type: type });
                                        });
                                    });

                                    setRules(allRules);
                                    onChange?.(val);
                                } catch {
                                    // Invalid JSON
                                }
                            }}
                            extensions={[json(), myFontTheme]}
                            theme={githubLight}
                            basicSetup={{
                                lineNumbers: false,
                                foldGutter: false,
                                tabSize: 2,
                            }}
                            style={{
                                fontSize: '14px',
                                minHeight: '400px'
                            }}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}