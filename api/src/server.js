require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { nanoid } = require('nanoid')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { db, bootstrap, categories } = require('./db')
const { z } = require('zod')

bootstrap()

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const PORT = process.env.PORT || 4000

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/categories', (_req, res) => {
  res.json(categories)
})

app.post('/auth/login', (req, res) => {
  const schema = z.object({ email: z.string().min(3), password: z.string().min(4) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid credentials' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email)
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const valid = bcrypt.compareSync(parsed.data.password, user.passwordHash)
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

  const token = signToken(user.id)
  res.json({ token, user: sanitizeUser(user) })
})

app.post('/auth/guest', (_req, res) => {
  const user = db.prepare('SELECT * FROM users LIMIT 1').get()
  const token = signToken(user.id)
  res.json({ token, user: sanitizeUser(user) })
})

app.post('/auth/register', (req, res) => {
  const schema = z.object({
    email: z.string().min(3),
    password: z.string().min(6),
    name: z.string().min(2),
    currency: z.enum(['USD', 'CAD']),
    locale: z.string().min(2),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' })

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email)
  if (existing) return res.status(409).json({ message: 'Email already registered' })

  const user = {
    id: nanoid(),
    email: parsed.data.email,
    passwordHash: bcrypt.hashSync(parsed.data.password, 10),
    name: parsed.data.name,
    currency: parsed.data.currency,
    locale: parsed.data.locale,
    tier: 'standard',
  }
  db.prepare(
    'INSERT INTO users (id, email, passwordHash, name, currency, locale, tier) VALUES (@id, @email, @passwordHash, @name, @currency, @locale, @tier)'
  ).run(user)

  const account = {
    id: nanoid(),
    userId: user.id,
    name: 'Checking',
    institution: 'Breno Bank',
    type: 'CHECKING',
    currency: user.currency,
    balance: 0,
    lastUpdated: new Date().toISOString().slice(0, 10),
  }
  db.prepare(
    'INSERT INTO accounts (id, userId, name, institution, type, currency, balance, lastUpdated) VALUES (@id, @userId, @name, @institution, @type, @currency, @balance, @lastUpdated)'
  ).run(account)

  const token = signToken(user.id)
  res.status(201).json({ token, user: sanitizeUser(user) })
})

app.use(authMiddleware)

app.get('/me', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(sanitizeUser(user))
})

app.put('/me', (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().min(3),
    currency: z.enum(['USD', 'CAD']),
    locale: z.string().min(2),
    avatarUrl: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' })

  db.prepare('UPDATE users SET name = ?, email = ?, currency = ?, locale = ?, avatarUrl = ? WHERE id = ?').run(
    parsed.data.name,
    parsed.data.email,
    parsed.data.currency,
    parsed.data.locale,
    parsed.data.avatarUrl ?? null,
    req.userId,
  )

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  res.json(sanitizeUser(updated))
})

app.get('/accounts', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts WHERE userId = ?').all(req.userId)
  res.json(accounts)
})

app.post('/accounts', (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    institution: z.string().optional(),
    type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'BROKERAGE', 'WALLET']),
    currency: z.enum(['USD', 'CAD']),
    balance: z.number(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid account payload' })

  const account = { id: nanoid(), userId: req.userId, lastUpdated: new Date().toISOString().slice(0, 10), ...parsed.data }
  db.prepare(
    'INSERT INTO accounts (id, userId, name, institution, type, currency, balance, lastUpdated) VALUES (@id, @userId, @name, @institution, @type, @currency, @balance, @lastUpdated)'
  ).run(account)
  res.status(201).json(account)
})

app.get('/transactions', (req, res) => {
  const { type, categoryId, search, page = 1, pageSize = 10, from, to } = req.query
  const all = db.prepare('SELECT * FROM transactions WHERE userId = ?').all(req.userId)
  let filtered = all
  if (type && type !== 'ALL') {
    filtered = filtered.filter((t) => (type === 'INCOME' ? t.amount > 0 : t.amount < 0))
  }
  if (categoryId) {
    filtered = filtered.filter((t) => t.categoryId === categoryId)
  }
  if (search) {
    filtered = filtered.filter((t) => t.description.toLowerCase().includes(String(search).toLowerCase()))
  }
  if (from && to) {
    filtered = filtered.filter((t) => t.date >= from && t.date <= to)
  }

  const totalItems = filtered.length
  const pageNum = Number(page)
  const sizeNum = Number(pageSize)
  const items = filtered.slice((pageNum - 1) * sizeNum, pageNum * sizeNum)

  res.json({ items, page: pageNum, pageSize: sizeNum, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / sizeNum)) })
})

