import { useThemeStore } from '@/store/theme'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const themes = [
  { value: 'light', label: 'Light', description: 'Use a bright, white background.' },
  { value: 'dark', label: 'Dark', description: 'Use the dark, high-contrast background.' },
]

export function ThemeCard() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <Card className="p-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose your preferred appearance.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
        {themes.map((item) => (
          <div
            key={item.value}
            className="flex flex-col rounded-2xl border border-surface-100 p-4 dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">{item.label}</p>
                <p className="text-sm text-surface-500 dark:text-slate-400">{item.description}</p>
              </div>
              <Button
                type="button"
                variant={theme === item.value ? 'primary' : 'ghost'}
                onClick={() => setTheme(item.value as typeof theme)}
                className="text-sm"
              >
                {theme === item.value ? 'Selected' : 'Use'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
