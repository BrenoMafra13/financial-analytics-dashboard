const { z } = require('zod')

const MAX_MESSAGES = 10

function getIntEnv(name, fallback) {
  const raw = process.env[name]
  const parsed = Number.parseInt(String(raw || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const RATE_WINDOW_MS = 60 * 1000
const USER_REQUESTS_PER_MINUTE = getIntEnv('OLLIE_USER_REQUESTS_PER_MINUTE', 4)
const IP_REQUESTS_PER_MINUTE = getIntEnv('OLLIE_IP_REQUESTS_PER_MINUTE', 5)
const USER_CHARS_PER_MINUTE = getIntEnv('OLLIE_USER_CHARS_PER_MINUTE', 1800)
const IP_CHARS_PER_MINUTE = getIntEnv('OLLIE_IP_CHARS_PER_MINUTE', 5000)
const LIVE_REQUESTS_PER_DAY = getIntEnv('OLLIE_LIVE_REQUESTS_PER_DAY', 20)
const MONTHLY_LOCK_ENABLED = String(process.env.OLLIE_MONTHLY_LOCK_ENABLED || 'false').toLowerCase() === 'true'
const FALLBACK_ENABLED = String(process.env.OLLIE_FALLBACK_ENABLED || 'true').toLowerCase() !== 'false'

const ollieRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(2000) })).min(1).max(MAX_MESSAGES),
  context: z
    .object({
      pathname: z.string().min(1).max(120).optional(),
      pageTitle: z.string().min(1).max(80).optional(),
    })
    .optional(),
})

const freeTierLock = {
  monthKey: null,
  reason: null,
  lockedAt: null,
}

const userBuckets = new Map()
const ipBuckets = new Map()
const userDailyLiveUsage = new Map()
const providerHealth = {
  rateLimitedUntil: 0,
  reason: null,
}

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function getCurrentDayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getUserLiveUsageBucket(userId) {
  const dayKey = getCurrentDayKey()
  const existing = userDailyLiveUsage.get(userId)
  if (!existing || existing.dayKey !== dayKey) {
    const fresh = { dayKey, used: 0 }
    userDailyLiveUsage.set(userId, fresh)
    return fresh
  }
  return existing
}

function getLiveQuota(userId) {
  const bucket = getUserLiveUsageBucket(userId)
  return {
    cycle: 'daily',
    dayKey: bucket.dayKey,
    limit: LIVE_REQUESTS_PER_DAY,
    used: bucket.used,
    remaining: Math.max(0, LIVE_REQUESTS_PER_DAY - bucket.used),
  }
}

function consumeLiveQuota(userId) {
  const bucket = getUserLiveUsageBucket(userId)
  bucket.used += 1
  userDailyLiveUsage.set(userId, bucket)
  return getLiveQuota(userId)
}

function buildModePayload({ mode, guidanceReason, userId }) {
  return {
    mode,
    guidanceReason,
    quota: getLiveQuota(userId),
  }
}

function getNextMonthIso() {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0))
  return next.toISOString()
}

function getFreeTierLockStatus() {
  const currentMonth = getCurrentMonthKey()
  if (!freeTierLock.monthKey) return { locked: false }
  if (freeTierLock.monthKey !== currentMonth) {
    freeTierLock.monthKey = null
    freeTierLock.reason = null
    freeTierLock.lockedAt = null
    return { locked: false }
  }
  return {
    locked: true,
    resetAt: getNextMonthIso(),
    reason: freeTierLock.reason,
    lockedAt: freeTierLock.lockedAt,
  }
}

function lockFreeTierForCurrentMonth(reason) {
  freeTierLock.monthKey = getCurrentMonthKey()
  freeTierLock.reason = reason
  freeTierLock.lockedAt = new Date().toISOString()
}

function mapPathToHint(pathname = '/dashboard') {
  const map = {
    '/dashboard': 'Main dashboard with KPIs, cashflow, and net worth trends.',
    '/investments': 'Investments page with holdings, market assets, and trade form.',
    '/expenses': 'Expenses page with filters and transaction list.',
    '/accounts': 'Accounts page for balances and account management.',
    '/settings': 'Settings page for profile, currency, and preferences.',
  }
  return map[pathname] || 'Finance app navigation page.'
}