app.get('/expenses/breakdown', (req, res) => {
  const { from, to } = req.query
  let txs = db.prepare('SELECT * FROM transactions WHERE userId = ? AND amount < 0').all(req.userId)
  if (from && to) {
    txs = txs.filter((t) => t.date >= from && t.date <= to)
  }
  const byCategory = txs.reduce((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] || 0) + Math.abs(tx.amount)
    return acc
  }, {})
  const breakdown = Object.entries(byCategory).map(([categoryId, value]) => {
    const cat = categories.find((c) => c.id === categoryId)
    return { categoryId, label: cat?.name || 'Other', value, color: cat?.color || '#94a3b8' }
  })
  res.json(breakdown)
})

app.post('/transactions', (req, res) => {
  const schema = z.object({
    accountId: z.string().min(1),
    categoryId: z.string().min(1),
    description: z.string().min(2),
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: z.number(),
    currency: z.string().min(3),
    date: z.string().min(4),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid transaction payload' })

  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND userId = ?').get(parsed.data.accountId, req.userId)
  if (!account) return res.status(404).json({ message: 'Account not found' })

  const amount = parsed.data.type === 'EXPENSE' ? -Math.abs(parsed.data.amount) : Math.abs(parsed.data.amount)
  const tx = { id: nanoid(), userId: req.userId, ...parsed.data, amount, currency: account.currency }
  db.prepare(
    'INSERT INTO transactions (id, userId, accountId, categoryId, description, type, amount, currency, date) VALUES (@id, @userId, @accountId, @categoryId, @description, @type, @amount, @currency, @date)'
  ).run(tx)

  db.prepare('UPDATE accounts SET balance = balance + ? , lastUpdated = ? WHERE id = ?')
    .run(amount, parsed.data.date, parsed.data.accountId)

  res.status(201).json(tx)
})

const cryptoMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
}

const stockSymbols = ['AAPL', 'MSFT', 'AMZN', 'GOOG', 'NVDA', 'META']
const fallbackPrices = {
  BTC: 60000,
  ETH: 3000,
  SOL: 150,
  AAPL: 190,
  MSFT: 360,
  AMZN: 170,
  GOOG: 140,
  NVDA: 900,
  META: 450,
}
const priceCache = new Map()

function cacheKey(symbol, currency) {
  return `${symbol.toUpperCase()}-${currency.toUpperCase()}`
}

function setCache(symbol, currency, currentPrice, history) {
  priceCache.set(cacheKey(symbol, currency), { currentPrice, history, timestamp: Date.now() })
}

function getCache(symbol, currency) {
  return priceCache.get(cacheKey(symbol, currency))
}

function clampPrice(val) {
  const num = Number(val)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.min(200000, Math.max(0.01, num))
}

async function fetchCryptoPriceAndHistory(symbol, currency) {
  const id = cryptoMap[symbol.toUpperCase()]
  if (!id) return null
  const vs = currency.toLowerCase() === 'cad' ? 'cad' : 'usd'
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs}&days=7`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('fetch failed')
    const json = await response.json()
    const prices = Array.isArray(json.prices) ? json.prices : []
    if (!prices.length) throw new Error('no prices')
    const currentPrice = clampPrice(prices[prices.length - 1][1])
    if (!currentPrice) throw new Error('bad price')
    const history = prices
      .filter((_, idx) => idx % Math.ceil(prices.length / 10) === 0)
      .map((point) => ({
        date: new Date(point[0]).toISOString().slice(0, 10),
        value: clampPrice(point[1]) ?? currentPrice,
      }))
    setCache(symbol, currency, currentPrice, history)
    return { currentPrice, history }
  } catch {
    const cached = getCache(symbol, currency)
    if (cached) return cached
    return null
  }
}

async function fetchStockQuote(symbol, currency) {
  // Stooq free endpoint returns CSV
  const url = `https://stooq.pl/q/l/?s=${symbol.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('fetch failed')
    const text = await response.text()
    const lines = text.trim().split('\n')
    if (lines.length < 2) throw new Error('no data')
    const cols = lines[1].split(',')
    // Close is column 6 (0-based 5)
    const close = clampPrice(cols[6 - 1])
    const price = close ?? (fallbackPrices[symbol] ?? 100)
    const history = [
      { date: '2024-11-01', value: price * 0.92 },
      { date: '2024-12-01', value: price * 0.96 },
      { date: '2025-01-01', value: price },
    ]
    setCache(symbol, currency, price, history)
    return { currentPrice: price, history }
  } catch {
    const cached = getCache(symbol, currency)
    if (cached) return cached
    return null
  }
}

