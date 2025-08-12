import { userQueries } from './queries'
import type { QueryClient } from '@tanstack/react-query'

export async function getAuthState(queryClient: QueryClient) {
    // First check if there's an auth cookie
    // if (!hasAuthCookie()) {
    //     return { user: null, isAuthenticated: false }
    // }

    try {
        const user = await queryClient.ensureQueryData(userQueries.meOptions())
        return { user, isAuthenticated: true }
    } catch (error: any) {
        if (error?.status === 401) {
            return { user: null, isAuthenticated: false }
        }
        throw error
    }
}

export function hasAuthCookie(): boolean {
    return document.cookie.includes('access_token=')
}
