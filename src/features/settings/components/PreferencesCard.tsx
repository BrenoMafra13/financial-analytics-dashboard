import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function PreferencesCard() {
  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Currency, language, and notification options (mocked).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-900 dark:text-white">Currency</p>
            <Select defaultValue="USD">
              <option className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white" value="USD">
                USD
              </option>
              <option className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white" value="CAD">
                CAD
              </option>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-900 dark:text-white">Language</p>
            <Select defaultValue="en">
              <option className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white" value="en">
                English
              </option>
              <option className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white" value="pt">
                Portuguese
              </option>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-surface-100 px-4 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-surface-900 dark:text-white">Email alerts</p>
            <p className="text-sm text-surface-500 dark:text-slate-400">Receive monthly reports and alerts.</p>
          </div>
          <Switch checked onCheckedChange={() => { return }} />
        </div>
      </CardContent>
    </Card>
  )
}
