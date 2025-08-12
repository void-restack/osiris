import { userQueries } from './queries'
import type { QueryClient } from '@tanstack/react-query'

export async function getAuthState(queryClient: QueryClient) {
    try {
        const user = await queryClient.fetchQuery({
            ...userQueries.meOptions(),
            retry: false,
        })
        return { user, isAuthenticated: true }
    } catch (error: any) {
        if (error?.status === 401) {
            return { user: null, isAuthenticated: false }
        }
        throw error
    }
}
