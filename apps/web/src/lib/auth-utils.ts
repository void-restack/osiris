import { userQueries } from './queries'
import type { QueryClient } from '@tanstack/react-query'

export async function getAuthState(queryClient: QueryClient) {
    try {
        const user = await queryClient.fetchQuery({
            ...userQueries.meOptions(),
            retry: false,
        })
        if (!user) {
            return { user: null, isAuthenticated: false }
        }
        return { user, isAuthenticated: true }
    } catch (error: any) {
        if (error?.status === 401) {
            return { user: null, isAuthenticated: false }
        }
        if (error?.status === 500) {
            console.warn('Server error during auth check, treating as unauthenticated:', error)
            return { user: null, isAuthenticated: false }
        }

        if (error?.status === 0 || error?.message?.includes('fetch')) {
            console.warn('Network error during auth check, treating as unauthenticated:', error)
            return { user: null, isAuthenticated: false }
        }
        throw error
    }
}
