import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { guestLogin, login } from '@/services'
import { useUserStore } from '@/store/user'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useUserStore((state) => state.setAuth)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const { user, token } = await login({ email, password })
    setAuth(user, token)
    navigate('/dashboard')
  }

  const handleGuest = async () => {
    const { user, token } = await guestLogin()
    setAuth(user, token)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-900 via-surface-950 to-black px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-surface-950/70 backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-300">Breno Finance</p>
            <CardTitle className="text-white">Access your analytics HQ</CardTitle>
            <CardDescription>Use any email/password for now.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <label htmlFor="email" className="space-y-2 text-sm font-medium text-slate-300">
              Email
              <Input id="email" name="email" type="email" placeholder="demo@breno.finance" required />
            </label>
            <label htmlFor="password" className="space-y-2 text-sm font-medium text-slate-300">
              Password
              <Input id="password" name="password" type="password" placeholder="demo123" required />
            </label>
          </CardContent>

          <CardFooter className="block">
            <Button type="submit" className="w-full">
              Access dashboard
            </Button>
            <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => navigate('/signup')}>
              Create an account
            </Button>
            <Button type="button" variant="ghost" className="mt-3 w-full" onClick={handleGuest}>
              Continue as guest
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
