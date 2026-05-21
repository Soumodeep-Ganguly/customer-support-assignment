import { useState, useCallback } from 'react'
import api from '@/services/api'
import { useTicketSocket } from './useTicketSocket'
import type { Message, Pagination } from '@/types'

export function useMessages(ticketId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useTicketSocket(
    ticketId,
    useCallback((message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev
        return [message, ...prev]
      })
    }, [])
  )

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const res = await api.get(`/tickets/${ticketId}/messages?page=${page}&limit=50`)
      setMessages(res.data.messages)
      setPagination(res.data.pagination)
    } finally {
      setLoading(false)
    }
  }, [ticketId, page])

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || sending || !ticketId) return
    setSending(true)
    try {
      const res = await api.post(`/tickets/${ticketId}/messages`, { content: text })
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data.message._id)) return prev
        return [res.data.message, ...prev]
      })
    } finally {
      setSending(false)
    }
  }, [ticketId, sending])

  return {
    messages,
    setMessages,
    pagination,
    page,
    setPage,
    loading,
    sending,
    fetchMessages,
    handleSend,
  }
}
