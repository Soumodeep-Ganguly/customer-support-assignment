import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import api from '@/services/api'
import { useMessages } from '@/hooks/useMessages'
import MessageBubble from '@/components/MessageBubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sparkles, FileText, Send, AlertCircle, Check, ArrowLeft } from 'lucide-react'

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  in_progress: 'secondary',
  resolved: 'outline',
  closed: 'destructive',
}

export default function TicketDetailPanel() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const socket = useSocket()
  const { messages, pagination, page, setPage, loading, sending, fetchMessages, handleSend: sendMessage } = useMessages(ticketId)

  const [ticket, setTicket] = useState<any>(null)
  const [messageText, setMessageText] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [error, setError] = useState('')
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return
    try {
      const res = await api.get(`/tickets/${ticketId}`)
      setTicket(res.data.ticket)
    } catch {
      setError('Ticket not found')
    }
  }, [ticketId])

  useEffect(() => {
    setTicket(null)
    setError('')
    setPage(1)
    setSuggestions([])
    fetchTicket()
    fetchMessages()
  }, [ticketId, fetchTicket, fetchMessages])

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

      if (ticket?.status === 'open') {
        setTicket((prev: any) => ({ ...prev, status: 'in_progress' }))
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message')
    }
  }

  const handleSuggestReply = async () => {
    if (!ticketId) return
    setGenerating(true)
    setSuggestions([])
    setError('')
    try {
      const res = await api.post(`/ai/${ticketId}/suggest-reply`)
      setSuggestions(res.data.suggestions || [])
    } catch {
      setError('Failed to generate reply')
    } finally {
      setGenerating(false)
    }
  }

  const sendSuggestion = async (text: string) => {
    setMessageText(text)
    setSuggestions([])
  }

  const handleSummarize = async () => {
    if (!ticketId) return
    setSummarizing(true)
    setError('')
    try {
      const res = await api.post(`/ai/${ticketId}/summarize`)
      setTicket((prev: any) => ({ ...prev, summary: res.data.summary }))
    } catch {
      setError('Failed to generate summary')
    } finally {
      setSummarizing(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!ticketId) return
    try {
      const res = await api.patch(`/tickets/${ticketId}`, { status })
      setTicket(res.data.ticket)
    } catch {
      setError('Failed to update status')
    }
  }

  if (error && !ticket) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading || !ticket) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="flex-1 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="md:hidden -ml-2" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="truncate text-lg font-semibold">{ticket.title}</h2>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-6 w-auto gap-1 border-0 px-2 text-xs font-medium shadow-none">
                  <Badge variant={statusVariants[ticket.status]} className="px-1.5 py-0 text-[10px]">
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSummarize} disabled={summarizing}>
            <FileText className="mr-1 h-3.5 w-3.5" />
            {summarizing ? '...' : ticket.summary ? 'Re-summarize' : 'Summarize'}
          </Button>
        </div>

        {ticket.summary && (
          <div className="mt-2 rounded-lg bg-muted p-2.5">
            <p className="text-xs font-medium text-muted-foreground">Summary</p>
            <p className="mt-0.5 text-sm">{ticket.summary}</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-2 py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet. Start the conversation.
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

      <div className="shrink-0 border-t bg-card px-6 py-4">
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
            <Send className="mr-1 h-4 w-4" />
            {sending ? '...' : 'Send'}
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Popover open={suggestions.length > 0} onOpenChange={(open) => { if (!open) setSuggestions([]) }}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSuggestReply}
                disabled={generating || ticket.status === 'closed'}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {generating ? 'Generating...' : 'Suggest Reply'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">
                  Choose a suggested reply
                </p>
                {suggestions.map((text, i) => (
                  <Card key={i} className="cursor-pointer transition-colors hover:bg-accent" onClick={() => sendSuggestion(text)}>
                    <CardContent className="flex items-start gap-2 p-3">
                      <p className="flex-1 text-sm whitespace-pre-wrap">{text}</p>
                      <Button size="icon" variant="ghost" className="mt-0.5 h-6 w-6 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
