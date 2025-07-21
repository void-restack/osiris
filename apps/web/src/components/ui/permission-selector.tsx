import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

export type Permission = {
  id: string;
  label: string;
};

type PermissionSelectorProps = {
  permissions: Permission[];
  placeholder?: string;
  onSelectionChange?: (selectedPermissions: Permission[]) => void;
};

export function PermissionSelector({
  permissions,
  placeholder = "Search permissions...",
  onSelectionChange,
}: PermissionSelectorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const selectedsContainerRef = useRef<HTMLDivElement>(null);

  console.log("Permissions received:", permissions);
  console.log("Search query:", searchQuery);

  useEffect(() => {
    onSelectionChange?.(selectedPermissions);
  }, [selectedPermissions, onSelectionChange]);

  const removeSelectedPermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.filter((permission) => permission.id !== id),
    );
  };

  const togglePermission = (permission: Permission, checked: boolean) => {
    if (checked) {
      setSelectedPermissions((prev) => [...prev, permission]);
    } else {
      setSelectedPermissions((prev) =>
        prev.filter((p) => p.id !== permission.id),
      );
    }
  };

  const isPermissionSelected = (permissionId: string) => {
    return selectedPermissions.some(
      (permission) => permission.id === permissionId,
    );
  };

  const filteredPermissions = permissions.filter((permission) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      permission.label.toLowerCase().includes(query) ||
      permission.id.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (selectedsContainerRef.current) {
      selectedsContainerRef.current.scrollTo({
        left: selectedsContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [selectedPermissions]);

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
    <div className="w-full max-w-lg space-y-4">
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Selected Permissions */}
      {selectedPermissions.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[13px]">Selected Permissions ({selectedPermissions.length})</h3>
          <div className="flex flex-wrap gap-2" ref={selectedsContainerRef}>
            {selectedPermissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center gap-1.5 rounded-md bg-primary-50 px-2 py-0.5 text-[13px]"
              >
                <span className="font-medium text-sm">{permission.label}</span>
                <button
                  type="button"
                  onClick={() => removeSelectedPermission(permission.id)}
                  className="rounded-full p-0.5 transition-colors hover:bg-muted"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Permissions */}
      <ScrollArea className="h-42 max-h-72">
        <div className="space-y-4 px-3">
          {filteredPermissions.length > 0 ? (
            filteredPermissions.map((permission) => (
              <div key={permission.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`checkbox-${permission.id}`}
                  checked={isPermissionSelected(permission.id)}
                  onCheckedChange={(checked) =>
                    togglePermission(permission, checked as boolean)
                  }
                />
                <label
                  htmlFor={`checkbox-${permission.id}`}
                  className="flex-1 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <span>{permission.label}</span>
                </label>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">
                No permissions found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
