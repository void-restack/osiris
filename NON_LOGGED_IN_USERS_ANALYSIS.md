# Analysis: Supporting Non-Logged-In Users

## Executive Summary

To make the Osiris website accessible to non-logged-in users, we need to modify the application to:
1. **Conditionally load user-specific data** based on authentication state
2. **Create public versions** of certain API queries  
3. **Update UI components** to handle missing user data gracefully
4. **Implement authentication state detection** utility
5. **Modify route loaders** to skip user-specific queries when not authenticated

## Current Authentication Architecture

### Authentication State Management
- **Token Storage**: `localStorage.getItem("access_token")`
- **Fallback Token**: Hard-coded development token in `api.ts` (line 47)
- **401 Handling**: Automatic redirect to "/" with token cleanup
- **User Data**: Fetched via `userQueries.meOptions()` in many components

### Key Authentication Points
1. **API Client** (`src/lib/api.ts`): Always includes Bearer token if available
2. **UserPopover** (`src/components/user-popover.tsx`): Uses `useSuspenseQuery(userQueries.meOptions())`
3. **Route Loaders**: Most fetch user-specific data unconditionally

## Required Changes by Category

### 1. Authentication Utility Creation

**New File**: `src/lib/auth.ts`
```typescript
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("access_token");
  return !!token && token !== ""; // Could add JWT validation
};

export const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  
  useEffect(() => {
    const checkAuth = () => setAuthenticated(isAuthenticated());
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  
  return authenticated;
};
```

### 2. Query Modifications

**File**: `src/lib/queries.ts`

#### User-Specific Queries to Make Optional:
- `userQueries.meOptions()` - `/users`
- `userQueries.authProvidersOptions()` - `/users/auth`  
- `packageQueries.userInstalledOptions()` - `/packages/packages/user`
- `packageQueries.userDeploymentsOptions()` - `/packages/packages/user/deployments`
- `packageQueries.userActionsOptions()` - `/packages/packages/user/actions`
- `hubQueries.authMethodsOptions()` - `/hub/auth`
- `hubQueries.userAuthOptions()` - `/hub/auth/user`
- `hubQueries.userAuthConnectionOptions()` - `/hub/auth/user/{id}`
- `hubQueries.userAuthConnectionUnencryptedOptions()` - `/hub/auth/user/{id}` (unencrypted)

#### Add Conditional Query Options:
```typescript
// Example pattern for conditional queries
export const conditionalUserQueries = {
  meOptions: (enabled = true) => 
    queryOptions({
      ...userQueries.meOptions(),
      enabled: enabled && isAuthenticated(),
    }),
};
```

### 3. Route Loader Changes

#### **High Priority Routes** (Public Access Required)

**File**: `src/routes/_hub/mcp.index.tsx`
- **Current**: Loads `userInstalledOptions()`, `userDeploymentsOptions()`, `userQueries.meOptions()`
- **Change**: Only load user data if authenticated
- **Impact**: Non-logged users see all MCPs but no installation/deployment status

**File**: `src/routes/_hub/mcp.$mcpId.tsx` 
- **Current**: Only public data (✅ Already suitable for non-logged users)
- **Change**: None needed
- **Impact**: Full MCP details available to everyone

#### **Medium Priority Routes** (Limited Public Access)

**File**: `src/routes/_hub/auth.index.tsx`
- **Current**: Loads `hubQueries.authMethodsOptions()`, `userQueries.meOptions()`
- **Change**: Show public auth methods list only, hide user connections
- **Impact**: Non-logged users see available auth methods but can't connect

**File**: `src/routes/_hub/auth.$authId.tsx`
- **Current**: Loads user-specific auth connection data
- **Change**: Redirect non-logged users or show auth method info only
- **Impact**: Becomes a "learn about this auth method" page for non-logged users

#### **Low Priority Routes** (Require Authentication)

**File**: `src/routes/_hub/knowledge/index.tsx`
- **Current**: Conditionally loads `knowledgeQueries.myOptions()` vs `knowledgeQueries.basesOptions()`
- **Change**: Always show public knowledge bases for non-logged users  
- **Impact**: Non-logged users see all public knowledge bases

**File**: `src/routes/oauth.consent.tsx`
- **Current**: Loads user deployments and connections
- **Change**: Keep authentication requirement (OAuth flow needs login)
- **Impact**: Redirect to login if not authenticated

### 4. Component Updates

