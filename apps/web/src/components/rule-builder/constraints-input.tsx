import React, { memo, useCallback, type ChangeEvent, type JSX } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CircleMinus } from 'lucide-react';
import type { Constraint, SchemaObject } from './types';
import { CONSTRAINT_TYPES } from './constants';
import { SchemaObjectEditor } from './schema-object-editor';

interface ConstraintInputProps {
  constraint: Constraint;
  onChange: (constraint: Constraint) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

export const ConstraintInput = memo<ConstraintInputProps>(({
  constraint,
  onChange,
  onRemove,
  canRemove = true
}) => {
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

  const handleTypeChange = useCallback((type: string): void => {
    const newConstraintType = CONSTRAINT_TYPES[type];
    const initialValue = newConstraintType?.valueType === 'number' ? 0 : '';
    onChange({ type, value: initialValue });
  }, [onChange]);

  const renderValueInput = useCallback((withCombinedLayout = false): JSX.Element => {
    if (constraintType.valueType === 'array' && ['anyOf', 'allOf', 'oneOf'].includes(constraint.type)) {
      const rawArray = Array.isArray(constraint.value) ? constraint.value : [];
      const schemaArray: SchemaObject[] = rawArray.map(item => {
        if (item && typeof item === 'object' && 'nestedFields' in item) {
          return item as SchemaObject;
        } else {
          return { nestedFields: [] };
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
  }, [constraint.type, constraint.value, constraintType.valueType, handleValueChange, canRemove, onRemove]);

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

ConstraintInput.displayName = 'ConstraintInput';
