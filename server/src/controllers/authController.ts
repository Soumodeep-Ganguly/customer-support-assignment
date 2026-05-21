import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'
import { signToken } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'
import type { AuthRequest } from '../types'

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400)
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400)
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    throw new AppError('Email already in use', 409)
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, password: hashedPassword })

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  })

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  })
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401)
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  })

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  })
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.userId).select('-password')
  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } })
}
