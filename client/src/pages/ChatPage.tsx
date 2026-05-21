import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import api from '@/services/api'
import MessageBubble from '@/components/MessageBubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Send, MessageSquare } from 'lucide-react'
import type { Message, Pagination } from '@/types'

export default function ChatPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { user, logout } = useAuth()
  const socket = useSocket()

  const [ticket, setTicket] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    setError('')
    try {
      const [ticketRes, msgRes] = await Promise.all([
        api.get(`/tickets/${ticketId}`),
        api.get(`/tickets/${ticketId}/messages?page=${page}&limit=50`),
      ])
      setTicket(ticketRes.data.ticket)
      setMessages(msgRes.data.messages)
      setPagination(msgRes.data.pagination)
    } catch {
      setError('Unable to load conversation')
    } finally {
      setLoading(false)
    }
  }, [ticketId, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket || !ticketId) return

    socket.emit('join:ticket', ticketId)

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev
        return [message, ...prev]
      })
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.emit('leave:ticket', ticketId)
      socket.off('message:new', handleNewMessage)
    }
  }, [socket, ticketId])

  const handleSend = async () => {
    if (!messageText.trim() || sending || !ticketId) return
    setSending(true)
    setError('')
    try {
      const res = await api.post(`/tickets/${ticketId}/messages`, { content: messageText })
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data.message._id)) return prev
        return [res.data.message, ...prev]
      })
      setMessageText('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  if (error && !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild variant="link">
            <Link to="/contact">Start a new conversation</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !ticket) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
            <h1 className="truncate text-sm font-semibold">{ticket.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.name}</span>
            {user && (
              <Button variant="ghost" size="sm" onClick={logout} className="text-xs">
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 px-4 py-2">
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Send a message to start the conversation.
          </div>
        ) : (
          <div className="space-y-3">
            {pagination && pagination.totalPages > 1 && page < pagination.totalPages && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              >
                Load older messages
              </Button>
            )}

            {[...messages].reverse().map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={typeof msg.sender === 'object' && msg.sender._id === user?.id}
                showSentiment={false}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-card px-4 py-3">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={ticket.status === 'closed'}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !messageText.trim() || ticket.status === 'closed'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
