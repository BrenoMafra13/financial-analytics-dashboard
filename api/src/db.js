const Database = require('better-sqlite3')
const path = require('path')
const bcrypt = require('bcryptjs')

const dbPath = path.join(__dirname, 'data.db')
const db = new Database(dbPath)

const categories = [
  { id: 'cat-1', name: 'Salary', type: 'INCOME', color: '#06c087' },
  { id: 'cat-2', name: 'Investments', type: 'INCOME', color: '#38bdf8' },
  { id: 'cat-3', name: 'Rent', type: 'EXPENSE', color: '#fb7185' },
  { id: 'cat-4', name: 'Food', type: 'EXPENSE', color: '#f59e0b' },
  { id: 'cat-5', name: 'Transport', type: 'EXPENSE', color: '#6366f1' },
  { id: 'cat-6', name: 'Entertainment', type: 'EXPENSE', color: '#22c55e' },
  { id: 'cat-7', name: 'Utilities', type: 'EXPENSE', color: '#0ea5e9' },
]

function bootstrap() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      locale TEXT NOT NULL,
      tier TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      institution TEXT,
      type TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance REAL NOT NULL,
      lastUpdated TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(accountId) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      currentPrice REAL NOT NULL,
      currency TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (userCount === 0) {
    const demoUser = {
      id: 'user-1',
      email: 'demo@breno.finance',
      passwordHash: bcrypt.hashSync('demo123', 10),
      name: 'Breno Demo',
      currency: 'USD',
      locale: 'en-US',
      tier: 'premium',
    }
    db.prepare(
      'INSERT INTO users (id, email, passwordHash, name, currency, locale, tier) VALUES (@id, @email, @passwordHash, @name, @currency, @locale, @tier)'
    ).run(demoUser)

    const accounts = [
      { id: 'acc-1', userId: demoUser.id, name: 'Checking', institution: 'Breno Bank', type: 'CHECKING', currency: 'USD', balance: 8200, lastUpdated: '2025-01-01' },
      { id: 'acc-2', userId: demoUser.id, name: 'High-Yield Savings', institution: 'Breno Bank', type: 'SAVINGS', currency: 'USD', balance: 18500, lastUpdated: '2025-01-01' },
      { id: 'acc-3', userId: demoUser.id, name: 'Brokerage', institution: 'Breno Invest', type: 'BROKERAGE', currency: 'USD', balance: 40250, lastUpdated: '2025-01-01' },
      { id: 'acc-4', userId: demoUser.id, name: 'Credit Card', institution: 'Breno Card', type: 'CREDIT_CARD', currency: 'USD', balance: -950, lastUpdated: '2025-01-01' },
    ]

    const txs = [
      { id: 'tx-1', userId: demoUser.id, accountId: 'acc-1', categoryId: 'cat-1', description: 'Salary - Breno Corp', type: 'INCOME', amount: 6200, currency: 'USD', date: '2025-01-02' },
      { id: 'tx-2', userId: demoUser.id, accountId: 'acc-3', categoryId: 'cat-2', description: 'ETF contribution', type: 'INCOME', amount: 850, currency: 'USD', date: '2025-01-03' },
      { id: 'tx-3', userId: demoUser.id, accountId: 'acc-1', categoryId: 'cat-3', description: 'Rent - January', type: 'EXPENSE', amount: -1800, currency: 'USD', date: '2025-01-04' },
      { id: 'tx-4', userId: demoUser.id, accountId: 'acc-1', categoryId: 'cat-4', description: 'Groceries', type: 'EXPENSE', amount: -240, currency: 'USD', date: '2025-01-05' },
      { id: 'tx-5', userId: demoUser.id, accountId: 'acc-1', categoryId: 'cat-5', description: 'Ride share', type: 'EXPENSE', amount: -32, currency: 'USD', date: '2025-01-06' },
      { id: 'tx-6', userId: demoUser.id, accountId: 'acc-1', categoryId: 'cat-6', description: 'Streaming services', type: 'EXPENSE', amount: -28, currency: 'USD', date: '2025-01-06' },
      { id: 'tx-7', userId: demoUser.id, accountId: 'acc-1', categoryId: 'cat-7', description: 'Electricity bill', type: 'EXPENSE', amount: -120, currency: 'USD', date: '2025-01-06' },
    ]

    const investments = [
      { id: 'inv-1', userId: demoUser.id, symbol: 'AAPL', name: 'Apple Inc', type: 'STOCK', quantity: 40, currentPrice: 190, currency: 'USD' },
      { id: 'inv-2', userId: demoUser.id, symbol: 'VTI', name: 'Vanguard Total Market', type: 'ETF', quantity: 25, currentPrice: 245, currency: 'USD' },
      { id: 'inv-3', userId: demoUser.id, symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO', quantity: 0.8, currentPrice: 42000, currency: 'USD' },
    ]

    const insertAccount = db.prepare('INSERT INTO accounts (id, userId, name, institution, type, currency, balance, lastUpdated) VALUES (@id, @userId, @name, @institution, @type, @currency, @balance, @lastUpdated)')
    const insertTx = db.prepare('INSERT INTO transactions (id, userId, accountId, categoryId, description, type, amount, currency, date) VALUES (@id, @userId, @accountId, @categoryId, @description, @type, @amount, @currency, @date)')
    const insertInvestment = db.prepare('INSERT INTO investments (id, userId, symbol, name, type, quantity, currentPrice, currency) VALUES (@id, @userId, @symbol, @name, @type, @quantity, @currentPrice, @currency)')

    const tx = db.transaction(() => {
      accounts.forEach((a) => insertAccount.run(a))
      txs.forEach((t) => insertTx.run(t))
      investments.forEach((inv) => insertInvestment.run(inv))
    })
    tx()
  }
}

module.exports = { db, bootstrap, categories }
