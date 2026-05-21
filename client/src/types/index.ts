export interface User {
  id: string
  name: string
  email: string
  role: 'customer' | 'agent' | 'admin'
}

export interface Ticket {
  _id: string
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  user: User | string
  summary: string | null
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  ticket: string | Ticket
  sender: User | string
  content: string
  role: 'user' | 'ai' | 'system'
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent'
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface TicketsResponse {
  tickets: Ticket[]
  pagination: Pagination
}

export interface MessagesResponse {
  messages: Message[]
  pagination: Pagination
}

export interface SearchResponse {
  tickets: Ticket[]
  messages: Message[]
}
