import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/store/filters'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/services/categories'

export function TransactionFiltersBar() {
  const filters = useFilterStore((state) => state.transactionFilters)
  const setCategory = useFilterStore((state) => state.setCategory)
  const setSearch = useFilterStore((state) => state.setSearch)
  const [localSearch, setLocalSearch] = useState(filters.search ?? '')
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  useEffect(() => {
    const id = setTimeout(() => setSearch(localSearch || undefined), 250)
    return () => clearTimeout(id)
  }, [localSearch, setSearch])

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-surface-100 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-surface-800/80">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-slate-400" />
        <Input
          placeholder="Search transactions"
          className="pl-9"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div className="w-full max-w-xs">
        <Select
          value={filters.categoryId ?? ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
        >
          <option value="" className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white">
            All categories
          </option>
          {categories.map((cat) => (
            <option
              key={cat.id}
              value={cat.id}
              className="bg-white text-surface-900 dark:bg-surface-900 dark:text-white"
            >
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      {(filters.categoryId || filters.search) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setCategory(undefined)
            setLocalSearch('')
            setSearch(undefined)
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
