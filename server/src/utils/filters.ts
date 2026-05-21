import type { AuthRequest } from '../types'

export function buildTicketFilter(req: AuthRequest, idParam?: string) {
  const isAdmin = req.user!.role === 'admin'
  const filter: Record<string, unknown> = {}
  if (idParam) {
    filter._id = req.params[idParam]
  }
  if (!isAdmin) {
    filter.user = req.user!.userId
  }
  return { filter, isAdmin }
}
