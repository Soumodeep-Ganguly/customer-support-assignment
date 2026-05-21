import bcrypt from 'bcryptjs'
import { User } from '../models/User'

export async function autoSeedAdmin(): Promise<void> {
  try {
    const existing = await User.findOne({ role: 'admin' })
    if (existing) return

    const hashed = await bcrypt.hash('12345678', 12)
    await User.create({
      name: 'Admin',
      email: 'admin@email.com',
      password: hashed,
      role: 'admin',
    })

    console.log('Auto-seeded admin user:')
    console.log('  Email: admin@email.com')
    console.log('  Password: 12345678')
  } catch (error) {
    console.error('Failed to auto-seed admin:', error)
  }
}
