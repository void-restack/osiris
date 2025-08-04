import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { FIELD_TYPES, CONSTRAINT_CATEGORIES } from './constants';

interface CategorizedDropdownProps {
  type: 'field' | 'constraint';
  onSelect: (value: string) => void;
  allowedConstraints?: string[];
  availableFieldTypes?: string[];
  buttonText?: string;
  buttonClassName?: string;
}

export const CategorizedDropdown = memo<CategorizedDropdownProps>(({
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

      const fieldType = FIELD_TYPES[key];
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
    if (allowedConstraints?.length > 0) {
      return allowedConstraints.map(constraintKey => (
        <DropdownMenuItem key={constraintKey} onClick={() => onSelect(constraintKey)}>
          <Plus className="h-4 w-4 mr-2" />
          {constraintKey}
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

CategorizedDropdown.displayName = 'CategorizedDropdown';
