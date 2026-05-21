import { Router } from 'express'
import { suggestReply, summarizeTicket } from '../controllers/aiController'
import { authenticate } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(authenticate)

router.post('/:ticketId/suggest-reply', asyncHandler(suggestReply))
router.post('/:ticketId/summarize', asyncHandler(summarizeTicket))

export default router
