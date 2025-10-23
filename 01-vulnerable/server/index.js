import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

const challenges = [
  { id: 'xss', title: 'DOM XSS with v-html', points: 100, tags: ['xss','vue'], solved:false },
  { id: 'cookie', title: 'Steal SID via document.cookie', points: 100, tags: ['cookie','xss'], solved:false },
  { id: 'csrf', title: 'CSRF via image GET request', points: 100, tags: ['csrf'], solved:false }
]
const scoreboard = [{ name: 'guest', score: 0 }]
const wallets = new Map()

const users = new Map() // key: sid, value: { score: number, solved: Set<string> }

// ユーティリティ: ユーザー取得/初期化
function getUser(sid) {
  let u = users.get(sid)
  if (!u) {
    u = { score: 0, solved: new Set() }
    users.set(sid, u)
  }
  return u
}

app.get('/api/session', (req, res) => {
  res.cookie('sid', 'demo-session', { httpOnly: false, sameSite: 'lax', domain: 'localhost', path: '/' })
  const sid = 'demo-session'
  if (!wallets.has(sid)) wallets.set(sid, { balance: 1000 })
  res.json({ ok: true })
})

app.get('/api/challenges', (_req, res) => { res.json(challenges) })
app.get('/api/challenges/:id', (req, res) => { const c = challenges.find(c => c.id === req.params.id); if (!c) return res.status(404).json({ error: 'not found' }); res.json(c) })

app.get('/api/wallet', (req, res) => {
  const sid = req.cookies?.sid || 'demo-session'
  const w = wallets.get(sid) || { balance: 0 }
  res.json(w)
})

app.get('/api/csrf/transfer', (req, res) => {
  const sid = req.cookies?.sid || 'demo-session'
  const w = wallets.get(sid) || { balance: 0 }
  const amt = Math.max(0, Number(req.query.amount || 0))
  const to  = String(req.query.to || '')
  if (w.balance >= amt && amt > 0 && to) {
    w.balance -= amt
    w.lastTransfer = { to, amount: amt }
    const code = Buffer.from(`${to}:${amt}`).toString('base64')
    w.csrfCode = code
    wallets.set(sid, w)
    return res.json({ ok: true, balance: w.balance })
  }
  res.json({ ok: false, balance: w.balance })
})

app.post('/api/flag/verify', (req, res) => {
  const { id, flag } = req.body || {}
  const sid = req.cookies?.sid || 'demo-session'
  const user = getUser(sid)

  let ok = false
  if (id === 'xss') {
    ok = flag === 'CTF{v-html_is_dangerous}'
  } else if (id === 'cookie') {
    ok = !!flag && flag === req.cookies?.sid
  } else if (id === 'csrf') {
    const w = wallets.get(sid) || {}
    ok = Boolean(w.csrfCode && flag === w.csrfCode)
  }

  if (!ok) {
    return res.json({ ok: false })
  }

  if (user.solved.has(id)) {
    return res.json({ ok: true, duplicate: true, score: user.score })
  }

  user.solved.add(id)
  user.score += 100

  const userName = 'you';
  const existing = scoreboard.find(s => s.name === userName)
  if (existing) {
    existing.score = user.score
  } else {
    scoreboard.push({ name: userName, score: user.score })
  }

  return res.json({ ok: true, duplicate: false, score: user.score })
})

app.get('/api/scoreboard', (_req, res) => { res.json(scoreboard.slice(-10).reverse()) })

app.post('/api/reset', (req, res) => { const sid = req.cookies?.sid || 'demo-session'; wallets.set(sid, { balance: 1000 }); res.json({ ok: true, balance: 1000 }) })

const port = 3001
app.listen(port, () => console.log('Vulnerable server on http://localhost:'+port))
