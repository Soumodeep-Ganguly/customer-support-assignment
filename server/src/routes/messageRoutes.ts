import { Router } from 'express'
import { getMessages, sendMessage } from '../controllers/messageController'
import { authenticate } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(authenticate)

router.get('/:ticketId/messages', asyncHandler(getMessages))
router.post('/:ticketId/messages', asyncHandler(sendMessage))

export default router
