import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

const OLLIE_STORAGE_PREFIX = 'ollie-chat-v1'

function clearOllieSessionForUser(userId?: string) {
  if (typeof window === 'undefined') return
  const prefix = `${OLLIE_STORAGE_PREFIX}:${userId || 'anonymous'}:`
  const keys: string[] = []
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i)
    if (key && key.startsWith(prefix)) {
      keys.push(key)
    }
  }
  keys.forEach((key) => window.sessionStorage.removeItem(key))
  window.sessionStorage.removeItem(OLLIE_STORAGE_PREFIX)
}

interface UserState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setAuth: (user: User, token: string) => void
  isAuthenticated: boolean
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setAuth: (user, token) => {
        clearOllieSessionForUser(user.id)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        clearOllieSessionForUser(get().user?.id)
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'financial-analytics-user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