#### **Header Components**

**File**: `src/routes/_hub/route.tsx`
**Component**: Header with `UserPopover`
- **Change**: Replace `UserPopover` with login button for non-logged users
- **New Component**: `AuthHeader` that switches based on auth state

**File**: `src/components/user-popover.tsx`
- **Change**: Add error boundary and conditional rendering
- **Pattern**: `{isAuthenticated ? <UserPopover /> : <LoginButton />}`

#### **Sidebar Components**

**File**: `src/components/app-sidebar.tsx`
**Section**: Credit card and user info (lines 99-118)
- **Change**: Hide credit section for non-logged users
- **Alternative**: Show "Sign up for credits" call-to-action

#### **Data Display Components**

**File**: `src/components/features/mcp-list/*`
- **Change**: Remove user-specific status indicators (installed, deployed) for non-logged users
- **Keep**: All MCP browsing and filtering functionality

**File**: `src/components/features/authhub/*`
- **Change**: Show auth methods as "information only" for non-logged users
- **Remove**: Connection management UI

### 5. Layout and UI Changes

#### **Navigation Updates**
- **Main Navigation**: Keep all navigation items visible
- **Action Buttons**: Replace with "Sign In to [Action]" for non-logged users
- **Breadcrumbs**: Keep functional for public pages

#### **Call-to-Action Strategy**
- **MCP Pages**: "Sign in to install" buttons
- **Auth Pages**: "Sign in to connect" buttons  
- **Knowledge Base**: "Sign in to create your own" buttons

### 6. Error Handling Updates

#### **Query Error Boundaries**
- **Pattern**: Graceful degradation instead of error pages
- **User Experience**: Show limited functionality rather than blocking access

#### **API Error Handling**
**File**: `src/lib/api.ts`
- **Current**: 401 → immediate redirect to "/"
- **Change**: 401 → return null/empty data for optional user queries
- **Keep**: 401 → redirect for required auth endpoints

## Implementation Priority

### Phase 1: Core Infrastructure (High Priority)
1. Create `src/lib/auth.ts` utility
2. Update `src/lib/queries.ts` with conditional queries
3. Modify `src/routes/_hub/mcp.index.tsx` loader
4. Update `UserPopover` component with conditional rendering

### Phase 2: Public MCP Access (High Priority)  
1. Ensure `src/routes/_hub/mcp.$mcpId.tsx` works without auth
2. Update MCP list components to hide user-specific features
3. Add "Sign in to install/deploy" CTAs

### Phase 3: Auth Hub Public View (Medium Priority)
1. Modify `src/routes/_hub/auth.index.tsx` for public access
2. Update auth components to show informational view
3. Add "Sign in to connect" CTAs

### Phase 4: Polish and UX (Low Priority)
1. Update sidebar for non-logged users
2. Add comprehensive sign-up CTAs
3. Improve error boundaries and loading states

## Testing Scenarios

### Manual Testing Required
1. **Clear localStorage** and visit `/mcp` → Should see all packages
2. **Visit MCP detail pages** → Should see full information  
3. **Try to access auth pages** → Should see public view
4. **Check responsive behavior** → Ensure mobile works
5. **Test error scenarios** → Network failures, API errors

### Regression Testing
1. **Logged-in user experience** → Should remain unchanged
2. **Authentication flows** → OAuth, secret sharing still work
3. **Data consistency** → User-specific data loads correctly when authenticated

## API Considerations

### Backend Requirements
- **No API changes needed** for basic functionality
- **Optional**: New public endpoints for better UX
  - `GET /packages/public` - Public package list optimized for non-users
  - `GET /auth-methods/public` - Public auth methods info

### Performance Implications  
- **Reduced API calls** for non-logged users (positive)
- **Conditional loading** may improve initial page load
- **Cache strategy** for public vs. authenticated data

## Security Considerations

### Data Exposure
- **Public pages** should not expose user-specific information
- **Error messages** should not leak authentication state
- **API responses** should be sanitized for public consumption

### Rate Limiting
- **Non-authenticated requests** may need different rate limits
- **Public endpoints** should have appropriate throttling

## Conclusion

This implementation will significantly improve the accessibility of the Osiris platform while maintaining security and user experience for authenticated users. The phased approach allows for incremental delivery and testing of the feature.

**Estimated Development Time**: 3-5 days
**Testing Time**: 1-2 days  
**Risk Level**: Medium (requires careful authentication state management)