function mapPathToAction(pathname = '/dashboard') {
  const map = {
    '/dashboard': 'Use the left sidebar to jump to Accounts, Expenses, Investments, or Settings.',
    '/investments': 'Use the trade form on this page to buy/sell and review holdings.',
    '/expenses': 'Use New Transaction and filters on this page to track spending and income.',
    '/accounts': 'Review balances and manage your linked accounts here.',
    '/settings': 'Update profile, currency, and personal preferences here.',
  }
  return map[pathname] || 'Use the left sidebar to navigate to the target page.'
}

function detectLanguage(text) {
  const normalized = String(text || '').toLowerCase()
  if (/\b(oi|ola|olá|quanto|gastei|conta|despesa|receita|investimento|como|onde)\b/.test(normalized)) {
    return 'pt'
  }
  return 'en'
}

function parseSimpleMath(question) {
  const normalized = String(question || '').replace(/,/g, '.').trim()
  const match = normalized.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/)
  if (!match) return null
  const a = Number(match[1])
  const b = Number(match[3])
  const op = match[2]
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (op === '/' && b === 0) return 'Division by zero is not allowed.'
  const result = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b
  return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(6)))
}

function buildDeterministicReply({ context, latestUserMessage }) {
  const path = context?.pathname || '/dashboard'
  const hint = mapPathToHint(path)
  const action = mapPathToAction(path)
  const questionRaw = String(latestUserMessage || '').trim()
  const question = questionRaw.toLowerCase()
  const language = detectLanguage(questionRaw)

  const math = parseSimpleMath(questionRaw)
  if (math) {
    return language === 'pt' ? `Resultado: ${math}.` : `Result: ${math}.`
  }

  if (/^(hi|hello|hey|oi|ola|olá)$/i.test(questionRaw)) {
    return language === 'pt'
      ? 'Oi! Eu sou a Ollie. Posso te guiar no app financeiro. Diga o que você quer fazer.'
      : 'Hi! I am Ollie. I can guide you in the finance app. Tell me what you want to do.'
  }

  if (question.includes('account') || question.includes('accounts') || question.includes('conta') || question.includes('contas')) {
    return language === 'pt'
      ? 'Para ver suas contas: clique em Accounts no menu lateral esquerdo. Lá você vê saldos, tipo de conta e instituição.'
      : 'To see your accounts: click Accounts in the left sidebar. You will see balances, account types, and institutions there.'
  }

  if (question.includes('expense') || question.includes('despesa') || question.includes('spent') || question.includes('gastei')) {
    return language === 'pt'
      ? 'Para adicionar despesa: vá em Expenses > New Transaction, escolha type Expense, informe valor/data/descrição, selecione conta e categoria e salve.'
      : 'To add an expense: go to Expenses > New Transaction, choose type Expense, enter amount/date/description, select account and category, then save.'
  }

  if (question.includes('income') || question.includes('receita') || question.includes('salary') || question.includes('earned')) {
    return language === 'pt'
      ? 'Para adicionar receita: vá em Expenses > New Transaction, escolha type Income, preencha os dados e salve.'
      : 'To add income: go to Expenses > New Transaction, choose type Income, fill in the details, and save.'
  }

  if (question.includes('invest') || question.includes('trade') || question.includes('investimento') || question.includes('buy') || question.includes('sell')) {
    return language === 'pt'
      ? 'Para investir: abra Investments, use o formulário de trade, escolha ativo, buy/sell, quantidade e conta de origem, e confirme.'
      : 'To invest: open Investments, use the trade form, choose asset, buy/sell side, quantity, and source account, then confirm.'
  }

  if (question.includes('settings') || question.includes('config') || question.includes('perfil') || question.includes('profile')) {
    return language === 'pt'
      ? 'Para editar preferências: abra Settings no menu lateral. Lá você ajusta perfil, moeda e outras opções.'
      : 'To edit preferences: open Settings in the left sidebar. You can update profile, currency, and other options there.'
  }

  return language === 'pt'
    ? `Estou na rota ${path}. ${hint} ${action}`
    : `You are currently on ${path}. ${hint} ${action}`
}

