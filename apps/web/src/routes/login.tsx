import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { useLoginMutation } from '@/lib/mutations'
import { toast } from 'sonner'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const loginMutation = useLoginMutation()

  const handleGoogleLogin = () => {
    loginMutation.mutate(
      { provider: 'google' },
      {
        onError: (error) => {
          toast.error(`Google login failed: ${error.message}`)
        }
      }
    )
  }

  const handleGithubLogin = () => {
    loginMutation.mutate(
      { provider: 'github' },
      {
        onError: (error) => {
          toast.error(`GitHub login failed: ${error.message}`)
        }
      }
    )
  }

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className="space-y-4">
        <Button
          onClick={handleGoogleLogin}
          disabled={loginMutation.isPending}
          className="w-full"
        >
          {loginMutation.isPending ? 'Redirecting...' : 'Login with Google'}
        </Button>
        <Button
          onClick={handleGithubLogin}
          disabled={loginMutation.isPending}
          className="w-full"
        >
          {loginMutation.isPending ? 'Redirecting...' : 'Login with GitHub'}
        </Button>
      </div>
    </div>
  )
}
