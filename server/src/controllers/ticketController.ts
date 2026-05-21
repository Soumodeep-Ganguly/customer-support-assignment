import { Response } from 'express'
import { Ticket } from '../models/Ticket'
import { Message } from '../models/Message'
import { AppError } from '../middleware/errorHandler'
import { findOrCreateUser } from '../services/userService'
import { signToken } from '../utils/jwt'
import { getIO } from '../sockets'
import type { AuthRequest } from '../types'

export async function createTicket(req: AuthRequest, res: Response): Promise<void> {
  const { title, priority, customerEmail } = req.body

  if (!title) {
    throw new AppError('Title is required', 400)
  }

  let userId = req.user!.userId

  if (customerEmail) {
    const customer = await findOrCreateUser(customerEmail, customerEmail.split('@')[0])
    userId = customer._id.toString()
  }

  const ticket = await Ticket.create({
    title,
    priority: priority || 'medium',
    user: userId,
  })

  const populated = await ticket.populate('user', 'name email')

  res.status(201).json({ ticket: populated })
}

export async function createPublicTicket(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, title } = req.body

  if (!name || !email || !title) {
    throw new AppError('Name, email, and title are required', 400)
  }

  const user = await findOrCreateUser(email, name)
  const ticket = await Ticket.create({ title, user: user._id })
  const populated = await ticket.populate('user', 'name email')

  try {
    getIO().emit('ticket:new', populated.toObject())
  } catch {
    // socket not available
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  })

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    ticket: populated,
  })
}

export async function getTickets(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
  const skip = (page - 1) * limit
  const status = req.query.status as string | undefined

  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = {}
  if (!isAdmin) {
    filter.user = req.user!.userId
  }
  if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    filter.status = status
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('user', 'name email'),
    Ticket.countDocuments(filter),
  ])

  res.json({
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function getTicket(req: AuthRequest, res: Response): Promise<void> {
  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = { _id: req.params.id }
  if (!isAdmin) filter.user = req.user!.userId

  const ticket = await Ticket.findOne(filter).populate('user', 'name email')

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  res.json({ ticket })
}

export async function updateTicket(req: AuthRequest, res: Response): Promise<void> {
  const { status, priority } = req.body
  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = { _id: req.params.id }
  if (!isAdmin) filter.user = req.user!.userId

  const ticket = await Ticket.findOneAndUpdate(filter,
    { ...(status && { status }), ...(priority && { priority }) },
    { new: true, runValidators: true }
  ).populate('user', 'name email')

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  res.json({ ticket })
}

export async function deleteTicket(req: AuthRequest, res: Response): Promise<void> {
  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = { _id: req.params.id }
  if (!isAdmin) filter.user = req.user!.userId

  const ticket = await Ticket.findOneAndDelete(filter)

  if (!ticket) {
    throw new AppError('Ticket not found', 404)
  }

  await Message.deleteMany({ ticket: ticket._id })

  res.json({ message: 'Ticket deleted successfully' })
}
