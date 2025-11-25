import { useState } from 'react'
import { ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { useNavigate } from 'react-router-dom'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const navigate = useNavigate()

  const avatar = user?.avatarUrl
  const initials = user?.name?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-surface-200 bg-white/80 px-3 py-1.5 text-surface-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white">
          {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{initials}</span>}
        </div>
        <div className="text-left text-sm leading-tight">
          <p className="font-semibold">{user?.name ?? 'User'}</p>
          <p className="text-xs text-surface-500 dark:text-slate-400">{user?.tier ?? 'Member'}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-surface-400 dark:text-slate-400" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-surface-200 bg-white p-2 text-sm shadow-card dark:border-white/10 dark:bg-surface-900">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-100 dark:hover:bg-white/10"
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
          >
            <SettingsIcon className="h-4 w-4" /> Profile & settings
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-900/40"
            onClick={() => {
              setOpen(false)
              logout()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
