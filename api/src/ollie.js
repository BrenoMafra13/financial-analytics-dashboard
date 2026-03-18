const { z } = require('zod')

const MAX_MESSAGES = 10

function getIntEnv(name, fallback) {
  const raw = process.env[name]
  const parsed = Number.parseInt(String(raw || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const RATE_WINDOW_MS = 60 * 1000
const USER_REQUESTS_PER_MINUTE = getIntEnv('OLLIE_USER_REQUESTS_PER_MINUTE', 12)
const IP_REQUESTS_PER_MINUTE = getIntEnv('OLLIE_IP_REQUESTS_PER_MINUTE', 30)
const USER_CHARS_PER_MINUTE = getIntEnv('OLLIE_USER_CHARS_PER_MINUTE', 1800)
const IP_CHARS_PER_MINUTE = getIntEnv('OLLIE_IP_CHARS_PER_MINUTE', 5000)
const LIVE_REQUESTS_PER_MONTH = getIntEnv('OLLIE_LIVE_REQUESTS_PER_MONTH', 80)
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
const userMonthlyLiveUsage = new Map()

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function getUserLiveUsageBucket(userId) {
  const monthKey = getCurrentMonthKey()
  const existing = userMonthlyLiveUsage.get(userId)
  if (!existing || existing.monthKey !== monthKey) {
    const fresh = { monthKey, used: 0 }
    userMonthlyLiveUsage.set(userId, fresh)
    return fresh
  }
  return existing
}

function getLiveQuota(userId) {
  const bucket = getUserLiveUsageBucket(userId)
  return {
    cycle: 'monthly',
    monthKey: bucket.monthKey,
    limit: LIVE_REQUESTS_PER_MONTH,
    used: bucket.used,
    remaining: Math.max(0, LIVE_REQUESTS_PER_MONTH - bucket.used),
  }
}

function consumeLiveQuota(userId) {
  const bucket = getUserLiveUsageBucket(userId)
  bucket.used += 1
  userMonthlyLiveUsage.set(userId, bucket)
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

function buildSystemPrompt({ userName, context }) {
  const path = context?.pathname || '/dashboard'
  const pageTitle = context?.pageTitle || 'Finance Dashboard'
  const pageHint = mapPathToHint(path)

  return [
    'You are Ollie, the in-app finance navigation copilot.',
    'Always answer in clear, concise English.',
    'Guide users on where to click and what to do on each page.',
    'Never say you are Gemini, Google, OpenAI, or any external provider. You are always Ollie.',
    'For risky or sensitive financial actions, recommend manual confirmation before saving.',
    'Do not invent non-existent features. Be explicit about limitations.',
    `Current user: ${userName || 'User'}.`,
    `Current route: ${path}.`,
    `Page title: ${pageTitle}.`,
    `Page context: ${pageHint}`,
  ].join('\n')
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
  const path = context?.pathname || '/dashboard'
  const pageHint = mapPathToHint(path)
  const question = latestUserMessage.toLowerCase()

  if (question.includes('spent') || question.includes('expense') || question.includes('grocery') || question.includes('groceries')) {
    return [
      'I can help you record that expense quickly.',
      '1. Open Expenses and click New Transaction.',
      '2. Select type Expense.',
      '3. Enter amount, date, and a short description (for example: groceries).',
      '4. Choose the account and category, then save.',
    ].join('\n')
  }

  if (question.includes('income') || question.includes('salary') || question.includes('earned') || question.includes('received')) {
    return [
      'Here is the fastest way to record income:',
      '1. Go to Expenses and click New Transaction.',
      '2. Set type to Income.',
      '3. Enter amount, date, source, and account.',
      '4. Save to update your dashboard KPIs.',
    ].join('\n')
  }

  if (question.includes('invest') || question.includes('investment') || question.includes('trade') || question.includes('buy') || question.includes('sell')) {
    return [
      'To place an investment trade:',
      '1. Open Investments.',
      '2. Use the trade form to choose asset, side (buy/sell), and quantity.',
      '3. Select the funding account and confirm.',
      '4. Review your holdings and account balance updates.',
    ].join('\n')
  }

  return [
    `I can guide you from your current page (${path}).`,
    `Page context: ${pageHint}`,
    'Try asking things like: "Where do I add an expense?", "How do I register income?", or "How do I place a trade?"',
  ].join('\n')
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
        retryAfterMs: RATE_WINDOW_MS,
        quota: getLiveQuota(safeUserId),
      }
    }

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
      guidanceReason: 'monthly_live_budget_reached',
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