# TanStack Table Best Practices Guide

Based on analysis of the [shadcn-table repository](https://github.com/sadmann7/shadcn-table), this guide outlines best practices for implementing data tables with TanStack Table, React Query, and URL state management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [URL State Management](#url-state-management)
3. [Data Fetching Patterns](#data-fetching-patterns)
4. [Column Configuration](#column-configuration)
5. [Filtering & Sorting](#filtering--sorting)
6. [Pagination](#pagination)
7. [Performance Optimizations](#performance-optimizations)
8. [Common Pitfalls](#common-pitfalls)
9. [Implementation Checklist](#implementation-checklist)

## Architecture Overview

### Key Principles

1. **Server-Side Rendering with Suspense**: Use React Suspense for loading states
2. **Automatic URL Sync**: Let `useDataTable` handle all URL state management
3. **Manual Operations**: Always use `manualPagination`, `manualSorting`, `manualFiltering`
4. **Type Safety**: Strong typing throughout the data flow
5. **Separation of Concerns**: Clear separation between data fetching, state management, and UI

### Architecture Flow

```
URL Parameters → useDataTable → Table State → Data Fetching → UI Rendering
     ↑                                                              ↓
     └─────────────── Automatic Sync via nuqs ─────────────────────┘
```

## URL State Management

### ✅ Correct Approach (shadcn-table)

```typescript
// Let useDataTable handle everything automatically
const { table } = useDataTable({
  data,
  columns,
  pageCount,
  initialState: {
    sorting: [{ id: "createdAt", desc: true }],
  },
  // No manual URL sync needed
});
```

### ❌ Avoid Manual URL Sync

```typescript
// DON'T do this - conflicts with useDataTable
useEffect(() => {
  const filters = table.getState().columnFilters;
  navigate({
    search: (prev) => ({
      ...prev,
      search: filters.find(f => f.id === 'name')?.value,
    })
  });
}, [table.getState().columnFilters]);
```

### URL Parameter Structure

The `useDataTable` hook automatically creates these URL parameters:

- `page`: Current page number (1-based)
- `perPage`: Items per page
- `sort`: JSON string of sorting state
- `{columnId}`: Filter values for each column (e.g., `name`, `description`)

## Data Fetching Patterns

### Server-Side Data Fetching

```typescript
// 1. Create search params cache
export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Task>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  title: parseAsString.withDefault(""),
  status: parseAsArrayOf(z.enum(tasks.status.enumValues)).withDefault([]),
});

// 2. Server component with Suspense
export default async function IndexPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const search = searchParamsCache.parse(await searchParams);
  
  return (
    <React.Suspense fallback={<DataTableSkeleton />}>
      <TasksTable promises={getTasks(search)} />
    </React.Suspense>
  );
}
```

### Client-Side Data Fetching

```typescript
// For client-side apps, use React Query with URL state
const { data, isPending } = useQuery({
  ...packageQueries.listOptions({
    page: search?.page || 1,
    limit: search?.perPage || 10,
    search: search?.name || search?.description,
  }),
});

const { table } = useDataTable({
  data: packages,
  columns,
  pageCount: data?.pagination?.totalPages || -1,
});
```

## Column Configuration

### Column Definition Best Practices

```typescript
export const createColumns = (): ColumnDef<Package>[] => [
  {
    id: "name", // ✅ Always provide explicit ID
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Package" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {/* Rich cell content */}
      </div>
    ),
    enableSorting: true, // ✅ Explicit control
    enableColumnFilter: true, // ✅ Enable for searchable columns
    enableHiding: false, // ✅ Disable for important columns
    meta: {
      variant: "text",
      label: "Package Name",
      placeholder: "Search packages...",
    },
  },
];
```

### Column Types

1. **Text Columns**: Simple string display with optional filtering
2. **Select Columns**: Dropdown with predefined options
3. **Date Columns**: Date picker with range support
4. **Number Columns**: Numeric input with min/max
5. **Action Columns**: Buttons, dropdowns, checkboxes

## Filtering & Sorting

### Filter Configuration

```typescript
// Column with filter options
{
  id: "status",
  accessorKey: "status",
  header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  cell: ({ row }) => <Badge>{row.getValue("status")}</Badge>,
  enableColumnFilter: true,
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id));
  },
  meta: {
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
}
```

### Advanced Filtering

```typescript
// Enable advanced filtering for complex scenarios
const { table } = useDataTable({
  data,
  columns,
  pageCount,
  enableAdvancedFilter: true, // ✅ For complex filter combinations
});
```

## Pagination

### Pagination Configuration

```typescript
const { table } = useDataTable({
  data,
  columns,
  pageCount: Math.ceil(total / perPage), // ✅ Always provide accurate pageCount
  initialState: {
    pagination: {
      pageIndex: 0, // ✅ 0-based index
      pageSize: 10,
    },
  },
});
```

### Pagination Component

```typescript
// Built-in pagination with URL sync
<DataTablePagination 
  table={table}
  pageSizeOptions={[10, 20, 50, 100]}
/>
```

## Performance Optimizations

### 1. Debounced Filtering

```typescript
// useDataTable handles this automatically
const { table, debounceMs, throttleMs } = useDataTable({
  debounceMs: 300, // ✅ Debounce filter changes
  throttleMs: 50,  // ✅ Throttle URL updates
});
```

### 2. Memoized Columns

```typescript
const columns = React.useMemo(
  () => createColumns({ statusCounts, priorityCounts }),
  [statusCounts, priorityCounts]
);
```

### 3. Row Selection Optimization

```typescript
const { table } = useDataTable({
  data,
  columns,
  pageCount,
  getRowId: (originalRow) => originalRow.id, // ✅ Stable row IDs
});
```

### 4. Virtual Scrolling (for large datasets)

```typescript
// For tables with 1000+ rows
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollElement.current,
  estimateSize: () => 35,
});
```

## Common Pitfalls

### ❌ Pitfall 1: Manual URL Sync

```typescript
// DON'T: Manual URL management conflicts with useDataTable
useEffect(() => {
  navigate({ search: { page: table.getState().pagination.pageIndex + 1 } });
}, [table.getState().pagination.pageIndex]);
```

### ❌ Pitfall 2: Client-Side Pagination

```typescript
// DON'T: Paginate on client for large datasets
const paginatedData = data.slice(start, end);
```

### ❌ Pitfall 3: Missing Loading States

```typescript
// DON'T: No loading state
return <DataTable table={table} />;

// ✅ DO: Proper loading states
return (
  <React.Suspense fallback={<DataTableSkeleton />}>
    <DataTable table={table} />
  </React.Suspense>
);
```

### ❌ Pitfall 4: Incorrect Page Count

```typescript
// DON'T: Hardcoded or incorrect pageCount
pageCount: 10, // ❌ Wrong

// ✅ DO: Calculate from actual data
pageCount: Math.ceil(total / perPage),
```

## Implementation Checklist

### Setup Phase

- [ ] Install dependencies: `@tanstack/react-table`, `nuqs`
- [ ] Create `useDataTable` hook (or use existing)
- [ ] Set up URL parameter parsing with `nuqs`
- [ ] Configure column definitions with proper IDs
- [ ] Set up data fetching with proper pagination

### Column Configuration

- [ ] Define explicit column IDs
- [ ] Configure `enableColumnFilter` for searchable columns
- [ ] Set up `enableSorting` for sortable columns
- [ ] Add proper `meta` information for filters
- [ ] Implement custom `filterFn` for complex filtering

### State Management

- [ ] Use `manualPagination: true`
- [ ] Use `manualSorting: true`
- [ ] Use `manualFiltering: true`
- [ ] Provide accurate `pageCount`
- [ ] Set up proper `initialState`

### UI Components

- [ ] Implement loading skeletons
- [ ] Add error boundaries
- [ ] Configure pagination component
- [ ] Set up toolbar with filters
- [ ] Add row selection if needed

### Performance

- [ ] Memoize column definitions
- [ ] Use stable row IDs
- [ ] Implement proper debouncing
- [ ] Add virtual scrolling for large datasets
- [ ] Optimize re-renders with React.memo

### Testing

- [ ] Test URL state persistence
- [ ] Test pagination navigation
- [ ] Test filter functionality
- [ ] Test sorting behavior
- [ ] Test loading states
- [ ] Test error handling

## Migration Guide

### From Manual URL Management

1. Remove all manual `useEffect` hooks for URL sync
2. Remove manual `navigate` calls for table state
3. Let `useDataTable` handle all URL state automatically
4. Update queries to read from URL parameters
5. Test that all functionality still works

### From Client-Side Pagination

1. Move pagination logic to server
2. Update data fetching to use `page` and `perPage` parameters
3. Calculate accurate `pageCount` from total records
4. Remove client-side data slicing
5. Test server-side pagination performance

## Advanced Patterns

### 1. Advanced Filtering

```typescript
// For complex filter combinations
const { table } = useDataTable({
  enableAdvancedFilter: true,
  // Custom filter components will be used
});
```

### 2. Row Actions

```typescript
// For row-level actions
const [rowAction, setRowAction] = useState<DataTableRowAction<Task> | null>(null);

// In column definition
{
  id: "actions",
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setRowAction({ variant: "update", row })}>
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

### 3. Bulk Actions

```typescript
// For bulk operations
const selectedRows = table.getFilteredSelectedRowModel().rows;

{selectedRows.length > 0 && (
  <div className="flex items-center gap-2">
    <span>{selectedRows.length} selected</span>
    <Button onClick={handleBulkDelete}>Delete Selected</Button>
  </div>
)}
```

## Conclusion

The key to successful TanStack Table implementation is:

1. **Let `useDataTable` handle all URL state automatically**
2. **Use server-side pagination for performance**
3. **Implement proper loading states with Suspense**
4. **Configure columns with explicit IDs and proper metadata**
5. **Test URL state persistence and navigation**

Following these patterns will result in performant, maintainable, and user-friendly data tables that work seamlessly with browser navigation and URL sharing.

## Resources

- [shadcn-table Repository](https://github.com/sadmann7/shadcn-table)
- [TanStack Table Documentation](https://tanstack.com/table/v8)
- [nuqs Documentation](https://nuqs.47ng.com/)
- [React Query Documentation](https://tanstack.com/query/latest) 