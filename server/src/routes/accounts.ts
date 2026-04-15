import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

// GET /api/accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: accounts })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// POST /api/accounts
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, balance } = req.body as { name: string; type: string; balance?: number }
    if (!name || !type) {
      res.status(400).json({ success: false, message: '이름과 타입을 입력해주세요.' })
      return
    }
    const accCount = await prisma.account.count({ where: { userId: req.user.userId } })
    if (accCount >= 20) {
      res.status(400).json({ success: false, message: '계좌는 최대 20개까지 추가할 수 있습니다.' })
      return
    }
    const account = await prisma.account.create({
      data: { name, type, balance: balance ?? 0, userId: req.user.userId },
    })
    res.status(201).json({ success: true, data: account })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// PUT /api/accounts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.params.id } })
    if (!account || account.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '계좌를 찾을 수 없습니다.' })
      return
    }
    const { name, type, balance } = req.body as { name: string; type: string; balance: number }
    const updated = await prisma.account.update({
      where: { id: req.params.id },
      data: { name, type, balance },
    })
    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

// DELETE /api/accounts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.params.id } })
    if (!account || account.userId !== req.user.userId) {
      res.status(404).json({ success: false, message: '계좌를 찾을 수 없습니다.' })
      return
    }
    await prisma.account.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: '계좌가 삭제되었습니다.' })
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

export default router
