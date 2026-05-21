import mongoose, { Document, Schema, Types } from 'mongoose'
import type { Sentiment, MessageRole } from '../types'

export interface IMessage extends Document {
  ticket: Types.ObjectId
  sender: Types.ObjectId
  content: string
  role: MessageRole
  sentiment: Sentiment
  createdAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    role: { type: String, enum: ['user', 'ai', 'system'], required: true },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'urgent'],
      default: 'neutral',
    },
  },
  { timestamps: true }
)

messageSchema.index({ ticket: 1, createdAt: -1 })
messageSchema.index({ content: 'text' })

export const Message = mongoose.model<IMessage>('Message', messageSchema)
