import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import type { SchemaObject, PolicyField } from './types';
import { createNewField } from './utils';
import { CategorizedDropdown } from './categorized-dropdown';

interface SchemaObjectEditorProps {
  schemaObj: SchemaObject;
  onChange: (obj: SchemaObject) => void;
  onRemove: () => void;
}

export const SchemaObjectEditor = memo<SchemaObjectEditorProps>(({
  schemaObj,
  onChange,
  onRemove
}) => {
  const { nestedFields = [] } = schemaObj;

  const addNestedField = useCallback((fieldType: string): void => {
    const newField = createNewField(fieldType);
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
                onChange={(updatedField) => updateNestedField(index, updatedField)}
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

SchemaObjectEditor.displayName = 'SchemaObjectEditor';
