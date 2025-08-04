import { memo, useState, useCallback, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import type { PolicyRule, PolicyField, Template } from './types';
import { TEMPLATES } from './constants';
import { createNewField, getAvailableFieldTypes } from './utils';
import { PolicyFieldComponent } from './policy-field-comp';
import { CategorizedDropdown } from './categorized-dropdown';

interface PolicyRuleComponentProps {
  rule: PolicyRule;
  onChange: (rule: PolicyRule) => void;
  onRemove: () => void;
}

export const PolicyRuleComponent = memo<PolicyRuleComponentProps>(({
  rule,
  onChange,
  onRemove
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const applyTemplate = useCallback((templateKey: string): void => {
    const template: Template = TEMPLATES[templateKey];
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
    if (!fieldType) return;
    const newField = createNewField(fieldType);
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
  }, [addArgsField, addField]);

  const handleMethodChange = useCallback((newMethod: string): void => {
    let updatedRule = { ...rule, method: newMethod };

    if (newMethod !== 'signTransaction' && rule.argsField) {
      updatedRule = { ...updatedRule, argsField: null };
    }

    onChange(updatedRule);
  }, [rule, onChange]);

  const availableFieldTypes = getAvailableFieldTypes(rule.method);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className='border border-primary-100 rounded-lg p-4'>
      <CollapsibleTrigger asChild>
        <div className="flex-col">
          <div className='flex items-center justify-between'>
            <h4>{rule.name}</h4>
            <div className="flex items-center gap-4">
              <Button
                className='bg-danger-50 border border-danger-100 rounded-md hover:bg-danger-100 transition-all duration-200'
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Icon name='trash' className='size-4 transition-transform duration-200 hover:scale-110' />
              </Button>
              <div className='h-8 bg-primary-100 w-[1px]' />
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-primary-300 transition-transform duration-300" />
              ) : (
                <ChevronDown className="h-4 w-4 text-primary-300 transition-transform duration-300" />
              )}
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
                onChange={updateArgsField}
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
                availableFieldTypes={availableFieldTypes}
                buttonText="Add another field"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

PolicyRuleComponent.displayName = 'PolicyRuleComponent';
