import { useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import type { Message } from '@/types'

export function useTicketSocket(
  ticketId: string | undefined,
  onNewMessage: (message: Message) => void
) {
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !ticketId) return

    socket.emit('join:ticket', ticketId)

    socket.on('message:new', onNewMessage)

    return () => {
      socket.emit('leave:ticket', ticketId)
      socket.off('message:new', onNewMessage)
    }
  }, [socket, ticketId, onNewMessage])
}
