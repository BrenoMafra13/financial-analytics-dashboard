import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-surface-50 text-surface-900 transition-colors duration-300 dark:bg-surface-900 dark:text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col bg-gradient-to-b from-white/70 via-white/40 to-transparent backdrop-blur dark:bg-surface-900">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