function buildFallbackHistory(currentPrice) {
  const months = ['2024-11-01', '2024-12-01', '2025-01-01']
  return months.map((date, idx) => ({
    date,
    value: currentPrice * (0.92 + idx * 0.04),
  }))
}

async function fetchMarketAssets(currency) {
  const vs = currency.toLowerCase() === 'cad' ? 'cad' : 'usd'
  const cryptoAssets = await Promise.all(
    Object.entries(cryptoMap).map(async ([symbol, id]) => {
      try {
        const live = await fetchCryptoPriceAndHistory(symbol, currency)
        if (!live) throw new Error('no live')
        return { symbol, name: symbol, type: 'CRYPTO', currentPrice: live.currentPrice, currency: currency.toUpperCase() }
      } catch {
        const cached = getCache(symbol, currency)
        if (cached) return { symbol, name: symbol, type: 'CRYPTO', currentPrice: cached.currentPrice, currency: currency.toUpperCase() }
        return { symbol, name: symbol, type: 'CRYPTO', currentPrice: fallbackPrices[symbol] ?? 100, currency: currency.toUpperCase() }
      }
    }),
  )

  const stockAssets = await Promise.all(
    stockSymbols.map(async (symbol) => {
      try {
        const quote = await fetchStockQuote(symbol, currency)
        if (!quote) throw new Error('no quote')
        return { symbol, name: symbol, type: 'STOCK', currentPrice: quote.currentPrice, currency: currency.toUpperCase() }
      } catch {
        const cached = getCache(symbol, currency)
        if (cached) return { symbol, name: symbol, type: 'STOCK', currentPrice: cached.currentPrice, currency: currency.toUpperCase() }
        return { symbol, name: symbol, type: 'STOCK', currentPrice: fallbackPrices[symbol] ?? 100, currency: currency.toUpperCase() }
      }
    }),
  )

  return [...cryptoAssets, ...stockAssets]
}

function fallbackMarketAssets() {
  return [
    { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO', currentPrice: 60000, currency: 'USD' },
    { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO', currentPrice: 3000, currency: 'USD' },
    { symbol: 'SOL', name: 'Solana', type: 'CRYPTO', currentPrice: 150, currency: 'USD' },
    { symbol: 'AAPL', name: 'Apple', type: 'STOCK', currentPrice: 190, currency: 'USD' },
    { symbol: 'MSFT', name: 'Microsoft', type: 'STOCK', currentPrice: 360, currency: 'USD' },
    { symbol: 'AMZN', name: 'Amazon', type: 'STOCK', currentPrice: 170, currency: 'USD' },
  ]
}

app.get('/investments', async (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM investments WHERE userId = ?').all(req.userId)
    const enriched = await Promise.all(
      rows.map(async (inv) => {
        if (inv.type === 'CRYPTO') {
          const live = await fetchCryptoPriceAndHistory(inv.symbol, inv.currency)
          if (live) return { ...inv, currentPrice: live.currentPrice, history: live.history }
        }
        if (inv.type === 'STOCK') {
          const quote = await fetchStockQuote(inv.symbol)
          if (quote) return { ...inv, currentPrice: quote.currentPrice, history: quote.history }
        }
        return { ...inv, history: buildFallbackHistory(inv.currentPrice) }
      }),
    )
    res.json(enriched)
  } catch (err) {
    console.error('Investments fetch error', err)
    res.status(500).json({ message: 'Unable to load investments' })
  }
})

app.get('/market/assets', async (_req, res) => {
  try {
    const assets = await fetchMarketAssets('USD')
    const list = assets.filter(Boolean)
    res.json(list.length ? list : fallbackMarketAssets())
  } catch (err) {
    console.error('Market assets error', err)
    res.json(fallbackMarketAssets())
  }
})

app.get('/kpis', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts WHERE userId = ?').all(req.userId)
  const transactions = db.prepare('SELECT * FROM transactions WHERE userId = ?').all(req.userId)
  const investedAmount = db.prepare('SELECT SUM(quantity * currentPrice) as total FROM investments WHERE userId = ?').get(req.userId).total || 0
  const monthlyExpenses = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  )
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const netWorthChangePct = 6.4
  const currency = accounts[0]?.currency || 'USD'

  res.json({ totalBalance, investedAmount, monthlyExpenses, netWorthChangePct, currency })
})

