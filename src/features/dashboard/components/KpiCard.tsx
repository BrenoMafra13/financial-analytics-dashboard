import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface KpiCardProps {
  title: string
  value: string
  helper?: string
  trendLabel?: string
  trendVariant?: 'success' | 'danger' | 'neutral'
  icon?: ReactNode
}

export function KpiCard({ title, value, helper, trendLabel, trendVariant = 'neutral', icon }: KpiCardProps) {
  return (
    <Card className="p-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-surface-600 dark:text-slate-200">
          {title}
        </CardDescription>
        {icon ? <div className="text-surface-400 dark:text-slate-200">{icon}</div> : null}
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
        {helper ? <p className="text-sm text-surface-500 dark:text-slate-200">{helper}</p> : null}
        {trendLabel ? (
          <Badge variant={trendVariant === 'success' ? 'success' : trendVariant === 'danger' ? 'danger' : 'neutral'}>
            {trendLabel}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}
