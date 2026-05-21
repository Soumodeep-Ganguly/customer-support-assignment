import { Router } from 'express'
import { createTicket, createPublicTicket, getTickets, getTicket, updateTicket, deleteTicket } from '../controllers/ticketController'
import { authenticate } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.post('/public', asyncHandler(createPublicTicket))

router.use(authenticate)

router.post('/', asyncHandler(createTicket))
router.get('/', asyncHandler(getTickets))
router.get('/:id', asyncHandler(getTicket))
router.patch('/:id', asyncHandler(updateTicket))
router.delete('/:id', asyncHandler(deleteTicket))

export default router
