import React, { useState, useEffect, useCallback, useRef, useMemo, type ChangeEvent, type JSX } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, ChevronUp, Trash2, CircleMinus } from 'lucide-react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { githubLight } from "@uiw/codemirror-theme-github";
import { Icon } from './ui/icon';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

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
    nestedFields?: PolicyField[];
    indexedElements?: Record<string, PolicyField>;
}

interface PolicyRule {
    id: number;
    type: 'allow' | 'deny';
    name: string;
    method: string;
    chain: string;
    fields: PolicyField[];
    argsField?: PolicyField | null;
}

interface PolicyObject {
    allow: Array<Record<string, unknown>>;
    deny: Array<Record<string, unknown>>;
}

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

interface PolicyBuilderProps {
    value?: string;
    onChange?: (value: string) => void;
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

// Helper functions for field type detection
const detectFieldTypeFromConstraints = (constraints: Record<string, unknown>): PolicyField['fieldType'] => {
    const constraintKeys = Object.keys(constraints);

    // Check for explicit type constraint
    if (constraints.type === 'array') return 'Array';
    if (constraints.type === 'object') return 'Object';

    // Check for array-specific constraints
    if (constraintKeys.some(k => ['lengthEq', 'maxLength', 'minLength'].includes(k)) &&
        !constraintKeys.some(k => k.includes('string'))) {
        return 'Array';
    }

    // Check for BigInt constraints
    if (constraintKeys.some(k => k.startsWith('bigInt'))) {
        return 'BigInt';
    }

    // Check for numeric constraints
    if (constraintKeys.some(k =>
        ['numericMin', 'numericMax', 'numericEq', 'numericLt', 'numericLte', 'numericGt', 'numericGte',
            'minimum', 'maximum', 'min', 'max', 'lt', 'lte', 'gt', 'gte', '24hLimit'].includes(k))) {
        return 'Number';
    }

    // Check for boolean constraints
    if (constraintKeys.some(k => k === 'is')) {
        return 'Boolean';
    }

    // Default to String for address, string constraints, or unknown
    return 'String';
};

const isNumericKey = (key: string): boolean => {
    return /^\d+$/.test(key);
};

const hasArrayIndicators = (obj: Record<string, unknown>): boolean => {
    const keys = Object.keys(obj);
    // Has numeric keys or array constraints
    return keys.some(isNumericKey) ||
        obj.type === 'array' ||
        obj.lengthEq !== undefined ||
        obj.maxLength !== undefined ||
        obj.minLength !== undefined;
};

const setNestedProperty = (obj: Record<string, unknown>, path: string, value: unknown): void => {
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

const cleanEmptyObjects = (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
        return obj.map(cleanEmptyObjects).filter((item, index) => {
            // Special case: preserve empty objects in arrays that represent "allow all" policies
            if (typeof item === 'object' && item !== null && Object.keys(item as object).length === 0) {
                // Check if this is likely an "allow all" policy context
                // If we're in an array context and the item is an empty object, preserve it
                return true;
            }

            return item !== null && item !== undefined &&
                (typeof item !== 'object' || Object.keys(item as object).length > 0);
        });
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

// Memoized sub-components to prevent unnecessary re-renders
const CategorizedDropdown = React.memo<CategorizedDropdownProps>(({
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
            return allowedConstraints.map(constraintKey => (
                <DropdownMenuItem key={constraintKey} onClick={() => onSelect(constraintKey)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {CONSTRAINT_TYPES[constraintKey]?.label || constraintKey}
                </DropdownMenuItem>
            ));
        }

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
});

const SchemaObjectEditor = React.memo<SchemaObjectEditorProps>(({ schemaObj, onChange, onRemove }) => {
    const { nestedFields = [] } = schemaObj;

    const addNestedField = useCallback((fieldType: string): void => {
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
    }, [schemaObj, nestedFields, onChange]);

    const updateNestedField = useCallback((index: number, field: PolicyField): void => {
        const newNestedFields = [...nestedFields];
        newNestedFields[index] = field;
        onChange({ ...schemaObj, nestedFields: newNestedFields });
    }, [schemaObj, nestedFields, onChange]);

    const removeNestedField = useCallback((index: number): void => {
        const newNestedFields = [...nestedFields];
        newNestedFields.splice(index, 1);
        onChange({ ...schemaObj, nestedFields: newNestedFields });
    }, [schemaObj, nestedFields, onChange]);

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
});

const ConstraintInput = React.memo<ConstraintInputProps>(({ constraint, onChange, onRemove, canRemove = true }) => {
    const constraintType = CONSTRAINT_TYPES[constraint.type] || CONSTRAINT_TYPES.const;

    const handleValueChange = useCallback((newValue: string | number | boolean | object | Array<unknown>): void => {
        let processedValue = newValue;

        if (constraintType.valueType === 'number') {
            processedValue = newValue === '' ? '' : Number(newValue);
        } else if (constraintType.valueType === 'array') {
            if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
                processedValue = newValue;
            } else {
                processedValue = typeof newValue === 'string'
                    ? newValue.split(',').map(v => v.trim()).filter(Boolean)
                    : newValue;
            }
        }

        onChange({ ...constraint, value: processedValue });
    }, [constraint, constraintType.valueType, onChange]);

    const renderValueInput = (withCombinedLayout = false): JSX.Element => {
        if (constraintType.valueType === 'array' && ['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
            const rawArray = Array.isArray(constraint.value) ? constraint.value : [];
            const schemaArray: SchemaObject[] = rawArray.map(item => {
                if (item && typeof item === 'object' && 'nestedFields' in item) {
                    return item as SchemaObject;
                } else {
                    const nestedFields: PolicyField[] = [];
                    const obj = (item as Record<string, unknown>) || {};

                    Object.entries(obj).forEach(([key, value]) => {
                        if (key && value !== undefined && value !== null && value !== '') {
                            let fieldType: PolicyField['fieldType'] = 'String';
                            let constraints: Constraint[] = [];

                            if (typeof value === 'object' && !Array.isArray(value)) {
                                const constraintObj = value as Record<string, unknown>;
                                const constraintKeys = Object.keys(constraintObj);

                                constraints = constraintKeys
                                    .filter(k => CONSTRAINT_TYPES[k])
                                    .map(k => ({
                                        type: k,
                                        value: constraintObj[k] as string | number | boolean | object | Array<unknown>
                                    }));

                                if (constraints.some(c => c.type.includes('numeric') || ['min', 'max', 'lt', 'lte', 'gt', 'gte'].includes(c.type))) {
                                    fieldType = 'Number';
                                } else if (constraints.some(c => c.type.includes('bigInt'))) {
                                    fieldType = 'BigInt';
                                } else {
                                    fieldType = 'Object';
                                }
                            } else if (Array.isArray(value)) {
                                fieldType = 'Array';
                                constraints = [{ type: 'const', value }];
                            } else {
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
});

const PolicyFieldComponent = React.memo<PolicyFieldProps>(({ field, onChange, onRemove }) => {
    const policyField = field as PolicyField;
    const fieldTypeData = FIELD_TYPES[policyField.fieldType];

    const addConstraint = useCallback((constraintType?: string): void => {
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

        const defaultConstraintType = constraintType || getDefaultConstraintForFieldType(policyField.fieldType);
        const initialValue = CONSTRAINT_TYPES[defaultConstraintType]?.valueType === 'number' ? 0 : '';

        onChange({
            ...policyField,
            constraints: [...policyField.constraints, { type: defaultConstraintType, value: initialValue }]
        });
    }, [policyField, onChange]);

    const handleConstraintSelection = useCallback((selection: string): void => {
        if (fieldTypeData?.allowedConstraints.includes(selection)) {
            addConstraint(selection);
        } else if (CONSTRAINT_CATEGORIES[selection as keyof typeof CONSTRAINT_CATEGORIES]) {
            const category = CONSTRAINT_CATEGORIES[selection as keyof typeof CONSTRAINT_CATEGORIES];
            const firstConstraint = category.constraints[0];
            addConstraint(firstConstraint);
        } else {
            addConstraint(selection);
        }
    }, [fieldTypeData, addConstraint]);

    const updateConstraint = useCallback((index: number, constraint: Constraint): void => {
        const newConstraints = [...policyField.constraints];
        newConstraints[index] = constraint;
        onChange({ ...policyField, constraints: newConstraints });
    }, [policyField, onChange]);

    const removeConstraint = useCallback((index: number): void => {
        const newConstraints = [...policyField.constraints];
        newConstraints.splice(index, 1);
        onChange({ ...policyField, constraints: newConstraints });
    }, [policyField, onChange]);

    const addNestedField = useCallback((fieldType: string): void => {
        if (policyField.fieldType !== 'Object') return;

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
    }, [policyField, onChange]);

    const canAddIndexedElement = (): boolean => {
        if (policyField.fieldType !== 'Array') return false;
        const currentElementCount = Object.keys(policyField.indexedElements || {}).length;
        const lengthEqConstraint = policyField.constraints.find(c => c.type === 'lengthEq');
        const maxLengthConstraint = policyField.constraints.find(c => c.type === 'maxLength');

        if (lengthEqConstraint && typeof lengthEqConstraint.value === 'number') {
            return currentElementCount < lengthEqConstraint.value;
        }
        if (maxLengthConstraint && typeof maxLengthConstraint.value === 'number') {
            return currentElementCount < maxLengthConstraint.value;
        }
        return true;
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

    const addIndexedElement = useCallback((fieldType: string): void => {
        if (policyField.fieldType !== 'Array' || !canAddIndexedElement()) return;

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
    }, [policyField, onChange, canAddIndexedElement]);

    const updateNestedField = useCallback((index: number, nestedField: PolicyField): void => {
        const newNestedFields = [...(policyField.nestedFields || [])];
        newNestedFields[index] = nestedField;
        onChange({ ...policyField, nestedFields: newNestedFields });
    }, [policyField, onChange]);

    const removeNestedField = useCallback((index: number): void => {
        const newNestedFields = [...(policyField.nestedFields || [])];
        newNestedFields.splice(index, 1);
        onChange({ ...policyField, nestedFields: newNestedFields });
    }, [policyField, onChange]);

    const updateIndexedElement = useCallback((index: string, element: PolicyField): void => {
        onChange({
            ...policyField,
            indexedElements: {
                ...(policyField.indexedElements || {}),
                [index]: element
            }
        });
    }, [policyField, onChange]);

    const canRemoveIndexedElement = (): boolean => {
        if (policyField.fieldType !== 'Array') return true;
        const currentElementCount = Object.keys(policyField.indexedElements || {}).length;
        const lengthEqConstraint = policyField.constraints.find(c => c.type === 'lengthEq');
        const minLengthConstraint = policyField.constraints.find(c => c.type === 'minLength');

        if (lengthEqConstraint && typeof lengthEqConstraint.value === 'number') {
            return currentElementCount > lengthEqConstraint.value;
        }
        if (minLengthConstraint && typeof minLengthConstraint.value === 'number') {
            return currentElementCount > minLengthConstraint.value;
        }
        return true;
    };

    const removeIndexedElement = useCallback((index: string): void => {
        if (!canRemoveIndexedElement()) return;
        const newIndexedElements = { ...(policyField.indexedElements || {}) };
        delete newIndexedElements[index];
        onChange({ ...policyField, indexedElements: newIndexedElements });
    }, [policyField, onChange, canRemoveIndexedElement]);

    return (
        <div className="space-y-3 p-4 border border-primary-200 rounded-lg bg-white animate-in slide-in-from-top-2 fade-in-0 duration-300 ease-out">
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

            <div className="space-y-1">
                {/^\d+$/.test(policyField.property || '') ? (
                    <>
                        <Label className="text-[13px] text-primary-300">Array index</Label>
                        <Input
                            value={`[${policyField.property}]`}
                            readOnly
                            className="text-sm bg-blue-25 text-blue-700 border-blue-200"
                        />
                    </>
                ) : (
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
                            canRemove={true}
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
});

const PolicyRuleComponent = React.memo<PolicyRuleProps>(({ rule, onChange, onRemove }) => {
    const [isOpen, setIsOpen] = useState(true);

    const applyTemplate = useCallback((templateKey: string): void => {
        const template = TEMPLATES[templateKey];
        if (!template) return;

        const newFields: PolicyField[] = template.fields.map(field => ({
            property: field.property,
            fieldType: 'String',
            constraints: [{ type: field.constraint, value: field.value }],
            nestedFields: undefined,
            indexedElements: undefined
        }));

        onChange({
            ...rule,
            method: template.method,
            fields: newFields
        });
    }, [rule, onChange]);

    const addField = useCallback((fieldType?: string): void => {
        const fieldTypeKey = fieldType as keyof typeof FIELD_TYPES;
        const fieldTypeData = FIELD_TYPES[fieldTypeKey];

        if (!fieldTypeData) return;

        const newField: PolicyField = {
            property: '',
            fieldType: fieldType as PolicyField['fieldType'],
            constraints: fieldType === 'Array' ? [{ type: 'lengthEq', value: 1 }] : [],
            nestedFields: fieldType === 'Object' ? [] : undefined,
            indexedElements: fieldType === 'Array' ? {} : undefined
        };

        onChange({
            ...rule,
            fields: [...rule.fields, newField]
        });
    }, [rule, onChange]);

    const addArgsField = useCallback((): void => {
        const argsField: PolicyField = {
            property: 'args',
            fieldType: 'Array',
            constraints: [{ type: 'lengthEq', value: 1 }],
            nestedFields: undefined,
            indexedElements: {}
        };
        onChange({ ...rule, argsField });
    }, [rule, onChange]);

    const updateField = useCallback((index: number, field: PolicyField): void => {
        const newFields = [...rule.fields];
        newFields[index] = field;
        onChange({ ...rule, fields: newFields });
    }, [rule, onChange]);

    const removeField = useCallback((index: number): void => {
        const newFields = [...rule.fields];
        newFields.splice(index, 1);
        onChange({ ...rule, fields: newFields });
    }, [rule, onChange]);

    const updateArgsField = useCallback((argsField: PolicyField): void => {
        onChange({ ...rule, argsField });
    }, [rule, onChange]);

    const removeArgsField = useCallback((): void => {
        onChange({ ...rule, argsField: null });
    }, [rule, onChange]);

    const handleFieldSelection = useCallback((selection: string): void => {
        if (selection === 'ARGS') {
            addArgsField();
        } else {
            addField(selection);
        }
    }, [addField, addArgsField]);

    const getAvailableFieldTypes = (): string[] => {
        const baseFields = Object.keys(FIELD_TYPES);
        const availableFields = [...baseFields];

        if (rule.method === 'signTransaction') {
            availableFields.push('ARGS');
        }

        return availableFields;
    };

    const handleMethodChange = useCallback((newMethod: string): void => {
        let updatedRule = { ...rule, method: newMethod };

        if (newMethod !== 'signTransaction' && rule.argsField) {
            updatedRule = { ...updatedRule, argsField: null };
        }

        onChange(updatedRule);
    }, [rule, onChange]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className='border border-primary-100 rounded-lg p-4'>
            <CollapsibleTrigger asChild>
                <div className="flex-col">
                    <div className='flex items-center justify-between'>
                        <h4>{rule.name}</h4>
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

                    <div className="space-y-3">
                        {rule.argsField && (
                            <PolicyFieldComponent
                                field={rule.argsField}
                                onChange={(field) => updateArgsField(field as PolicyField)}
                                onRemove={removeArgsField}
                            />
                        )}

                        {rule.method && rule.method !== 'signTransaction' && (
                            <div className="text-center p-3 border border-blue-200 rounded-md bg-blue-25">
                                <p className="text-sm text-blue-600">
                                    <Icon name="warning" className="inline h-4 w-4 mr-1" />
                                    Args field is only available for <code className="bg-blue-100 px-1 rounded">signTransaction</code> method
                                </p>
                            </div>
                        )}

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
});

export default function PolicyBuilder({ value, onChange }: PolicyBuilderProps): JSX.Element {
    // Default value is "allow all" policy
    const DEFAULT_POLICY = '{\n  "allow": [{}],\n  "deny": []\n}';

    // Track update source
    const isInternalUpdate = useRef(false);
    const lastExternalValue = useRef(value || DEFAULT_POLICY);

    // Initialize state from props with "allow all" as default
    const [rules, setRules] = useState<PolicyRule[]>(() => {
        const initialValue = value || DEFAULT_POLICY;
        try {
            const parsed = JSON.parse(initialValue) as PolicyObject;
            return policyToRules(cleanInvalidProperties(parsed));
        } catch {
            return [];
        }
    });

    const [activeTab, setActiveTab] = useState<string>('interactive');
    const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [isAllowAllPolicy, setIsAllowAllPolicy] = useState<boolean>(() => {
        // Check if initial value is "allow all"
        const initialValue = value || DEFAULT_POLICY;
        try {
            const parsed = JSON.parse(initialValue) as PolicyObject;
            return parsed.allow?.some(rule => Object.keys(rule).length === 0) ?? false;
        } catch {
            return true; // Default is "allow all"
        }
    });
    const [internalJson, setInternalJson] = useState<string>(value || DEFAULT_POLICY);

    // Clean invalid properties from policy based on method
    const cleanInvalidProperties = useCallback((policy: PolicyObject): PolicyObject => {
        const cleaned: PolicyObject = { allow: [], deny: [] };

        (['allow', 'deny'] as const).forEach(type => {
            cleaned[type] = (policy[type] || []).map(rule => {
                // Preserve empty objects that represent "allow all"
                if (Object.keys(rule).length === 0) {
                    return rule;
                }

                const cleanedRule = { ...rule };
                const method = String(rule.method || '');

                if (method === 'signMessage') {
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
    }, []);

    // Convert logical constraint values recursively
    const convertLogicalConstraintValue = useCallback((constraintType: string, constraintValue: unknown): unknown => {
        if (['anyOf', 'allOf', 'oneOf'].includes(constraintType) && Array.isArray(constraintValue)) {
            const rawArray = constraintValue as Array<unknown>;
            return rawArray.map(item => {
                if (item && typeof item === 'object' && 'nestedFields' in item) {
                    const schemaObj = item as SchemaObject;
                    const converted: Record<string, unknown> = {};

                    if (schemaObj.nestedFields && schemaObj.nestedFields.length > 0) {
                        schemaObj.nestedFields.forEach(nestedField => {
                            if (!nestedField.property) return;

                            const fieldPath = nestedField.property;

                            if (nestedField.constraints.length > 0) {
                                const nestedConstraints = nestedField.constraints.filter(c =>
                                    c.value !== '' && c.value !== null && c.value !== undefined
                                );

                                if (nestedConstraints.length > 0) {
                                    if (nestedConstraints.length === 1 && nestedConstraints[0].type === 'const') {
                                        converted[fieldPath] = nestedConstraints[0].value;
                                    } else if (nestedConstraints.length === 1) {
                                        const nc = nestedConstraints[0];
                                        if (['anyOf', 'allOf', 'oneOf'].includes(nc.type)) {
                                            converted[fieldPath] = { [nc.type]: convertLogicalConstraintValue(nc.type, nc.value) };
                                        } else {
                                            converted[fieldPath] = { [nc.type]: nc.value };
                                        }
                                    } else {
                                        const nestedConstraintObj: Record<string, unknown> = {};
                                        nestedConstraints.forEach(nc => {
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

                            // Handle nested Object fields
                            if (nestedField.fieldType === 'Object' && nestedField.nestedFields) {
                                const nestedObj: Record<string, unknown> = {};
                                nestedField.nestedFields.forEach(subField => {
                                    if (subField.property && subField.constraints.length > 0) {
                                        const validConstraints = subField.constraints.filter(c =>
                                            c.value !== '' && c.value !== null && c.value !== undefined
                                        );

                                        if (validConstraints.length === 1 && validConstraints[0].type === 'const') {
                                            nestedObj[subField.property] = validConstraints[0].value;
                                        } else if (validConstraints.length > 0) {
                                            const constraintObj: Record<string, unknown> = {};
                                            validConstraints.forEach(c => {
                                                constraintObj[c.type] = c.value;
                                            });
                                            nestedObj[subField.property] = constraintObj;
                                        }
                                    }
                                });
                                if (Object.keys(nestedObj).length > 0) {
                                    converted[fieldPath] = nestedObj;
                                }
                            }

                            // Handle Array fields with indexed elements
                            if (nestedField.fieldType === 'Array' && nestedField.indexedElements) {
                                const arrayObj: Record<string, unknown> = {};

                                // Add array constraints
                                nestedField.constraints.forEach(c => {
                                    if (c.value !== '' && c.value !== null && c.value !== undefined) {
                                        arrayObj[c.type] = c.value;
                                    }
                                });

                                // Add indexed elements
                                Object.entries(nestedField.indexedElements).forEach(([index, indexField]) => {
                                    if (indexField.constraints.length > 0) {
                                        const validConstraints = indexField.constraints.filter(c =>
                                            c.value !== '' && c.value !== null && c.value !== undefined
                                        );

                                        if (validConstraints.length === 1 && validConstraints[0].type === 'const') {
                                            arrayObj[index] = validConstraints[0].value;
                                        } else if (validConstraints.length > 0) {
                                            const constraintObj: Record<string, unknown> = {};
                                            validConstraints.forEach(c => {
                                                constraintObj[c.type] = c.value;
                                            });
                                            arrayObj[index] = constraintObj;
                                        }
                                    }
                                });

                                if (Object.keys(arrayObj).length > 0) {
                                    converted[fieldPath] = arrayObj;
                                }
                            }
                        });
                    }

                    return converted;
                } else {
                    return item as Record<string, unknown>;
                }
            });
        } else {
            return constraintValue;
        }
    }, []);

    // Convert rules to policy (memoized)
    const rulesToPolicy = useCallback((rulesArray: PolicyRule[]): PolicyObject => {
        const policy: PolicyObject = { allow: [], deny: [] };

        // If there are no rules and the original value was "allow all", preserve it
        if (rulesArray.length === 0 && lastExternalValue.current) {
            try {
                const originalPolicy = JSON.parse(lastExternalValue.current) as PolicyObject;
                const isAllowAll = originalPolicy.allow?.some(rule => Object.keys(rule).length === 0);
                if (isAllowAll) {
                    return originalPolicy; // Return the original "allow all" policy
                }
            } catch (error) {
                // If parsing fails, return default "allow all"
                return { allow: [{}], deny: [] };
            }
        }

        // If no rules, default to "allow all"
        if (rulesArray.length === 0) {
            return { allow: [{}], deny: [] };
        }

        rulesArray.forEach(rule => {
            // Special case: preserve empty objects that represent "allow all"
            if (!rule.method && rule.fields.length === 0 && !rule.argsField) {
                // If this is an allow rule with no constraints, it represents "allow all"
                if (rule.type === 'allow') {
                    policy[rule.type].push({});
                }
                return;
            }

            const policyRule: Record<string, unknown> = {};

            if (rule.method) policyRule.method = rule.method;
            if (rule.chain) policyRule.chain = rule.chain;

            const section = rule.method === 'signMessage' ? 'payload' : 'decoded';
            const sectionData: Record<string, unknown> = {};

            const allFieldData: Array<{ key: string; value: unknown }> = [];

            const processField = (field: PolicyField, basePath = ''): void => {
                if (!field.property) return;

                const fullPath = basePath ? `${basePath}.${field.property}` : field.property;

                const validConstraints = field.constraints.filter(c =>
                    c.value !== '' && c.value !== null && c.value !== undefined
                );

                if (validConstraints.length > 0) {
                    let constraintValue: unknown;

                    if (validConstraints.length === 1 && validConstraints[0].type === 'const') {
                        constraintValue = validConstraints[0].value;
                    } else if (validConstraints.length === 1) {
                        const constraint = validConstraints[0];
                        if (['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
                            constraintValue = { [constraint.type]: convertLogicalConstraintValue(constraint.type, constraint.value) };
                        } else {
                            constraintValue = { [constraint.type]: constraint.value };
                        }
                    } else {
                        const constraintObj: Record<string, unknown> = {};
                        validConstraints.forEach(c => {
                            if (['anyOf', 'allOf', 'oneOf'].includes(c.type)) {
                                constraintObj[c.type] = convertLogicalConstraintValue(c.type, c.value);
                            } else {
                                constraintObj[c.type] = c.value;
                            }
                        });
                        constraintValue = constraintObj;
                    }

                    allFieldData.push({ key: fullPath, value: constraintValue });
                }

                if (field.nestedFields && field.nestedFields.length > 0) {
                    field.nestedFields.forEach(nestedField => {
                        processField(nestedField, fullPath);
                    });
                }

                if (field.indexedElements && Object.keys(field.indexedElements).length > 0) {
                    Object.entries(field.indexedElements).forEach(([index, indexedField]) => {
                        const indexPath = `${fullPath}.${index}`;
                        processField(indexedField, fullPath);
                    });
                }
            };

            rule.fields.forEach(field => processField(field));

            if (rule.argsField) {
                processField(rule.argsField);
            }

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
    }, [convertLogicalConstraintValue]);

    // Convert policy to rules (FIXED VERSION)
    const policyToRules = useCallback((policy: PolicyObject): PolicyRule[] => {
        const newRules: PolicyRule[] = [];
        let ruleId = 1;

        (['allow', 'deny'] as const).forEach(type => {
            (policy[type] || []).forEach(policyRule => {
                // Handle empty objects that represent "allow all"
                if (Object.keys(policyRule).length === 0) {
                    const rule: PolicyRule = {
                        id: ruleId++,
                        type,
                        name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${newRules.filter(r => r.type === type).length + 1}`,
                        method: '',
                        chain: '',
                        fields: [],
                        argsField: null
                    };
                    newRules.push(rule);
                    return;
                }

                const rule: PolicyRule = {
                    id: ruleId++,
                    type,
                    name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${newRules.filter(r => r.type === type).length + 1}`,
                    method: String(policyRule.method || ''),
                    chain: String(policyRule.chain || ''),
                    fields: [],
                    argsField: null
                };

                const section = (policyRule.decoded || policyRule.payload || {}) as Record<string, unknown>;

                // Recursive function to parse value into PolicyField
                const parseValueToField = (
                    key: string,
                    value: unknown,
                    isArrayIndex: boolean = false
                ): PolicyField => {
                    // Handle primitive values
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        let fieldType: PolicyField['fieldType'] = 'String';
                        if (typeof value === 'number') fieldType = 'Number';
                        if (typeof value === 'boolean') fieldType = 'Boolean';

                        return {
                            property: key,
                            fieldType,
                            constraints: [{ type: 'const', value }],
                            nestedFields: undefined,
                            indexedElements: undefined
                        };
                    }

                    // Handle arrays (simple arrays, not object arrays)
                    if (Array.isArray(value)) {
                        return {
                            property: key,
                            fieldType: 'String', // enum constraint implies string field
                            constraints: [{ type: 'enum', value }],
                            nestedFields: undefined,
                            indexedElements: undefined
                        };
                    }

                    // Handle objects
                    if (value && typeof value === 'object') {
                        const obj = value as Record<string, unknown>;
                        const objKeys = Object.keys(obj);

                        // Separate constraint keys from property keys
                        const constraintKeys = objKeys.filter(k => CONSTRAINT_TYPES[k]);
                        const propertyKeys = objKeys.filter(k => !CONSTRAINT_TYPES[k]);

                        // If it's purely constraints (no nested properties)
                        if (propertyKeys.length === 0 && constraintKeys.length > 0) {
                            const fieldType = detectFieldTypeFromConstraints(obj);
                            const constraints: Constraint[] = constraintKeys.map(k => ({
                                type: k,
                                value: obj[k] as string | number | boolean | object | Array<unknown>
                            }));

                            // Handle Array fields with indexed elements
                            if (fieldType === 'Array') {
                                const indexedElements: Record<string, PolicyField> = {};

                                // Look for numeric keys in constraints (for payload case)
                                objKeys.forEach(k => {
                                    if (isNumericKey(k)) {
                                        indexedElements[k] = parseValueToField(k, obj[k], true);
                                    }
                                });

                                return {
                                    property: key,
                                    fieldType: 'Array',
                                    constraints: constraints.filter(c => !isNumericKey(c.type)),
                                    nestedFields: undefined,
                                    indexedElements: Object.keys(indexedElements).length > 0 ? indexedElements : {}
                                };
                            }

                            return {
                                property: key,
                                fieldType,
                                constraints,
                                nestedFields: fieldType === 'Object' ? [] : undefined,
                                indexedElements: undefined
                            };
                        }

                        // Check if this should be an Array field (has numeric keys or array indicators)
                        if (hasArrayIndicators(obj)) {
                            const indexedElements: Record<string, PolicyField> = {};
                            const constraints: Constraint[] = [];

                            // Extract array constraints
                            constraintKeys.forEach(k => {
                                constraints.push({
                                    type: k,
                                    value: obj[k] as string | number | boolean | object | Array<unknown>
                                });
                            });

                            // Process numeric keys as array elements
                            propertyKeys.forEach(k => {
                                if (isNumericKey(k)) {
                                    indexedElements[k] = parseValueToField(k, obj[k], true);
                                }
                            });

                            return {
                                property: key,
                                fieldType: 'Array',
                                constraints,
                                nestedFields: undefined,
                                indexedElements
                            };
                        }

                        // It's an Object field with nested properties
                        const nestedFields: PolicyField[] = [];

                        // Add constraint-based field if there are constraints
                        if (constraintKeys.length > 0) {
                            const fieldType = detectFieldTypeFromConstraints(obj);
                            const constraints: Constraint[] = constraintKeys.map(k => ({
                                type: k,
                                value: obj[k] as string | number | boolean | object | Array<unknown>
                            }));

                            return {
                                property: key,
                                fieldType,
                                constraints,
                                nestedFields: fieldType === 'Object' ? [] : undefined,
                                indexedElements: fieldType === 'Array' ? {} : undefined
                            };
                        }

                        // Process nested properties
                        propertyKeys.forEach(nestedKey => {
                            const nestedField = parseValueToField(nestedKey, obj[nestedKey]);
                            nestedFields.push(nestedField);
                        });

                        return {
                            property: key,
                            fieldType: 'Object',
                            constraints: [],
                            nestedFields,
                            indexedElements: undefined
                        };
                    }

                    // Fallback
                    return {
                        property: key,
                        fieldType: 'String',
                        constraints: [],
                        nestedFields: undefined,
                        indexedElements: undefined
                    };
                };

                // Process all fields in the section
                Object.entries(section).forEach(([key, value]) => {
                    const field = parseValueToField(key, value);

                    // Special handling for args field
                    if (key === 'args') {
                        rule.argsField = field;
                    } else {
                        rule.fields.push(field);
                    }
                });

                newRules.push(rule);
            });
        });

        return newRules;
    }, []);

    // Debounced onChange callback
    const debouncedOnChange = useMemo(
        () => debounce((newValue: string) => {
            // Only block onChange for "allow all" policies when we have no rules
            if (isAllowAllPolicy && rules.length === 0) {
                return;
            }

            if (onChange && !isInternalUpdate.current) {
                onChange(newValue);
            }
        }, 300),
        [onChange, isAllowAllPolicy, rules.length]
    );

    // Handle external value changes
    useEffect(() => {
        if (value !== undefined && value !== lastExternalValue.current && !isInternalUpdate.current) {
            lastExternalValue.current = value;
            setInternalJson(value);

            try {
                const parsed = JSON.parse(value) as PolicyObject;

                // Check if this is an "allow all" policy
                const isAllowAll = parsed.allow?.some(rule => Object.keys(rule).length === 0);

                if (isAllowAll) {
                    setIsAllowAllPolicy(true);
                    setRules([]);
                    setHasUnsavedChanges(false);
                    isInternalUpdate.current = true;
                    setTimeout(() => { isInternalUpdate.current = false; }, 100);
                    return;
                } else {
                    setIsAllowAllPolicy(false);
                    const cleaned = cleanInvalidProperties(parsed);
                    const newRules = policyToRules(cleaned);
                    setRules(newRules);
                    setHasUnsavedChanges(false);
                }
            } catch (error) {
                // Keep existing rules if JSON is invalid
            }
        }
    }, [value, cleanInvalidProperties, policyToRules]);

    // Update JSON from rules (only in interactive mode)
    useEffect(() => {
        if (isAllowAllPolicy && rules.length === 0) {
            return;
        }

        try {
            const currentPolicy = JSON.parse(internalJson) as PolicyObject;
            const isCurrentAllowAll = currentPolicy.allow?.some(rule => Object.keys(rule).length === 0);
            if (isCurrentAllowAll && rules.length === 0) {
                return;
            }
        } catch {
            // Continue with normal logic
        }

        if (activeTab === 'interactive') {
            const policy = rulesToPolicy(rules);
            const newJson = JSON.stringify(policy, null, 2);

            if (newJson !== internalJson) {
                isInternalUpdate.current = true;
                setInternalJson(newJson);
                setHasUnsavedChanges(true);

                setTimeout(() => {
                    if (onChange) {
                        debouncedOnChange(newJson);
                    }
                    isInternalUpdate.current = false;
                }, 100);
            }
        }
    }, [rules, activeTab, rulesToPolicy, onChange, debouncedOnChange, isAllowAllPolicy, internalJson]);

    // Handle JSON editor changes
    const handleJsonValueChange = useCallback((newValue: string): void => {
        setInternalJson(newValue);

        try {
            const parsed = JSON.parse(newValue) as PolicyObject;
            setIsJsonValid(true);

            const isAllowAll = parsed.allow?.some(rule => Object.keys(rule).length === 0);

            if (isAllowAll) {
                setIsAllowAllPolicy(true);
                setRules([]);
                debouncedOnChange(newValue);
                return;
            }

            setIsAllowAllPolicy(false);

            if (activeTab === 'json') {
                const cleaned = cleanInvalidProperties(parsed);
                const cleanedJson = JSON.stringify(cleaned, null, 2);

                isInternalUpdate.current = true;

                if (cleanedJson !== newValue) {
                    setTimeout(() => {
                        setInternalJson(cleanedJson);
                        debouncedOnChange(cleanedJson);
                    }, 0);
                } else {
                    debouncedOnChange(cleanedJson);
                }

                const newRules = policyToRules(cleaned);
                setRules(newRules);
                setHasUnsavedChanges(false);

                requestAnimationFrame(() => {
                    isInternalUpdate.current = false;
                });
            }
        } catch (error) {
            setIsJsonValid(false);
        }
    }, [activeTab, cleanInvalidProperties, policyToRules, debouncedOnChange]);

    const addRule = useCallback((type: 'allow' | 'deny'): void => {
        // Clear "allow all" state when adding first rule
        if (isAllowAllPolicy) {
            setIsAllowAllPolicy(false);
        }

        const newRule: PolicyRule = {
            id: Date.now(),
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${rules.filter(r => r.type === type).length + 1}`,
            method: '',
            chain: '',
            fields: []
        };
        setRules([...rules, newRule]);
    }, [rules, isAllowAllPolicy]);

    const updateRule = useCallback((id: number, updatedRule: PolicyRule): void => {
        setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
    }, []);

    const removeRule = useCallback((id: number): void => {
        setRules(prev => prev.filter(rule => rule.id !== id));
    }, []);

    return (
        <div className="w-full mx-auto rounded-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-6'>
                <TabsList className="w-full inset-shadow-tabs h-10 p-1">
                    <TabsTrigger value="interactive" className='font-normal data-[state=active]:text-primary-800 text-primary-400'>
                        Interactive <Icon name='swipe' />
                        {/* {hasUnsavedChanges && activeTab !== 'interactive' && (
                            <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5">*</span>
                        )} */}
                    </TabsTrigger>
                    <TabsTrigger value="json"><Icon name='code' /> JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="interactive" className="space-y-6 max-h-[400px] overflow-y-scroll hidebar">
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className="cursor-pointer inset-shadow-policy-cards bg-primary-25 rounded-xl hover:bg-primary-50"
                            onClick={() => addRule('allow')}
                        >
                            <div className="px-[18px] py-6 rounded-xl">
                                <Icon name='check' className='text-primary-800 size-6 mb-4' />
                                <div className='flex flex-col'>
                                    <h3 className="font-medium transition-colors duration-200">Add allow rule</h3>
                                    <p className="text-sm text-primary-400 transition-colors duration-200">Define permitted actions</p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="cursor-pointer inset-shadow-policy-cards bg-primary-25 rounded-xl hover:bg-primary-50"
                            onClick={() => addRule('deny')}
                        >
                            <div className="px-[18px] py-6 rounded-xl">
                                <Icon name='warning' className='text-primary-800 size-6 mb-4' />
                                <div className='flex flex-col'>
                                    <h3 className="font-medium transition-colors duration-200">Add deny rule</h3>
                                    <p className="text-sm text-primary-400 transition-colors duration-200">Define blocked actions</p>
                                </div>
                            </div>
                        </div>
                    </div>

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
                            <span>Pick a rule and start building up your wallet sharing</span>
                        </div>
                    )}

                    {rules.length > 0 && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className='rounded-[6px]'
                                onClick={() => {
                                    const policy = rulesToPolicy(rules);
                                    const newJson = JSON.stringify(policy, null, 2);
                                    if (onChange) {
                                        onChange(newJson);
                                    }
                                    setHasUnsavedChanges(false);
                                }}
                            >
                                {hasUnsavedChanges ? 'Sync Changes*' : 'Sync Changes'}
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                    <div className="border rounded-lg overflow-y-scroll max-h-[400px] hidebar">
                        <CodeMirror
                            value={internalJson}
                            onChange={handleJsonValueChange}
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