import { type FormEvent, useState } from 'react'
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
import { register } from '@/services'
import { useUserStore } from '@/store/user'
import { isAxiosError } from 'axios'

const currencyOptions = ['USD', 'CAD']
const localeByCurrency: Record<string, string> = {
  USD: 'en-US',
  CAD: 'en-CA',
}

export function SignupPage() {
  const navigate = useNavigate()
  const setAuth = useUserStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'CAD'>('USD')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      const form = new FormData(event.currentTarget)
      const payload = {
        name: String(form.get('name') || '').trim(),
        email: String(form.get('email') || '').trim(),
        password: String(form.get('password') || ''),
        currency,
        locale: localeByCurrency[currency],
      }
      if (!payload.name || !payload.email || !payload.password || payload.password.length < 6) {
        throw new Error('Please fill all fields. Password must be at least 6 characters.')
      }
      const { user, token } = await register(payload)
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError('Account already exists for this email.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Could not create account.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-900 via-surface-950 to-black px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-surface-950/70 backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-700 dark:text-brand-300">Breno Finance</p>
            <CardTitle className="text-white">Create your account</CardTitle>
            <CardDescription>Set currency and locale from the start.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <label htmlFor="name" className="space-y-2 text-sm font-medium text-slate-300">
              Full name
              <Input id="name" name="name" type="text" placeholder="Your name" required />
            </label>
            <label htmlFor="email" className="space-y-2 text-sm font-medium text-slate-300">
              Email
              <Input id="email" name="email" type="email" placeholder="you@email.com" required />
            </label>
            <label htmlFor="password" className="space-y-2 text-sm font-medium text-slate-300">
              Password
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="currency" className="space-y-2 text-sm font-medium text-slate-300">
                Currency
                <select
                  id="currency"
                  name="currency"
                  value={currency}
                  className="w-full rounded-2xl border border-surface-200 bg-white/80 px-3 py-2 text-surface-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-offset-surface-950"
                  required
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'CAD')}
                >
                  {currencyOptions.map((cur) => (
                    <option key={cur} value={cur} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                      {cur}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="locale" className="space-y-2 text-sm font-medium text-slate-300">
                Locale
                <Input id="locale" name="locale" type="text" value={localeByCurrency[currency]} disabled />
              </label>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </CardContent>

          <CardFooter className="block space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Sign up'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={() => navigate('/login')}>
              Already have an account? Log in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
