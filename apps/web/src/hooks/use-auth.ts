import { useQuery } from '@tanstack/react-query'
import { userQueries } from '@/lib/queries'

export function useAuth() {
    const { data: user, isLoading, error } = useQuery({
        ...userQueries.meOptions(),
        retry: false,
        throwOnError: false,
        // Always try to fetch user data - the API will handle auth state
        // If no valid auth, it will return 401 and we'll handle it gracefully
    })

    return {
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
        error,
    }
}
