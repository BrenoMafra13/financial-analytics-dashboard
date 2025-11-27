import { useState, type ChangeEvent } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import { useUserStore } from '@/store/user'
import { useCurrencyStore, convertAmount } from '@/store/currency'
import { Github, Linkedin, Youtube } from 'lucide-react'
import { updateProfile } from '@/services/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const currencyOptions = ['USD', 'CAD']
const localeByCurrency: Record<string, string> = {
  USD: 'en-US',
  CAD: 'en-CA',
}

export function SettingsPage() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const logout = useUserStore((state) => state.logout)
  const setCurrencyTarget = useCurrencyStore((state) => state.setTarget)
  const refreshRates = useCurrencyStore((state) => state.refreshRates)
  const rates = useCurrencyStore((state) => state.rates)
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currency, setCurrency] = useState<'USD' | 'CAD'>((user?.currency as 'USD' | 'CAD') || 'USD')
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null)
  const [budget, setBudget] = useState<number>(user?.budget ?? 2000)
  const [saving, setSaving] = useState(false)
  const locale = localeByCurrency[currency]
  const isGuest = user?.tier === 'guest'

  const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await updateProfile({ name, email, currency, locale, avatarUrl: avatar, budget })
      setUser(updated)
      setCurrencyTarget(updated.currency as 'USD' | 'CAD')
      await refreshRates()
    } catch (err) {
      console.error('Profile update failed', err)
      alert('Unable to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Profile & Settings</h2>
      <Card className="p-0">
        <CardHeader className="px-6 py-4">
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your profile, theme, and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="flex flex-col items-center gap-4">
            <label className="text-sm font-medium text-surface-900 dark:text-white">Profile photo</label>
            <div className="relative h-64 w-64 overflow-hidden rounded-full bg-gradient-brand text-3xl font-semibold text-white shadow-xl">
              {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{name?.[0] ?? 'U'}</span>}
              <label className="absolute inset-0 flex items-end justify-center pb-4">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-surface-900 shadow-sm backdrop-blur transition hover:bg-white dark:bg-surface-800/90 dark:text-white dark:hover:bg-surface-700">
                  Change photo
                </span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Name</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isGuest} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Email</p>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isGuest} />
            </div>
          </div>

          {isGuest ? (
            <p className="text-sm font-semibold text-amber-400">
              Guest accounts cannot change name/email. You can update currency, budget, avatar, and theme. Full editing is available for signed-up users.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Currency</p>
              <Select
                value={currency}
                onChange={(e) => {
                  const next = e.target.value as 'USD' | 'CAD'
                  if (currency !== next) {
                    setBudget((prev) => convertAmount(prev, currency, next, rates))
                  }
                  setCurrency(next)
                }}
              >
                {currencyOptions.map((cur) => (
                  <option key={cur} value={cur} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                    {cur}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Locale</p>
              <Input value={locale} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-900 dark:text-white">Monthly budget</p>
            <Input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-surface-100 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-white">Theme</p>
              <p className="text-sm text-surface-600 dark:text-slate-200">Light or dark across the app.</p>
            </div>
            <Select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')} className="w-32">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-200">Logout</p>
              <p className="text-sm text-red-600/80 dark:text-red-200/80">Leave your account and return to the login screen.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900"
              onClick={handleLogout}
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </span>
            </Button>
          </div>

          <Button type="button" onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="px-6 py-4">
          <CardTitle>About the creator</CardTitle>
          <CardDescription>Find me online and see more of my work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 text-lg text-surface-700 dark:text-slate-200">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">Breno Lopes Mafra</p>
          <p>
            I’m a George Brown College graduate (Computer Programming and Analysis – Advanced Diploma) who enjoys solving problems through clean and efficient code. Naturally curious and focused on continuous learning, aiming to build robust backend solutions that make applications reliable, scalable, and maintainable.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xl font-semibold">
            <a
              className="flex items-center gap-2 text-brand-600 hover:text-brand-500 underline dark:text-brand-300"
              href="https://www.linkedin.com/in/breno-lopes-mafra/"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin className="h-6 w-6" />
              LinkedIn
            </a>
            <a
              className="flex items-center gap-2 text-brand-600 hover:text-brand-500 underline dark:text-brand-300"
              href="https://github.com/BrenoMafra13"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="h-6 w-6" />
              GitHub
            </a>
            <a
              className="flex items-center gap-2 text-brand-600 hover:text-brand-500 underline dark:text-brand-300"
              href="https://www.youtube.com/@brenolopesmafra4519"
              target="_blank"
              rel="noreferrer"
            >
              <Youtube className="h-6 w-6" />
              YouTube
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