app.get('/cashflow', (req, res) => {
  const days = Number(req.query.days || 30)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString().slice(0, 10)
  const txs = db.prepare('SELECT * FROM transactions WHERE userId = ? AND date >= ?').all(req.userId, sinceIso)
  const income = txs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const expense = Math.abs(txs.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
  const net = income - expense
  const currency = txs[0]?.currency || db.prepare('SELECT currency FROM accounts WHERE userId = ? LIMIT 1').get(req.userId)?.currency || 'USD'
  res.json({ income, expense, net, currency, days })
})

app.get('/net-worth', async (req, res) => {
  try {
    const daysParam = Number(req.query.days || 90)
    const days = Math.min(365, Math.max(7, daysParam))
    const today = new Date()
    today.setUTCHours(12, 0, 0, 0)
    const start = new Date(today)
    start.setUTCDate(today.getUTCDate() - (days - 1))

    const toIso = (date) => date.toISOString().slice(0, 10)
    const startIso = toIso(start)

    const dates = []
    for (let cursor = new Date(start); cursor <= today; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      dates.push(toIso(cursor))
    }

    const accounts = db.prepare('SELECT * FROM accounts WHERE userId = ?').all(req.userId)
    const transactions = db.prepare('SELECT * FROM transactions WHERE userId = ?').all(req.userId)
    const investmentRows = db.prepare('SELECT * FROM investments WHERE userId = ?').all(req.userId)

    const investments = await Promise.all(
      investmentRows.map(async (inv) => {
        if (inv.type === 'CRYPTO') {
          const live = await fetchCryptoPriceAndHistory(inv.symbol, inv.currency)
          if (live) return { ...inv, currentPrice: live.currentPrice, history: live.history }
        }
        if (inv.type === 'STOCK') {
          const quote = await fetchStockQuote(inv.symbol, inv.currency)
          if (quote) return { ...inv, currentPrice: quote.currentPrice, history: quote.history }
        }
        return { ...inv, history: buildFallbackHistory(inv.currentPrice) }
      }),
    )

    const currency = accounts[0]?.currency || investments[0]?.currency || 'USD'

    const txSumByAccount = transactions.reduce((acc, tx) => {
      acc[tx.accountId] = (acc[tx.accountId] || 0) + tx.amount
      return acc
    }, {})

    const initialAccountValue = accounts.reduce((sum, acc) => sum + acc.balance - (txSumByAccount[acc.id] || 0), 0)
    const preRangeTx = transactions
      .filter((tx) => tx.date < startIso)
      .reduce((sum, tx) => sum + tx.amount, 0)
    const dailyTx = transactions.reduce((map, tx) => {
      map[tx.date] = (map[tx.date] || 0) + tx.amount
      return map
    }, {})

    const sortedHistory = (history) => (history || []).slice().sort((a, b) => a.date.localeCompare(b.date))
    const priceForDate = (inv, date) => {
      const history = sortedHistory(inv.history)
      if (!history.length) return inv.currentPrice
      let lastPrice = history[0].value
      for (const point of history) {
        if (point.date <= date) {
          lastPrice = point.value
        } else {
          break
        }
      }
      const numeric = Number(lastPrice)
      if (Number.isFinite(numeric)) return numeric
      const fallback = Number(inv.currentPrice)
      return Number.isFinite(fallback) ? fallback : 0
    }

    let runningAccounts = initialAccountValue + preRangeTx
    const points = dates.map((date) => {
      runningAccounts += dailyTx[date] || 0
      const investmentsValue = investments.reduce((sum, inv) => sum + inv.quantity * priceForDate(inv, date), 0)
      const total = runningAccounts + investmentsValue
      return {
        date,
        accounts: Number(runningAccounts.toFixed(2)),
        investments: Number(investmentsValue.toFixed(2)),
        total: Number(total.toFixed(2)),
      }
    })

    res.json({ currency, points })
  } catch (err) {
    console.error('Net worth error', err)
    res.status(500).json({ message: 'Unable to build net worth history' })
  }
})

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})