function buildSystemPrompt({ userName, context }) {
  const path = context?.pathname || '/dashboard'
  const pageTitle = context?.pageTitle || 'Finance Dashboard'
  const pageHint = mapPathToHint(path)

  return [
    'You are Ollie, the in-app finance navigation copilot.',
    'Always answer in clear, concise language matching the user (English or Portuguese).',
    'Guide users on where to click and what to do on each page.',
    'Response style rules:',
    '- Start with a direct answer in 1 sentence.',
    '- If the user asks for location/action, give short steps (2-4 bullets).',
    '- If the user asks for detail/explanation, provide a slightly longer explanation with clear steps.',
    '- For greetings or very short messages, keep the reply short and friendly.',
    '- For simple math questions, provide only the result plus one short line.',
    'Never say you are Gemini, Google, OpenAI, or any external provider. You are always Ollie.',
    'For risky or sensitive financial actions, recommend manual confirmation before saving.',
    'Do not invent non-existent features. Be explicit about limitations.',
    `Current user: ${userName || 'User'}.`,
    `Current route: ${path}.`,
    `Page title: ${pageTitle}.`,
    `Page context: ${pageHint}`,
  ].join('\n')
}

function extractRetryAfterMs(errorBody) {
  const details = Array.isArray(errorBody?.error?.details) ? errorBody.error.details : []
  const retryInfo = details.find((item) => typeof item?.retryDelay === 'string')
  const retryDelay = retryInfo?.retryDelay
  if (typeof retryDelay === 'string') {
    const match = retryDelay.match(/^(\d+)(?:\.(\d+))?s$/)
    if (match) {
      const whole = Number(match[1] || 0)
      const fraction = Number(`0.${match[2] || '0'}`)
      const ms = Math.round((whole + fraction) * 1000)
      if (Number.isFinite(ms) && ms > 0) return ms
    }
  }
  return RATE_WINDOW_MS
}

function sanitizeReply(text) {
  return text
    .replace(/\bGemini\b/gi, 'Ollie')
    .replace(/\bGoogle AI\b/gi, 'Ollie')
    .replace(/\bGoogle\b/gi, 'Ollie')
    .trim()
}

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))
}

function extractGeminiText(data) {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : []
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts
    if (!Array.isArray(parts)) continue
    const textPart = parts.find((part) => typeof part?.text === 'string' && part.text.trim().length > 0)
    if (textPart) return textPart.text
  }
  return null
}

function isFreeTierExceeded(status, bodyText) {
  const msg = String(bodyText || '').toLowerCase()
  if (status === 429) return true
  if (status === 403 && (msg.includes('quota') || msg.includes('resource_exhausted'))) return true
  return false
}

function parseErrorMessage(errorBody, status) {
  const fromBody = errorBody?.error?.message
  if (typeof fromBody === 'string' && fromBody.trim()) return fromBody
  return `Ollie is unavailable right now (status ${status}).`
}

function getLatestUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (msg?.role === 'user' && typeof msg?.content === 'string' && msg.content.trim()) {
      return msg.content.trim()
    }
  }
  return ''
}

function buildFallbackReply({ context, latestUserMessage }) {
  return buildDeterministicReply({ context, latestUserMessage })
}

function shouldActivateMonthlyLock(status, bodyText) {
  if (!MONTHLY_LOCK_ENABLED) return false
  const msg = String(bodyText || '').toLowerCase()
  const hardSignals = ['monthly', 'billing', 'billable', 'insufficient_quota']
  return (status === 429 || status === 403) && hardSignals.some((signal) => msg.includes(signal))
}

function getLatestUserCharCount(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (msg?.role === 'user') {
      return String(msg.content || '').trim().length
    }
  }
  return 0
}

function touchBucket(map, key, now) {
  const previous = map.get(key)
  if (!previous || now - previous.windowStart >= RATE_WINDOW_MS) {
    const next = { windowStart: now, requests: 0, chars: 0 }
    map.set(key, next)
    return next
  }
  return previous
}

