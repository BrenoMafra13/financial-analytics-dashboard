import axios from 'axios'
import { api } from './http'

export interface OllieChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OllieContext {
  pathname?: string
  pageTitle?: string
}

export interface OllieQuota {
  cycle: 'daily' | 'monthly'
  dayKey?: string
  monthKey?: string
  limit: number
  used: number
  remaining: number
}

export interface OllieModePayload {
  mode: 'live' | 'guidance'
  guidanceReason?: string | null
  quota: OllieQuota
  resetAt?: string
  retryAfterMs?: number
}

export interface OllieNavigateAction {
  type: 'navigate'
  path: '/dashboard' | '/investments' | '/expenses' | '/accounts' | '/settings'
}

interface OllieChatResponse {
  reply: string
  mode: 'live' | 'guidance'
  guidanceReason?: string | null
  quota: OllieQuota
  actions?: OllieNavigateAction[]
}

interface OllieApiError {
  message?: string
  code?: string
  resetAt?: string
  retryAfterMs?: number
  quota?: OllieQuota
}

export class OllieError extends Error {
  code?: string
  status?: number
  resetAt?: string
  retryAfterMs?: number
  quota?: OllieQuota

  constructor(message: string, options?: { code?: string; status?: number; resetAt?: string; retryAfterMs?: number; quota?: OllieQuota }) {
    super(message)
    this.name = 'OllieError'
    this.code = options?.code
    this.status = options?.status
    this.resetAt = options?.resetAt
    this.retryAfterMs = options?.retryAfterMs
    this.quota = options?.quota
  }
}

export async function fetchOllieStatus() {
  const { data } = await api.get<OllieModePayload>('/ai/ollie/status')
  return data
}

export async function askOllie(messages: OllieChatMessage[], context?: OllieContext) {
  try {
    const { data } = await api.post<OllieChatResponse>('/ai/ollie/chat', {
      messages,
      context,
    })
    return data
  } catch (error) {
    if (axios.isAxiosError<OllieApiError>(error)) {
      const status = error.response?.status
      const data = error.response?.data
      throw new OllieError(data?.message || 'Ollie could not respond right now.', {
        code: data?.code,
        status,
        resetAt: data?.resetAt,
        retryAfterMs: data?.retryAfterMs,
        quota: data?.quota,
      })
    }
    throw new OllieError('Connection to Ollie failed.')
  }
}