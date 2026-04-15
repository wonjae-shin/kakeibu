import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { parseNotification } from '../utils/notificationParser.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/notifications/ingest
// Tasker/Macrodroid에서 JWT 토큰과 함께 알림 텍스트 전송 → pending 알림으로 저장
// Body: { text, appName }
router.post('/ingest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { text, appName = '' } = req.body as { text?: string; appName?: string }

    if (!text) {
      res.status(400).json({ success: false, message: '알림 텍스트가 필요합니다' })
      return
    }

    const parsed = parseNotification(text, appName)
    if (!parsed?.amount) {
      res.json({ success: true, data: null, message: '금액을 파싱할 수 없어 무시됨' })
      return
    }

    const notification = await prisma.notification.create({
      data: {
        raw: text,
        appName: appName || null,
        amount: parsed.amount,
        merchant: parsed.merchant || null,
        cardName: parsed.cardName || null,
        type: parsed.type,
        status: 'pending',
        userId,
      },
    })

    res.json({ success: true, data: { id: notification.id, status: 'pending' } })
  } catch (e) {
    res.status(500).json({ success: false, message: (e as Error).message })
  }
})

// GET /api/notifications
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { status } = req.query

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(status ? { status: status as string } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json({ success: true, data: notifications })
  } catch (e) {
    res.status(500).json({ success: false, message: (e as Error).message })
  }
})

// GET /api/notifications/pending-count
router.get('/pending-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const count = await prisma.notification.count({
      where: { userId, status: 'pending' },
    })
    res.json({ success: true, data: { count } })
  } catch (e) {
    res.status(500).json({ success: false, message: (e as Error).message })
  }
})

// POST /api/notifications/:id/confirm
router.post('/:id/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    const { categoryId, accountId, amount, memo, date, type } = req.body as {
      categoryId: string
      accountId: string
      amount?: number
      memo?: string
      date?: string
      type?: string
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    })
    if (!notification) {
      res.status(404).json({ success: false, message: '알림을 찾을 수 없습니다' })
      return
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: type || notification.type,
        amount: amount ?? notification.amount ?? 0,
        memo: memo || notification.merchant || '',
        date: date || new Date().toISOString().slice(0, 10),
        categoryId,
        accountId,
        userId,
      },
      include: { category: true, account: true },
    })

    await prisma.notification.update({
      where: { id },
      data: { status: 'confirmed', transactionId: transaction.id },
    })

    res.json({ success: true, data: transaction })
  } catch (e) {
    res.status(500).json({ success: false, message: (e as Error).message })
  }
})

// PATCH /api/notifications/:id/dismiss
router.patch('/:id/dismiss', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId
    const { id } = req.params

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'dismissed' },
    })

    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: (e as Error).message })
  }
})

export default router
