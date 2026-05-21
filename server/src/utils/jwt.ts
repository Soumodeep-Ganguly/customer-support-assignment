import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import type { AuthPayload } from '../types'

export function signToken(payload: AuthPayload): string {
  return jwt.sign({ ...payload }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  })
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwtSecret) as AuthPayload
}
