import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { useLoginMutation } from '@/lib/mutations'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/icon'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const loginMutation = useLoginMutation()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    loginMutation.mutate(
      { provider: 'google', redirectUri: "https://app.osirislabs.xyz/auth" },
      {
        onSuccess: () => {
          setIsGoogleLoading(false)
        },
        onError: (error) => {
          setIsGoogleLoading(false)
          toast.error(`Google login failed: ${error.message}`)
        }
      }
    )
  }

  const handleGithubLogin = () => {
    setIsGithubLoading(true)
    loginMutation.mutate(
      { provider: 'github', redirectUri: "https://app.osirislabs.xyz/auth" },
      {
        onSuccess: () => {
          setIsGithubLoading(false)
        },
        onError: (error) => {
          setIsGithubLoading(false)
          toast.error(`GitHub login failed: ${error.message}`)
        }
      }
    )
  }

  return (
    <div className='w-full h-screen flex flex-col items-center justify-center'>
      <img src="/user-login.png" alt="logo" className="size-20 mb-3" />
      <h1 className='text-xl font-medium mb-6'>Login to your account</h1>
      <div className="space-y-3">
        <Button
          variant="secondary"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full rounded-none"
          icon={isGoogleLoading ? () => <Loader2 className='animate-spin' /> : () => <Icon name='google' />}
          iconPlacement='left'
        >
          {isGoogleLoading ? 'Redirecting...' : 'Login with Google'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleGithubLogin}
          disabled={isGithubLoading}
          className="w-full"
          icon={isGithubLoading ? () => <Loader2 className='animate-spin' /> : () => <Icon name='github' size='xl' />}
          iconPlacement='left'
        >
          {isGithubLoading ? 'Redirecting...' : 'Login with GitHub'}
        </Button>
      </div >
    </div >
  )
}