function runRateGuard({ userId, clientIp, userChars }) {
  const now = Date.now()
  const uBucket = touchBucket(userBuckets, userId, now)
  const ipBucket = touchBucket(ipBuckets, clientIp, now)

  if (uBucket.requests >= USER_REQUESTS_PER_MINUTE) {
    return {
      ok: false,
      status: 429,
      code: 'OLLIE_RATE_LIMIT_USER',
      message: 'You reached the Ollie message limit per minute. Please try again shortly.',
      retryAfterMs: RATE_WINDOW_MS - (now - uBucket.windowStart),
    }
  }

  if (ipBucket.requests >= IP_REQUESTS_PER_MINUTE) {
    return {
      ok: false,
      status: 429,
      code: 'OLLIE_RATE_LIMIT_IP',
      message: 'Too many Ollie messages were sent from this IP. Please wait and try again.',
      retryAfterMs: RATE_WINDOW_MS - (now - ipBucket.windowStart),
    }
  }

  if (uBucket.chars + userChars > USER_CHARS_PER_MINUTE) {
    return {
      ok: false,
      status: 429,
      code: 'OLLIE_CHAR_LIMIT_USER',
      message: 'You reached the Ollie characters-per-minute limit. Try a shorter message.',
      retryAfterMs: RATE_WINDOW_MS - (now - uBucket.windowStart),
    }
  }

  if (ipBucket.chars + userChars > IP_CHARS_PER_MINUTE) {
    return {
      ok: false,
      status: 429,
      code: 'OLLIE_CHAR_LIMIT_IP',
      message: 'This IP reached the Ollie characters-per-minute limit. Please wait and try again.',
      retryAfterMs: RATE_WINDOW_MS - (now - ipBucket.windowStart),
    }
  }

  uBucket.requests += 1
  ipBucket.requests += 1
  uBucket.chars += userChars
  ipBucket.chars += userChars
  return { ok: true }
}

