import { ProfileCard } from '../components/ProfileCard'
import { PreferencesCard } from '../components/PreferencesCard'
import { ThemeCard } from '../components/ThemeCard'

export function SettingsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Settings & Profile</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ProfileCard />
          <PreferencesCard />
        </div>
        <ThemeCard />
      </div>
    </section>
  )
}
