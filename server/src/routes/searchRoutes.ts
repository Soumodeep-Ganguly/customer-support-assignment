import { Router } from 'express'
import { search } from '../controllers/searchController'
import { authenticate } from '../middleware/auth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(authenticate)
router.get('/', asyncHandler(search))

export default router
