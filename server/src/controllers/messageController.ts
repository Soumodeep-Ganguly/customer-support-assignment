import { Response } from 'express'
import { Message } from '../models/Message'
import { Ticket } from '../models/Ticket'
import { AppError } from '../middleware/errorHandler'
import { analyzeSentiment } from '../services/aiService'
import { getIO } from '../sockets'
import type { AuthRequest, Sentiment } from '../types'

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
  const skip = (page - 1) * limit

  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = { _id: req.params.ticketId }
  if (!isAdmin) filter.user = req.user!.userId

  const ticket = await Ticket.findOne(filter)
  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  const [messages, total] = await Promise.all([
    Message.find({ ticket: req.params.ticketId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email'),
    Message.countDocuments({ ticket: req.params.ticketId }),
  ])

  res.json({
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const { content } = req.body

  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400)
  }

  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = { _id: req.params.ticketId }
  if (!isAdmin) filter.user = req.user!.userId

  const ticket = await Ticket.findOne(filter)
  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  if (ticket.status === 'closed') {
    throw new AppError('Cannot send messages to a closed ticket', 400)
  }

  let sentiment: Sentiment = 'neutral'
  try {
    sentiment = await analyzeSentiment(content)
  } catch {
    // If AI sentiment fails, default to neutral
  }

  const message = await Message.create({
    ticket: ticket._id,
    sender: req.user!.userId,
    content: content.trim(),
    role: 'user',
    sentiment,
  })

  await Ticket.findByIdAndUpdate(ticket._id, {
    status: ticket.status === 'open' ? 'in_progress' : ticket.status,
  })

  const populated = await message.populate('sender', 'name email')

  try {
    getIO().to(`ticket:${ticket._id}`).emit('message:new', populated.toObject())
  } catch {
    // Socket not available, message still saved
  }

  res.status(201).json({ message: populated })
}
