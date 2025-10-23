import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

const limiter = rateLimit({ windowMs: 30_000, max: 10, standardHeaders:true, legacyHeaders:false })

const challenges = [
  { id: 'xss', title: 'Avoid DOM XSS (no v-html)', points: 100, tags: ['xss','vue'], solved:false },
  { id: 'cookie', title: 'SID is httpOnly — cannot read via JS', points: 150, tags: ['cookie'], solved:false },
  { id: 'csrf', title: 'CSRF requires token (POST only)', points: 200, tags: ['csrf'], solved:false }
]
const scoreboard = [{ name: 'guest', score: 0 }]
const wallets = new Map()

app.get('/api/session', (req, res) => {
  res.cookie('sid', 'demo-session', { httpOnly: true, sameSite: 'lax', domain: 'localhost', path: '/' })
  const token = Math.random().toString(36).slice(2)
  res.cookie('csrfToken', token, { httpOnly: false, sameSite: 'lax', domain: 'localhost', path: '/' })
  const sid = 'demo-session'
  if (!wallets.has(sid)) wallets.set(sid, { balance: 1000 })
  res.json({ ok: true })
})

app.get('/api/challenges', (_req, res) => { res.json(challenges) })
app.get('/api/challenges/:id', (req, res) => { const c = challenges.find(c => c.id === req.params.id); if (!c) return res.status(404).json({ error: 'not found' }); res.json(c) })

app.get('/api/wallet', (req, res) => { const sid = req.cookies?.sid || 'demo-session'; const w = wallets.get(sid) || { balance: 0 }; res.json(w) })

app.post('/api/transfer', limiter, (req, res) => {
  const csrfCookie = req.cookies?.csrfToken
  const csrfHeader = req.headers['x-csrf-token']
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) return res.status(403).json({ ok:false, error:'csrf check failed' })
  const sid = req.cookies?.sid || 'demo-session'; const w = wallets.get(sid) || { balance: 0 }
  const amt = Math.max(0, Number(req.body?.amount || 0)); const to = String(req.body?.to || '')
  if (w.balance >= amt && amt > 0 && to) { w.balance -= amt; w.lastTransfer = { to, amount: amt }; wallets.set(sid, w); return res.json({ ok: true, balance: w.balance }) }
  res.json({ ok: false, balance: w.balance })
})

app.post('/api/flag/verify', limiter, (req, res) => {
  const csrfCookie = req.cookies?.csrfToken; const csrfHeader = req.headers['x-csrf-token']
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) return res.status(403).json({ ok:false, error:'csrf check failed' })
  const { id, flag } = req.body || {}; let ok = false
  if (id === 'xss') ok = flag === 'SAFE{no_v_html}'
  else if (id === 'cookie') ok = flag && req.cookies && flag === req.cookies.sid
  else if (id === 'csrf') { const sid = req.cookies?.sid || 'demo-session'; const w = wallets.get(sid) || { balance: 0 }; ok = w.lastTransfer && w.lastTransfer.to === 'attacker' && w.lastTransfer.amount === 100 }
  if (ok) scoreboard.push({ name: 'you', score: 100 }); res.json({ ok })
})

app.post('/api/reset', (req, res) => { const sid = req.cookies?.sid || 'demo-session'; wallets.set(sid, { balance: 1000 }); res.json({ ok: true, balance: 1000 }) })

app.get('/api/scoreboard', (_req, res) => { res.json(scoreboard.slice(-10).reverse()) })

const port = 3001; app.listen(port, () => console.log('Safe server on http://localhost:'+port))
