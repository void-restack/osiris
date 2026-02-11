import { Search, X, Lock } from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { extractScopeUrl } from "@/lib/scope-utils";
import { Separator } from "./separator";

export type Permission = {
  id: string;
  label: string;
  isRequired?: boolean;  // Optional for backward compatibility
};

type PermissionSelectorProps = {
  permissions: Permission[];
  placeholder?: string;
  initialSelected?: Permission[];
  onSelectionChange?: (selectedPermissions: Permission[]) => void;
  context?: string;
};

export function PermissionSelector({
  permissions,
  placeholder = "Search permissions...",
  initialSelected = [],
  onSelectionChange,
  context = "default",
}: PermissionSelectorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedsContainerRef = useRef<HTMLDivElement>(null);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) {
      setSelectedPermissions(prev => {
        const requiredPermissions = permissions.filter(p => p.isRequired);
        const newRequired = requiredPermissions.filter(required =>
          !prev.some(p => p.id === required.id)
        );
        if (newRequired.length === 0) return prev;
        return [...prev, ...newRequired];
      });
      return;
    }

    const requiredPermissions = permissions.filter(p => p.isRequired);
    const combined = [...initialSelected];

    requiredPermissions.forEach(required => {
      const exists = combined.some(p => p.id === required.id);
      if (!exists) {
        combined.push(required);
      }
    });

    setSelectedPermissions(combined);
    isInitialized.current = true;
  }, [initialSelected, permissions]);

  const removeSelectedPermission = useCallback((id: string) => {
    setSelectedPermissions(prev => {
      const newSelection = prev.filter(permission => permission.id !== id);
      onSelectionChange?.(newSelection.map(p => ({ ...p })));
      return newSelection;
    });
  }, [onSelectionChange]);

  const togglePermission = useCallback((permission: Permission, checked: boolean) => {
    setSelectedPermissions(prev => {
      let newSelection: Permission[];

      if (checked) {
        const alreadyExists = prev.some(p => {
          const normalizedSelected = extractScopeUrl(p.id);
          const normalizedNew = extractScopeUrl(permission.id);
          return normalizedSelected === normalizedNew || p.id === permission.id;
        });

        newSelection = alreadyExists ? prev : [...prev, { ...permission }];
      } else {
        newSelection = prev.filter(p => {
          const normalizedSelected = extractScopeUrl(p.id);
          const normalizedTarget = extractScopeUrl(permission.id);
          return normalizedSelected !== normalizedTarget && p.id !== permission.id;
        });
      }

      onSelectionChange?.(newSelection.map(p => ({ ...p })));
      return newSelection;
    });
  }, [onSelectionChange]);

  const isPermissionSelected = useCallback((permissionId: string) => {
    const normalizedTarget = extractScopeUrl(permissionId);
    return selectedPermissions.some(permission => {
      const normalizedSelected = extractScopeUrl(permission.id);
      return normalizedSelected === normalizedTarget || permission.id === permissionId;
    });
  }, [selectedPermissions]);

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions;

    const query = searchQuery.toLowerCase();
    return permissions.filter(permission =>
      permission.label.toLowerCase().includes(query) ||
      permission.id.toLowerCase().includes(query)
    );
  }, [permissions, searchQuery]);

  const sanitizeId = useCallback((id: string) =>
    id.replace(/[^a-zA-Z0-9-_]/g, '-'), []
  );


  useEffect(() => {
    if (selectedsContainerRef.current) {
      selectedsContainerRef.current.scrollTo({
        left: selectedsContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [selectedPermissions.length]);

  if (permissions.length === 0) {
    return (
      <div className="w-full max-w-lg space-y-4">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled
          />
        </div>
        <div className="py-8 text-center text-muted-foreground">
          <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No permissions available for this service</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-lg space-y-4 bg-primary-25  rounded-[6px]">
      <div className="relative m-2 pt-2">
        <Search className="-translate-y-1/5 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 border-none inset-shadow-search"
        />
      </div>

      <Separator className="h-0 border-t border-dashed bg-transparent" />


      {/* Selected Permissions */}
      {selectedPermissions.length > 0 && (
        <div className="mb-4 overflow-y-auto hidebar max-h-20 px-2">
          <div className="flex flex-wrap gap-2 pr-4" ref={selectedsContainerRef}>
            {selectedPermissions.map((permission, index) => (
              <div
                key={`selected-${permission.id}-${index}`}
                className="flex items-center gap-1.5 rounded-md bg-primary-100/50 px-2 py-0.5 text-[13px]"
              >
                <span className="font-medium text-xs">{permission.label}</span>
                {!permission.isRequired && (
                  <button
                    type="button"
                    onClick={() => removeSelectedPermission(permission.id)}
                    className="rounded-full p-0.5 transition-colors hover:bg-muted"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Permissions */}
      <div className="space-y-4 overflow-y-auto hidebar max-h-[180px] px-2">
        {filteredPermissions.length > 0 ? (
          filteredPermissions.map((permission) => {
            const checked = isPermissionSelected(permission.id);
            const checkboxId = `checkbox-${context}-${sanitizeId(permission.id)}`;

            return (
              <div key={permission.id} className="flex items-center space-x-3">
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={(checked) => togglePermission(permission, checked as boolean)}
                />
                <label
                  htmlFor={checkboxId}
                  className="flex-1 text-[13px] cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <span className="flex items-center gap-2">
                    {permission.label}
                    {permission.isRequired && (
                      <Lock className="h-3 w-3 text-muted-foreground" aria-label="Required permission" />
                    )}
                  </span>
                </label>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">
              No permissions found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
      {/* </ScrollArea> */}
      {/* </ScrollArea> */}
    </div>
  );
}