async function askOllie({ apiKey, model, messages, context, userName, userId, clientIp }) {
  const parsed = ollieRequestSchema.safeParse({ messages, context })
  if (!parsed.success) {
    return { ok: false, status: 400, code: 'OLLIE_INVALID_PAYLOAD', message: 'Invalid payload format for Ollie chat.' }
  }

  const safeUserId = String(userId || 'anonymous')
  const safeClientIp = String(clientIp || 'unknown-ip')
  const userChars = getLatestUserCharCount(parsed.data.messages)
  const guard = runRateGuard({ userId: safeUserId, clientIp: safeClientIp, userChars })
  if (!guard.ok) {
    if (FALLBACK_ENABLED) {
      return {
        ok: true,
        reply: buildFallbackReply({ context: parsed.data.context, latestUserMessage: getLatestUserMessage(parsed.data.messages) }),
        ...buildModePayload({ mode: 'guidance', guidanceReason: guard.code || 'local_rate_limit', userId: safeUserId }),
      }
    }

    return {
      ok: false,
      status: guard.status,
      code: guard.code,
      message: guard.message,
      retryAfterMs: guard.retryAfterMs,
    }
  }

  const lockStatus = getFreeTierLockStatus()
  if (MONTHLY_LOCK_ENABLED && lockStatus.locked) {
    return {
      ok: false,
      status: 429,
      code: 'OLLIE_FREE_TIER_LOCKED',
      message: 'Ollie free-tier usage for this month was reached. Chat will unlock automatically next month.',
      resetAt: lockStatus.resetAt,
      retryAfterMs: null,
      quota: getLiveQuota(safeUserId),
    }
  }

  const quotaBeforeRequest = getLiveQuota(safeUserId)
  if (quotaBeforeRequest.remaining <= 0) {
    if (FALLBACK_ENABLED) {
      return {
        ok: true,
        reply: buildFallbackReply({ context: parsed.data.context, latestUserMessage: getLatestUserMessage(parsed.data.messages) }),
        ...buildModePayload({ mode: 'guidance', guidanceReason: 'monthly_live_budget_reached', userId: safeUserId }),
      }
    }

    return {
      ok: false,
      status: 429,
      code: 'OLLIE_USER_LIVE_BUDGET_REACHED',
      message: 'You reached your monthly AI Live request budget for Ollie.',
      retryAfterMs: null,
      quota: quotaBeforeRequest,
    }
  }

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: 'OLLIE_NOT_CONFIGURED',
      message: 'Ollie is not configured. Set GEMINI_API_KEY on the backend.',
      quota: getLiveQuota(safeUserId),
    }
  }

  if (Date.now() < providerHealth.rateLimitedUntil) {
    if (FALLBACK_ENABLED) {
      return {
        ok: true,
        reply: buildFallbackReply({ context: parsed.data.context, latestUserMessage: getLatestUserMessage(parsed.data.messages) }),
        ...buildModePayload({ mode: 'guidance', guidanceReason: 'provider_cooldown', userId: safeUserId }),
      }
    }

    return {
      ok: false,
      status: 429,
      code: 'OLLIE_PROVIDER_COOLDOWN',
      message: 'Ollie is waiting for provider cooldown. Please try again shortly.',
      retryAfterMs: Math.max(1000, providerHealth.rateLimitedUntil - Date.now()),
      quota: getLiveQuota(safeUserId),
    }
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        role: 'system',
        parts: [{ text: buildSystemPrompt({ userName, context: parsed.data.context }) }],
      },
      contents: toGeminiContents(parsed.data.messages),
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 450,
      },
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const errorText = JSON.stringify(data || {})
    if (isFreeTierExceeded(response.status, errorText)) {
      const retryAfterMs = extractRetryAfterMs(data)
      providerHealth.rateLimitedUntil = Date.now() + retryAfterMs
      providerHealth.reason = 'provider_rate_limited'

      if (shouldActivateMonthlyLock(response.status, errorText)) {
        lockFreeTierForCurrentMonth('Hard quota exceeded')
        return {
          ok: false,
          status: 429,
          code: 'OLLIE_FREE_TIER_LOCKED',
          message: 'Ollie free-tier usage for this month was reached. Chat will unlock automatically next month.',
          resetAt: getNextMonthIso(),
          retryAfterMs: null,
          quota: getLiveQuota(safeUserId),
        }
      }

      if (FALLBACK_ENABLED) {
        return {
          ok: true,
          reply: buildFallbackReply({ context: parsed.data.context, latestUserMessage: getLatestUserMessage(parsed.data.messages) }),
          ...buildModePayload({ mode: 'guidance', guidanceReason: 'provider_rate_limited', userId: safeUserId }),
        }
      }

      return {
        ok: false,
        status: 429,
        code: 'OLLIE_PROVIDER_QUOTA',
        message: 'Ollie is temporarily rate-limited by the AI provider. Please try again shortly.',
        retryAfterMs,
        quota: getLiveQuota(safeUserId),
      }
    }

    providerHealth.rateLimitedUntil = 0
    providerHealth.reason = 'provider_unavailable'

    if (FALLBACK_ENABLED) {
      return {
        ok: true,
        reply: buildFallbackReply({ context: parsed.data.context, latestUserMessage: getLatestUserMessage(parsed.data.messages) }),
        ...buildModePayload({ mode: 'guidance', guidanceReason: 'provider_unavailable', userId: safeUserId }),
      }
    }

    return {
      ok: false,
      status: response.status,
      code: 'OLLIE_PROVIDER_ERROR',
      message: parseErrorMessage(data, response.status),
      quota: getLiveQuota(safeUserId),
    }
  }

  const reply = extractGeminiText(data)
  if (!reply) {
    if (FALLBACK_ENABLED) {
      return {
        ok: true,
        reply: buildFallbackReply({ context: parsed.data.context, latestUserMessage: getLatestUserMessage(parsed.data.messages) }),
        ...buildModePayload({ mode: 'guidance', guidanceReason: 'empty_provider_response', userId: safeUserId }),
      }
    }

    return {
      ok: false,
      status: 502,
      code: 'OLLIE_EMPTY_RESPONSE',
      message: 'Ollie could not generate a response right now. Please try again.',
      quota: getLiveQuota(safeUserId),
    }
  }

  providerHealth.rateLimitedUntil = 0
  providerHealth.reason = null

  const quotaAfterLiveResponse = consumeLiveQuota(safeUserId)
  return {
    ok: true,
    reply: sanitizeReply(reply),
    mode: 'live',
    guidanceReason: null,
    quota: quotaAfterLiveResponse,
  }
}

function getOllieStatus({ apiKey, userId }) {
  const safeUserId = String(userId || 'anonymous')
  const quota = getLiveQuota(safeUserId)
  const lockStatus = getFreeTierLockStatus()

  if (!apiKey) {
    return {
      mode: 'guidance',
      guidanceReason: 'missing_api_key',
      quota,
    }
  }

  if (Date.now() < providerHealth.rateLimitedUntil) {
    return {
      mode: 'guidance',
      guidanceReason: providerHealth.reason || 'provider_cooldown',
      quota,
      retryAfterMs: Math.max(1000, providerHealth.rateLimitedUntil - Date.now()),
    }
  }

  if (MONTHLY_LOCK_ENABLED && lockStatus.locked) {
    return {
      mode: 'guidance',
      guidanceReason: 'provider_monthly_lock',
      quota,
      resetAt: lockStatus.resetAt,
    }
  }

  if (quota.remaining <= 0) {
    return {
      mode: 'guidance',
      guidanceReason: 'daily_live_budget_reached',
      quota,
    }
  }

  return {
    mode: 'live',
    guidanceReason: null,
    quota,
  }
}

module.exports = {
  askOllie,
  getOllieStatus,
}