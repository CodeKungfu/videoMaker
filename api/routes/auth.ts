/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import prisma from '../prisma.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  // 考虑到这是一个单人/本地工作流工具，目前不需要复杂的注册逻辑。
  // 此接口预留供将来多用户 SaaS 化时使用。
  res.json({ success: true, message: 'Registration is not required for local use.' })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  // 单人本地版默认返回成功，可后续扩展 JWT
  res.json({ success: true, token: 'local-dev-token' })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true })
})

export default router
