import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, SendHorizonal, Sparkles, X } from 'lucide-react'
import { askOllie, fetchOllieStatus, OllieError, type OllieQuota } from '@/services/ollie'
import { useUserStore } from '@/store/user'

type OllieMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'ollie-chat-v1'
const MAX_MESSAGES = 10

function getCurrentDayKey() {
  return new Date().toISOString().slice(0, 10)
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/investments': 'Investments',
  '/expenses': 'Expenses',
  '/accounts': 'Accounts',
  '/settings': 'Settings',
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function parseResetDate(resetAt?: string) {
  if (!resetAt) return 'next month'
  const date = new Date(resetAt)
  if (Number.isNaN(date.getTime())) return 'next month'
  return date.toLocaleDateString('en-CA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function parseRetryWindow(retryAfterMs?: number) {
  if (!retryAfterMs || retryAfterMs <= 0) return 'a few seconds'
  const seconds = Math.ceil(retryAfterMs / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes}m`
}

export function OllieCopilot() {
  const location = useLocation()
  const userId = useUserStore((state) => state.user?.id)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<OllieMessage[]>([])
  const [mode, setMode] = useState<'live' | 'guidance'>('guidance')
  const [quota, setQuota] = useState<OllieQuota | null>(null)
  const [guidanceReason, setGuidanceReason] = useState<string | null>(null)
  const [dayKey, setDayKey] = useState(getCurrentDayKey)

  const pageTitle = useMemo(() => pageTitles[location.pathname] || 'Finance App', [location.pathname])
  const storageKey = useMemo(() => `${STORAGE_KEY}:${userId || 'anonymous'}:${dayKey}`, [userId, dayKey])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nowDay = getCurrentDayKey()
      setDayKey((prev) => (prev === nowDay ? prev : nowDay))
    }, 60 * 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) {
      setMessages([
        {
          id: makeId(),
          role: 'assistant',
          content: 'Hi! I am Ollie. I can show you where to click and how to complete financial tasks in the app.',
        },
      ])
      return
    }

    try {
      const parsed = JSON.parse(raw) as OllieMessage[]
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed.slice(-MAX_MESSAGES))
        return
      }
    } catch {
      // Ignore invalid history and start a fresh chat.
    }

    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content: 'Hi! I am Ollie. I can show you where to click and how to complete financial tasks in the app.',
      },
    ])
  }, [storageKey])

  useEffect(() => {
    if (messages.length) {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_MESSAGES)))
    }
  }, [messages, storageKey])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const status = await fetchOllieStatus()
        if (!mounted) return
        setMode(status.mode)
        setGuidanceReason(status.guidanceReason || null)
        setQuota(status.quota)
      } catch {
        if (!mounted) return
        setMode('guidance')
        setGuidanceReason('status_unavailable')
      }
    })()

    return () => {
      mounted = false
    }
  }, [userId])

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  function appendAssistantMessage(content: string) {
    setMessages((prev) => {
      const assistantMessage: OllieMessage = {
        id: makeId(),
        role: 'assistant',
        content,
      }
      return [...prev, assistantMessage].slice(-MAX_MESSAGES)
    })
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || loading) return

    const userMessage: OllieMessage = { id: makeId(), role: 'user', content }
    const nextMessages = [...messages, userMessage].slice(-MAX_MESSAGES)
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await askOllie(
        nextMessages.map((message) => ({ role: message.role, content: message.content })),
        { pathname: location.pathname, pageTitle },
      )

      setMode(response.mode)
      setGuidanceReason(response.guidanceReason || null)
      setQuota(response.quota)

      appendAssistantMessage(response.reply)
    } catch (error) {
      if (error instanceof OllieError && error.quota) {
        setQuota(error.quota)
      }
      if (error instanceof OllieError) {
        setGuidanceReason('request_error')
      }
      if (error instanceof OllieError && error.code === 'OLLIE_FREE_TIER_LOCKED') {
        appendAssistantMessage(`Ollie monthly free-tier usage was reached. Chat unlocks automatically on ${parseResetDate(error.resetAt)}.`)
      } else if (error instanceof OllieError && String(error.code || '').startsWith('OLLIE_') && error.status === 429) {
        appendAssistantMessage(`${error.message} Please wait ${parseRetryWindow(error.retryAfterMs)} and try again.`)
      } else if (error instanceof OllieError) {
        appendAssistantMessage(error.message)
      } else {
        appendAssistantMessage('I could not respond right now. Please try again in a few seconds.')
      }
    } finally {
      setLoading(false)
    }
  }

  const quotaLabel = useMemo(() => {
    if (!quota) return 'Loading request quota...'
    const cycleLabel = quota.cycle === 'daily' ? 'today' : 'this month'
    return `${quota.remaining}/${quota.limit} AI Live requests left ${cycleLabel}`
  }, [quota])

  const guidanceLabel = useMemo(() => {
    if (mode !== 'guidance') return null
    if (guidanceReason === 'provider_rate_limited' || guidanceReason === 'provider_cooldown') {
      return 'Provider is rate-limited. Ollie is using Guidance Mode temporarily.'
    }
    if (guidanceReason === 'OLLIE_RATE_LIMIT_USER' || guidanceReason === 'OLLIE_RATE_LIMIT_IP') {
      return 'Message rate limit reached. Ollie is using Guidance Mode briefly.'
    }
    if (guidanceReason === 'OLLIE_CHAR_LIMIT_USER' || guidanceReason === 'OLLIE_CHAR_LIMIT_IP') {
      return 'Message length limit reached. Ollie is using Guidance Mode briefly.'
    }
    if (guidanceReason === 'daily_live_budget_reached') {
      return 'Your AI Live daily budget was reached. Guidance Mode is active.'
    }
    if (guidanceReason === 'monthly_live_budget_reached') {
      return 'Your AI Live monthly budget was reached. Guidance Mode is active.'
    }
    if (guidanceReason === 'missing_api_key') {
      return 'AI provider key is missing. Guidance Mode is active.'
    }
    return 'Guidance Mode is active.'
  }, [mode, guidanceReason])

  return (
    <>
      {open && (
        <section className="fixed bottom-24 left-4 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white/95 shadow-card backdrop-blur dark:border-white/10 dark:bg-surface-900/95">
          <header className="flex items-center justify-between border-b border-surface-200 bg-gradient-brand/20 px-4 py-3 dark:border-white/10 dark:bg-brand-500/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500 text-surface-950 shadow-glow">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">Ollie</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-surface-500 dark:text-slate-300">Your financial copilot</p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${
                      mode === 'live'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    }`}
                  >
                    {mode === 'live' ? 'AI Live' : 'Guidance Mode'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-surface-600 dark:text-slate-300">
                  {quotaLabel}
                </p>
                {guidanceLabel ? <p className="mt-1 max-w-[15.5rem] text-[10px] text-amber-700 dark:text-amber-300">{guidanceLabel}</p> : null}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close Ollie chat"
              className="rounded-xl p-2 text-surface-500 transition hover:bg-surface-100 hover:text-surface-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'bg-surface-100 text-surface-800 dark:bg-white/10 dark:text-slate-100'
                    : 'ml-auto bg-brand-500/90 text-surface-950'
                }`}
              >
                {message.content}
              </article>
            ))}
            {loading && (
              <article className="w-fit rounded-2xl bg-surface-100 px-3 py-2 text-sm text-surface-600 dark:bg-white/10 dark:text-slate-300">
                Ollie is thinking...
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="border-t border-surface-200 p-3 dark:border-white/10"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSend()
            }}
          >
            <div className="flex items-center gap-2 rounded-2xl border border-surface-200 bg-white px-2 py-2 dark:border-white/10 dark:bg-surface-900">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={300}
                placeholder={`Ask about ${pageTitle.toLowerCase()}...`}
                className="flex-1 bg-transparent px-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-surface-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message to Ollie"
              >
                <SendHorizonal size={15} />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="fixed bottom-5 left-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-semibold text-surface-950 shadow-glow transition hover:scale-[1.02] hover:bg-brand-400"
        aria-label={open ? 'Close Ollie' : 'Open Ollie'}
      >
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-950/10">
          <Bot size={16} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse-slow rounded-full bg-emerald-600" />
        </span>
        <span>Talk to Ollie</span>
      </button>
    </>
  )
}