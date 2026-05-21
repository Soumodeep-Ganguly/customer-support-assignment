import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { config } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/authRoutes'
import ticketRoutes from './routes/ticketRoutes'
import messageRoutes from './routes/messageRoutes'
import aiRoutes from './routes/aiRoutes'
import searchRoutes from './routes/searchRoutes'

const app = express()

app.use(cors({ origin: config.clientUrl, credentials: true }))
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const publicTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many ticket submissions. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many messages. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/tickets/public', publicTicketLimiter)
app.use('/api/tickets', messageLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/tickets', messageRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/search', searchRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

export default app
