import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, Linkedin, Youtube } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    setError(null)
    setLoading(true)
    try {
      const { user, token } = await login({ email, password })
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setError(null)
    const { user, token } = await guestLogin()
    setAuth(user, token)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-900 via-surface-950 to-black px-4 py-10">
      <div className="w-full max-w-6xl space-y-8 mx-auto">
        <Card className="w-full max-w-2xl mx-auto border-white/10 bg-surface-950/80 backdrop-blur-lg shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardHeader className="space-y-2">
              <p className="text-2xl font-bold uppercase tracking-[0.4em] text-brand-300">Breno Finance</p>
              <CardTitle className="text-3xl text-white">Access your analytics HQ</CardTitle>
              <CardDescription className="text-lg text-surface-200">Sign in to access your analytics.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <label htmlFor="email" className="space-y-2 text-lg font-medium text-slate-200">
                Email
                <Input id="email" name="email" type="email" placeholder="Type email" required className="h-12 text-lg" />
              </label>
              <label htmlFor="password" className="space-y-2 text-lg font-medium text-slate-200">
                Password
                <Input id="password" name="password" type="password" placeholder="Type password" required className="h-12 text-lg" />
                <p className="text-base text-surface-300">Min 6 characters.</p>
              </label>
              {error ? (
                <p className="text-lg font-semibold text-danger" role="alert" aria-live="polite">
                  {error}
                </p>
              ) : null}
            </CardContent>

            <CardFooter className="px-6 pb-6 flex justify-center">
              <div className="grid w-full max-w-xl gap-3">
                <Button type="submit" className="h-14 w-full text-xl" disabled={loading}>
                  {loading ? 'Signing in...' : 'Access dashboard'}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-14 w-full text-xl"
                    onClick={() => navigate('/signup')}
                  >
                    Create an account
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-14 w-full text-xl !bg-amber-500 !text-black hover:!bg-amber-400 !border-transparent dark:!bg-amber-400 dark:!text-black"
                    onClick={handleGuest}
                  >
                    Continue as guest
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        <Card className="w-full border-white/10 bg-surface-950/70 backdrop-blur shadow-lg max-w-5xl mx-auto">
          <div className="space-y-4 p-6 text-lg text-surface-200">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">About the creator</p>
            <p className="text-2xl font-bold text-white">Breno Lopes Mafra</p>
            <p>
              I’m a George Brown College graduate (Computer Programming and Analysis – Advanced Diploma) who enjoys solving problems through
              clean and efficient code. Naturally curious and focused on continuous learning, aiming to build robust backend solutions that make applications reliable, scalable, and maintainable.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xl font-semibold">
              <a
                className="flex items-center gap-2 text-brand-300 hover:text-brand-200 underline"
                href="https://www.linkedin.com/in/breno-lopes-mafra/"
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </a>
              <a
                className="flex items-center gap-2 text-brand-300 hover:text-brand-200 underline"
                href="https://github.com/BrenoMafra13"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-5 w-5" />
                GitHub
              </a>
              <a
                className="flex items-center gap-2 text-brand-300 hover:text-brand-200 underline"
                href="https://www.youtube.com/@brenolopesmafra4519"
                target="_blank"
                rel="noreferrer"
              >
                <Youtube className="h-5 w-5" />
                YouTube
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
