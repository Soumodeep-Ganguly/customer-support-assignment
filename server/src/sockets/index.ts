import { Server as HTTPServer } from 'http'
import { Server } from 'socket.io'
import { verifyToken } from '../utils/jwt'
import { config } from '../config/env'
import type { AuthPayload } from '../types'

let io: Server

export function setupSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const user = verifyToken(token)
      ;(socket as any).user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const user = (socket as any).user as AuthPayload
    console.log(`User connected: ${user.email}`)

    socket.on('join:ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`)
      console.log(`${user.email} joined ticket:${ticketId}`)
    })

    socket.on('leave:ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`)
      console.log(`${user.email} left ticket:${ticketId}`)
    })

    socket.on('message:new', (message: any) => {
      socket.to(`ticket:${message.ticket}`).emit('message:new', message)
    })

    socket.on('typing', ({ ticketId, isTyping }: { ticketId: string; isTyping: boolean }) => {
      socket.to(`ticket:${ticketId}`).emit('user:typing', {
        userId: user.userId,
        email: user.email,
        isTyping,
      })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`)
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}
