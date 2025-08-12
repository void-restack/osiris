import { useAuth } from '@/hooks/use-auth'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

export function AuthGuard({ children, fallback = null }: Props) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) return null
    if (!isAuthenticated) return <>{fallback}</>
    return <>{children}</>
}

export function GuestOnly({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading || isAuthenticated) return null
    return <>{children}</>
}
