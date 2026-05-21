import { Response } from 'express'
import { User } from '../models/User'
import { Ticket } from '../models/Ticket'
import { Message } from '../models/Message'
import type { AuthRequest } from '../types'

export async function search(req: AuthRequest, res: Response): Promise<void> {
  const q = (req.query.q as string)?.trim()
  const type = req.query.type as string | undefined

  if (!q) {
    res.json({ tickets: [], messages: [] })
    return
  }

  const isAdmin = req.user!.role === 'admin'
  const userId = req.user!.userId

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

  let tickets: unknown[] = []
  let messages: unknown[] = []

  const userFilter = isAdmin ? {} : { user: userId }

  if (!type || type === 'tickets') {
    const matchedUserIds = (
      await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id')
    ).map((u) => u._id)

    tickets = await Ticket.find({
      ...userFilter,
      $or: [{ title: regex }, { user: { $in: matchedUserIds } }],
    })
      .sort({ updatedAt: -1 })
      .populate('user', 'name email')
      .limit(20)
  }

  if (!type || type === 'messages') {
    const userTicketIds = isAdmin
      ? await Ticket.find().select('_id').then((ts) => ts.map((t) => t._id))
      : await Ticket.find({ user: userId }).select('_id').then((ts) => ts.map((t) => t._id))

    messages = await Message.find({
      ticket: { $in: userTicketIds },
      content: regex,
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email')
      .populate('ticket', 'title')
      .limit(20)
  }

  res.json({ tickets, messages })
}
