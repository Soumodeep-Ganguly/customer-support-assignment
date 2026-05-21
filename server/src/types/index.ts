import { Request } from 'express'

export interface AuthPayload {
  userId: string
  email: string
  role: 'customer' | 'agent' | 'admin'
}

export interface AuthRequest extends Request {
  user?: AuthPayload
}

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'urgent'

export type MessageRole = 'user' | 'ai' | 'system'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high'
