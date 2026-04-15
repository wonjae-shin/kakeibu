import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

function signTokens(userId: string, isAnonymous: boolean) {
  const accessToken = jwt.sign(
    { userId, isAnonymous },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

// POST /api/auth/anonymous — deviceId로 익명 계정 조회/생성
router.post('/anonymous', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body as { deviceId?: string }
    if (!deviceId) {
      res.status(400).json({ success: false, message: 'deviceId가 필요합니다.' })
      return
    }

    let user = await prisma.user.findUnique({ where: { deviceId } })
    if (!user) {
      user = await prisma.user.create({
        data: { isAnonymous: true, deviceId },
      })
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.isAnonymous)
    res.json({ success: true, data: { accessToken, refreshToken } })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/auth/login — 이메일 + 비밀번호 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      return
    }

    const { accessToken, refreshToken } = signTokens(user.id, false)
    res.json({ success: true, data: { accessToken, refreshToken, email: user.email } })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/auth/register — 익명 계정을 이메일 계정으로 업그레이드
router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (!user) {
      res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      return
    }
    if (!user.isAnonymous) {
      res.status(400).json({ success: false, message: '이미 등록된 계정입니다.' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ success: false, message: '이미 사용 중인 이메일입니다.' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email, password: hashedPassword, isAnonymous: false, deviceId: null },
    })

    const { accessToken, refreshToken } = signTokens(updated.id, false)
    res.json({ success: true, data: { accessToken, refreshToken, email: updated.email } })
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
      { userId: user.id, isAnonymous: user.isAnonymous },
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
      select: { id: true, email: true, isAnonymous: true, createdAt: true },
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
