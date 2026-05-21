import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import api from '@/services/api'
import { useMessages } from '@/hooks/useMessages'
import MessageBubble from '@/components/MessageBubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Send, MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { user, logout } = useAuth()
  const socket = useSocket()
  const { messages, pagination, page, setPage, loading, sending, fetchMessages, handleSend: sendMessage } = useMessages(ticketId)

  const [ticket, setTicket] = useState<any>(null)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState('')
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchData = useCallback(async () => {
    if (!ticketId) return
    setError('')
    try {
      const [ticketRes] = await Promise.all([
        api.get(`/tickets/${ticketId}`),
        fetchMessages(),
      ])
      setTicket(ticketRes.data.ticket)
    } catch {
      setError('Unable to load conversation')
    }
  }, [ticketId, fetchMessages])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  useEffect(() => {
    if (!socket || !ticketId) return

    const handleUserTyping = ({ userId, email, isTyping }: { userId: string; email: string; isTyping: boolean }) => {
      if (userId === user?.id) return
      setTypingUsers((prev) => {
        if (isTyping) return { ...prev, [userId]: email }
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }

    socket.on('user:typing', handleUserTyping)

    return () => {
      socket.off('user:typing', handleUserTyping)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [socket, ticketId, user?.id])

  const handleTyping = () => {
    if (!socket || !ticketId) return
    socket.emit('typing', { ticketId, isTyping: true })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { ticketId, isTyping: false })
    }, 2000)
  }

  const handleSend = async () => {
    if (!messageText.trim() || sending || !ticketId) return
    setError('')
    try {
      await sendMessage(messageText)
      setMessageText('')
      if (socket && ticketId) {
        socket.emit('typing', { ticketId, isTyping: false })
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send')
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
            {Object.keys(typingUsers).length > 0 && (
              <div className="text-xs text-muted-foreground italic px-1">
                {Object.values(typingUsers).join(', ')} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-card px-4 py-3">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => { setMessageText(e.target.value); handleTyping() }}
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
