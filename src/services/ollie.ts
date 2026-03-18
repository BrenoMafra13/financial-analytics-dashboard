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

interface OllieChatResponse {
  reply: string
}

interface OllieApiError {
  message?: string
  code?: string
  resetAt?: string
  retryAfterMs?: number
}

export class OllieError extends Error {
  code?: string
  status?: number
  resetAt?: string
  retryAfterMs?: number

  constructor(message: string, options?: { code?: string; status?: number; resetAt?: string; retryAfterMs?: number }) {
    super(message)
    this.name = 'OllieError'
    this.code = options?.code
    this.status = options?.status
    this.resetAt = options?.resetAt
    this.retryAfterMs = options?.retryAfterMs
  }
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
      })
    }
    throw new OllieError('Connection to Ollie failed.')
  }
}