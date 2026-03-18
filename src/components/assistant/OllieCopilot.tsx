import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, SendHorizonal, Sparkles, X } from 'lucide-react'
import { askOllie, OllieError } from '@/services/ollie'
import { useUserStore } from '@/store/user'

type OllieMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'ollie-chat-v1'
const MAX_MESSAGES = 10

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

  const pageTitle = useMemo(() => pageTitles[location.pathname] || 'Finance App', [location.pathname])
  const storageKey = useMemo(() => `${STORAGE_KEY}:${userId || 'anonymous'}`, [userId])

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

      appendAssistantMessage(response.reply)
    } catch (error) {
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
                <p className="text-xs text-surface-500 dark:text-slate-300">Your financial copilot</p>
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