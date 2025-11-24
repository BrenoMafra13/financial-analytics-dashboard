import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { guestLogin } from '@/services'
import { useUserStore } from '@/store/user'

export function LandingPage() {
  const navigate = useNavigate()
  const setAuth = useUserStore((state) => state.setAuth)

  const handleGuest = async () => {
    const { user, token } = await guestLogin()
    setAuth(user, token)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-900 via-surface-950 to-black px-6 py-10 text-white">
      <Card className="max-w-4xl border-white/10 bg-white/5 backdrop-blur">
        <CardContent className="grid gap-6 p-8 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-300">Breno Finance</p>
            <h1 className="text-3xl font-semibold leading-tight">Financial Analytics Dashboard</h1>
            <p className="text-slate-300">
              Track balances, investments, and expenses with live charts and a real API-backed experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/signup')}>Sign up</Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button variant="ghost" onClick={handleGuest}>
                Continue as guest
              </Button>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-300">Live data</p>
                <p className="text-lg font-semibold">Powered by the Breno Finance API</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-brand" />
            </div>
            <p className="text-sm text-slate-300">
              Use the cover page to jump straight into the experience. Guest access is view-only; authenticated users can add
              accounts and transactions.
            </p>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>• Dashboard, Accounts, Investments, Expenses, Settings</li>
              <li>• JWT auth + persisted sessions</li>
              <li>• Add accounts and transactions to update charts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