app.post('/investments', (req, res) => {
  const schema = z.object({
    symbol: z.string().min(1),
    name: z.string().min(2),
    type: z.enum(['STOCK', 'ETF', 'CRYPTO', 'FUND', 'BOND']),
    quantity: z.number().positive(),
    currentPrice: z.number().positive(),
    currency: z.enum(['USD', 'CAD']),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid investment payload' })

  const investment = { id: nanoid(), userId: req.userId, ...parsed.data }
  db.prepare(
    'INSERT INTO investments (id, userId, symbol, name, type, quantity, currentPrice, currency) VALUES (@id, @userId, @symbol, @name, @type, @quantity, @currentPrice, @currency)'
  ).run(investment)
  res.status(201).json(investment)
})

app.post('/investments/trade', async (req, res) => {
  const schema = z.object({
    symbol: z.string().min(1),
    name: z.string().min(2),
    type: z.enum(['STOCK', 'ETF', 'CRYPTO', 'FUND', 'BOND']),
    quantity: z.number().positive(),
    side: z.enum(['BUY', 'SELL']),
    accountId: z.string().min(1),
    currency: z.enum(['USD', 'CAD']),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid trade payload' })

  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND userId = ?').get(parsed.data.accountId, req.userId)
  if (!account) return res.status(404).json({ message: 'Account not found' })
  if (account.currency !== parsed.data.currency) return res.status(400).json({ message: 'Account currency mismatch' })

  let livePrice = parsed.data.type === 'CRYPTO'
    ? await fetchCryptoPriceAndHistory(parsed.data.symbol, parsed.data.currency).then((r) => r?.currentPrice)
    : parsed.data.type === 'STOCK'
      ? (await fetchStockQuote(parsed.data.symbol))?.currentPrice
      : null
  if (!livePrice) livePrice = 1

  const cost = livePrice * parsed.data.quantity

  if (parsed.data.side === 'BUY' && account.balance < cost) {
    return res.status(400).json({ message: 'Insufficient funds' })
  }

  const existing = db.prepare('SELECT * FROM investments WHERE userId = ? AND symbol = ?').get(req.userId, parsed.data.symbol)

  if (parsed.data.side === 'BUY') {
    db.prepare('UPDATE accounts SET balance = balance - ?, lastUpdated = ? WHERE id = ?').run(cost, new Date().toISOString().slice(0, 10), account.id)
    if (existing) {
      const newQty = existing.quantity + parsed.data.quantity
      db.prepare('UPDATE investments SET quantity = ?, currentPrice = ? WHERE id = ?').run(newQty, livePrice, existing.id)
    } else {
      db.prepare(
        'INSERT INTO investments (id, userId, symbol, name, type, quantity, currentPrice, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(nanoid(), req.userId, parsed.data.symbol, parsed.data.name, parsed.data.type, parsed.data.quantity, livePrice, parsed.data.currency)
    }
  } else {
    if (!existing || existing.quantity < parsed.data.quantity) {
      return res.status(400).json({ message: 'Not enough holdings to sell' })
    }
    const newQty = existing.quantity - parsed.data.quantity
    db.prepare('UPDATE accounts SET balance = balance + ?, lastUpdated = ? WHERE id = ?').run(cost, new Date().toISOString().slice(0, 10), account.id)
    db.prepare('UPDATE investments SET quantity = ?, currentPrice = ? WHERE id = ?').run(newQty, livePrice, existing.id)
    if (newQty === 0) {
      db.prepare('DELETE FROM investments WHERE id = ?').run(existing.id)
    }
  }

  return res.json({ ok: true })
})
