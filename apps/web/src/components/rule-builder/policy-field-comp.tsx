import { memo, useCallback, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import type { PolicyField, Constraint } from './types';
import { FIELD_TYPES } from './constants';
import {
  getDefaultConstraintForFieldType,
  canAddIndexedElement,
  canRemoveIndexedElement,
  getLengthValidationMessage,
  createNewField
} from './utils';
import { CategorizedDropdown } from './categorized-dropdown';
import { ConstraintInput } from './constraints-input';

interface PolicyFieldComponentProps {
  field: PolicyField;
  onChange: (field: PolicyField) => void;
  onRemove: () => void;
}

export const PolicyFieldComponent = memo<PolicyFieldComponentProps>(({
  field,
  onChange,
  onRemove
}) => {
  const fieldTypeData = FIELD_TYPES[field.fieldType];

  const addConstraint = useCallback((constraintType?: string): void => {
    const defaultConstraintType = constraintType || getDefaultConstraintForFieldType(field.fieldType);
    const initialValue = constraintType === 'numericEq' || constraintType === 'bigIntEq' ? 0 : '';

    onChange({
      ...field,
      constraints: [...field.constraints, { type: defaultConstraintType, value: initialValue }]
    });
  }, [field, onChange]);

  const handleConstraintSelection = useCallback((selection: string): void => {
    if (fieldTypeData?.allowedConstraints.includes(selection)) {
      addConstraint(selection);
    } else {
      addConstraint(selection);
    }
  }, [fieldTypeData, addConstraint]);

  const updateConstraint = useCallback((index: number, constraint: Constraint): void => {
    const newConstraints = [...field.constraints];
    newConstraints[index] = constraint;
    onChange({ ...field, constraints: newConstraints });
  }, [field, onChange]);

  const removeConstraint = useCallback((index: number): void => {
    const newConstraints = [...field.constraints];
    newConstraints.splice(index, 1);
    onChange({ ...field, constraints: newConstraints });
  }, [field, onChange]);

  const addNestedField = useCallback((fieldType: string): void => {
    if (field.fieldType !== 'Object') return;

    const newField = createNewField(fieldType);
    onChange({
      ...field,
      nestedFields: [...(field.nestedFields || []), newField]
    });
  }, [field, onChange]);

  const addIndexedElement = useCallback((fieldType: string): void => {
    if (field.fieldType !== 'Array' || !canAddIndexedElement(field)) return;

    const existingIndexes = Object.keys(field.indexedElements || {}).map(Number);
    const nextIndex = existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 0;

    const newIndexedElement = createNewField(fieldType);
    newIndexedElement.property = nextIndex.toString();

    onChange({
      ...field,
      indexedElements: {
        ...(field.indexedElements || {}),
        [nextIndex]: newIndexedElement
      }
    });
  }, [field, onChange]);

  const updateNestedField = useCallback((index: number, nestedField: PolicyField): void => {
    const newNestedFields = [...(field.nestedFields || [])];
    newNestedFields[index] = nestedField;
    onChange({ ...field, nestedFields: newNestedFields });
  }, [field, onChange]);

  const removeNestedField = useCallback((index: number): void => {
    const newNestedFields = [...(field.nestedFields || [])];
    newNestedFields.splice(index, 1);
    onChange({ ...field, nestedFields: newNestedFields });
  }, [field, onChange]);

  const updateIndexedElement = useCallback((index: string, element: PolicyField): void => {
    onChange({
      ...field,
      indexedElements: {
        ...(field.indexedElements || {}),
        [index]: element
      }
    });
  }, [field, onChange]);

  const removeIndexedElement = useCallback((index: string): void => {
    if (!canRemoveIndexedElement(field)) return;

    const newIndexedElements = { ...(field.indexedElements || {}) };
    delete newIndexedElements[index];
    onChange({ ...field, indexedElements: newIndexedElements });
  }, [field, onChange]);

  return (
    <div className="space-y-3 p-4 border border-primary-200 rounded-lg bg-white animate-in slide-in-from-top-2 fade-in-0 duration-300 ease-out">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={(fieldTypeData?.icon as any) || 'settings'} className="h-4 w-4 text-primary-600" />
          <Label className="text-sm font-medium text-primary-800">
            {fieldTypeData?.label || field.fieldType}
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:bg-red-100">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {/^\d+$/.test(field.property || '') ? (
          <>
            <Label className="text-[13px] text-primary-300">Array index</Label>
            <Input
              value={`[${field.property}]`}
              readOnly
              className="text-sm bg-blue-25 text-blue-700 border-blue-200"
            />
          </>
        ) : (
          <>
            <Label className="text-[13px] text-primary-300">Property path</Label>
            <Input
              placeholder="e.g., functionName, to, value, tokenIn"
              value={field.property || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...field, property: e.target.value })}
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

        {field.constraints.length > 0 ? (
          field.constraints.map((constraint, index) => (
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

      {field.fieldType === 'Object' && (
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

          {field.nestedFields && field.nestedFields.length > 0 ? (
            <div className="space-y-3 pl-4 border-l-2 border-green-200">
              {field.nestedFields.map((nestedField, index) => (
                <PolicyFieldComponent
                  key={index}
                  field={nestedField}
                  onChange={(updatedField) => updateNestedField(index, updatedField)}
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

      {field.fieldType === 'Array' && (
        <div className="space-y-3 pt-3 border-t border-primary-100">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Array Elements</Label>
            {canAddIndexedElement(field) ? (
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
                {getLengthValidationMessage(field) && (
                  <p className="text-xs text-red-600 mt-1 max-w-48">
                    {getLengthValidationMessage(field)}
                  </p>
                )}
              </div>
            )}
          </div>

          {field.indexedElements && Object.keys(field.indexedElements).length > 0 ? (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              {Object.entries(field.indexedElements)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([index, element]) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg bg-blue-25">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-blue-800">Element [{index}]</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndexedElement(index)}
                        disabled={!canRemoveIndexedElement(field)}
                        className={canRemoveIndexedElement(field)
                          ? "text-red-600 hover:bg-red-100"
                          : "text-gray-400 cursor-not-allowed opacity-50"
                        }
                        title={!canRemoveIndexedElement(field)
                          ? "Cannot remove: would violate length constraints"
                          : "Remove element"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <PolicyFieldComponent
                      field={element}
                      onChange={(updatedField) => updateIndexedElement(index, updatedField)}
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

          {!canRemoveIndexedElement(field) && Object.keys(field.indexedElements || {}).length > 0 && (
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

PolicyFieldComponent.displayName = 'PolicyFieldComponent';
