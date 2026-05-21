import { Response } from 'express'
import { Message } from '../models/Message'
import { Ticket } from '../models/Ticket'
import { AppError } from '../middleware/errorHandler'
import { generateSuggestedReplies, summarizeConversation } from '../services/aiService'
import { buildTicketFilter } from '../utils/filters'
import type { AuthRequest } from '../types'

export async function suggestReply(req: AuthRequest, res: Response): Promise<void> {
  const { filter } = buildTicketFilter(req, 'ticketId')

  const ticket = await Ticket.findOne(filter)
  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  const recentMessages = await Message.find({ ticket: ticket._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('sender', 'name')

  const history = recentMessages
    .reverse()
    .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

  const suggestions = await generateSuggestedReplies(ticket.title, history)

  res.json({ suggestions })
}

export async function summarizeTicket(req: AuthRequest, res: Response): Promise<void> {
  const { filter } = buildTicketFilter(req, 'ticketId')

  const ticket = await Ticket.findOne(filter)
  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  const allMessages = await Message.find({ ticket: ticket._id })
    .sort({ createdAt: 1 })
    .populate('sender', 'name')

  const conversation = allMessages.map((m) => ({
    role: m.role === 'ai' ? 'assistant' : m.sender._id.toString() === req.user!.userId ? 'customer' : 'agent',
    content: m.content,
  }))

  const summary = await summarizeConversation(conversation)

  await Ticket.findByIdAndUpdate(ticket._id, { summary })

  res.json({ summary })
}
