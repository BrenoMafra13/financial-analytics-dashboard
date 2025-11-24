import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useUserStore } from '@/store/user'

const currencyOptions = ['USD', 'CAD']
const localeByCurrency: Record<string, string> = {
  USD: 'en-US',
  CAD: 'en-CA',
}

export function ProfileCard() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const [currency, setCurrency] = useState<'USD' | 'CAD'>((user?.currency as 'USD' | 'CAD') || 'USD')
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  const handleSave = () => {
    if (!user) return
    setUser({
      ...user,
      name,
      email,
      currency,
      locale: localeByCurrency[currency],
    })
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>Profile</CardTitle>
        <CardDescription>Edit your basic information (local only).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'CAD')}>
            {currencyOptions.map((cur) => (
              <option key={cur} value={cur} className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
                {cur}
              </option>
            ))}
          </Select>
          <Input placeholder="Locale" value={localeByCurrency[currency]} disabled />
        </div>
        <Button type="button" variant="secondary" className="w-fit" onClick={handleSave}>
          Save (mock)
        </Button>
      </CardContent>
    </Card>
  )
}
