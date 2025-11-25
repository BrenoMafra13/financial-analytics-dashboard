import { useState, type ChangeEvent } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import { useUserStore } from '@/store/user'
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
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currency, setCurrency] = useState<'USD' | 'CAD'>((user?.currency as 'USD' | 'CAD') || 'USD')
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null)
  const [saving, setSaving] = useState(false)
  const locale = localeByCurrency[currency]

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
    const updated = await updateProfile({ name, email, currency, locale, avatarUrl: avatar })
    setUser(updated)
    setSaving(false)
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-brand text-lg font-semibold text-white">
              {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{name?.[0] ?? 'U'}</span>}
            </div>
            <div>
              <label className="text-sm font-medium text-surface-900 dark:text-white">Profile photo</label>
              <input type="file" accept="image/*" className="mt-2 text-sm" onChange={handleAvatar} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Name</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Email</p>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-900 dark:text-white">Currency</p>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'CAD')}>
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

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-surface-100 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-white">Theme</p>
              <p className="text-sm text-surface-500 dark:text-slate-400">Light or dark across the app.</p>
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
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <Button type="button" onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
