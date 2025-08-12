import { useQuery } from '@tanstack/react-query'
import { userQueries } from '@/lib/queries'
import { hasAuthCookie } from '@/lib/auth-utils'

export function useAuth() {
    const { data: user, isLoading } = useQuery({
        ...userQueries.meOptions(),
        retry: false,
        throwOnError: false,
        enabled: hasAuthCookie(), // Only fetch if there's an auth cookie
    })

    return {
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
    }
}
