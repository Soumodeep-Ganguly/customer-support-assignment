import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'

export async function findOrCreateUser(email: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim()

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    return existing
  }

  const randomPassword = crypto.randomUUID() + crypto.randomUUID()
  const hashed = await bcrypt.hash(randomPassword, 12)

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashed,
    role: 'customer',
  })

  return user
}
