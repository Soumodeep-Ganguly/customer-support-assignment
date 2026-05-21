import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ITicket extends Document {
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  user: Types.ObjectId
  summary: string | null
  createdAt: Date
  updatedAt: Date
}

const ticketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    summary: { type: String, default: null },
  },
  { timestamps: true }
)

ticketSchema.index({ title: 'text' })

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema)
