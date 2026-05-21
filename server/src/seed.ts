import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/customer-support'
  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB')

  const { User } = await import('./models/User')

  const existing = await User.findOne({ email: 'admin@email.com' })
  if (existing) {
    console.log('Admin user already exists:', existing.email)
    await mongoose.disconnect()
    return
  }

  const hashed = await bcrypt.hash('12345678', 12)
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@email.com',
    password: hashed,
    role: 'admin',
  })

  console.log('Admin user created:')
  console.log('  Email: admin@email.com')
  console.log('  Password: 12345678')
  console.log('  Role: admin')

  await mongoose.disconnect()
  console.log('Done')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
