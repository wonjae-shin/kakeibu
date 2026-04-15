import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { pin } = req.body as { pin?: string }
    if (!pin) {
      res.status(400).json({ success: false, message: 'PIN을 입력해주세요.' })
      return
    }

    const email = process.env.ADMIN_EMAIL
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ success: false, message: 'PIN이 올바르지 않습니다.' })
      return
    }

    const valid = await bcrypt.compare(pin, user.password)
    if (!valid) {
      res.status(401).json({ success: false, message: 'PIN이 올바르지 않습니다.' })
      return
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: { accessToken, refreshToken, email: user.email },
    })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'refreshToken이 없습니다.' })
      return
    }
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' })
      return
    }
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    res.json({ success: true, data: { accessToken } })
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: '로그아웃 되었습니다.' })
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, createdAt: true },
    })
    if (!user) {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      return
    }
    res.json({ success: true, data: user })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
